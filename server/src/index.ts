import express from "express"
import cors from "cors"
import helmet from "helmet"
import multer from "multer"
import sharp from "sharp"
import csurf from "csurf"
import cookieParser from "cookie-parser"
import { createClient } from "@supabase/supabase-js"

const {
  SUPABASE_URL = "",
  SUPABASE_SERVICE_ROLE_KEY = "",
  SUPABASE_STORAGE_BUCKET = "images",
  CSRF_SECRET = "change-me",
  ALLOWED_ORIGIN = "*",
  PORT = "4000",
} = process.env
const { GOOGLE_SHEETS_API_KEY = "", GOOGLE_SHEETS_ID = "" } = process.env

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const app = express()
app.use(helmet())
app.use(cors({ origin: ALLOWED_ORIGIN, credentials: true }))
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

app.use(cookieParser(CSRF_SECRET))
const csrfProtection = csurf({ cookie: true, ignoreMethods: ["GET", "HEAD", "OPTIONS"] })

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  storage: multer.memoryStorage(),
})

app.get("/health", (_req, res) => res.json({ ok: true }))
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  // @ts-ignore
  res.json({ csrfToken: req.csrfToken() })
})

// Productos CRUD
app.get("/api/products", async (_req, res) => {
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  return res.json({ products: data })
})

app.post("/api/products", csrfProtection, async (req, res) => {
  const { nombre, descripcion, categoria, sku, variantes, catalog_id } = req.body || {}
  if (!nombre || !sku) return res.status(400).json({ error: "Nombre y SKU son obligatorios" })
  const { error } = await supabase.from("products").insert({
    nombre: sanitize(nombre),
    descripcion: sanitize(descripcion || ""),
    categoria: sanitize(categoria || ""),
    sku: sanitize(sku),
    variantes: variantes ?? null,
    catalog_id,
  })
  if (error) return res.status(500).json({ error: error.message })
  return res.status(201).json({ ok: true })
})

app.put("/api/products/:id", csrfProtection, async (req, res) => {
  const { id } = req.params
  const { nombre, descripcion, categoria, sku, variantes } = req.body || {}
  const { error } = await supabase
    .from("products")
    .update({
      nombre: sanitize(nombre),
      descripcion: sanitize(descripcion || ""),
      categoria: sanitize(categoria || ""),
      sku: sanitize(sku),
      variantes: variantes ?? null,
    })
    .eq("id", id)
  if (error) return res.status(500).json({ error: error.message })
  return res.json({ ok: true })
})

app.delete("/api/products/:id", csrfProtection, async (req, res) => {
  const { id } = req.params
  const { error } = await supabase.from("products").delete().eq("id", id)
  if (error) return res.status(500).json({ error: error.message })
  return res.json({ ok: true })
})

// Upload imágenes: convierte a WebP, genera tamaños y sube a Storage
app.post("/api/products/:id/images", csrfProtection, upload.array("images", 10), async (req, res) => {
  const { id } = req.params
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: "Sin archivos" })
  const files = req.files as Express.Multer.File[]

  const sizes = [
    { suffix: "thumb", width: 256 },
    { suffix: "md", width: 1024 },
    { suffix: "lg", width: 2048 },
  ]

  const uploadedPaths: string[] = []
  for (const file of files) {
    for (const size of sizes) {
      const webp = await sharp(file.buffer).resize({ width: size.width }).webp({ quality: 80 }).toBuffer()
      const path = `products/${id}/${Date.now()}-${size.suffix}.webp`
      const { error } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).upload(path, webp, {
        contentType: "image/webp",
        upsert: false,
      })
      if (error) return res.status(500).json({ error: error.message })
      uploadedPaths.push(path)
    }
  }

  const publicUrls = uploadedPaths.map((p) => getPublicUrl(p))

  const { error: updateErr } = await supabase
    .from("images")
    .insert(publicUrls.map((url) => ({ product_id: id, url })))
  if (updateErr) return res.status(500).json({ error: updateErr.message })

  return res.status(201).json({ urls: publicUrls })
})

// Export CSV/JSON desde Supabase
app.get("/api/export/json", async (_req, res) => {
  const { data, error } = await supabase.from("products").select("*, images(url)")
  if (error) return res.status(500).json({ error: error.message })
  return res.json({ products: data })
})

app.get("/api/export/csv", async (_req, res) => {
  const { data, error } = await supabase.from("products").select("*")
  if (error) return res.status(500).json({ error: error.message })
  const csv = toCSV(data || [])
  res.setHeader("Content-Type", "text/csv")
  res.setHeader("Content-Disposition", "attachment; filename=productos.csv")
  return res.send(csv)
})

// Importar desde Google Sheets a Supabase (simple)
app.post("/api/import/sheets", csrfProtection, async (_req, res) => {
  if (!GOOGLE_SHEETS_API_KEY || !GOOGLE_SHEETS_ID) {
    return res.status(400).json({ error: "GOOGLE_SHEETS_API_KEY/ID no configurados" })
  }
  const sheetNames = ["Paletas de Padel", "Bolsos y Mochilas", "Accesorios y zapatillas", "Pelotas Padel"]
  const imported: number[] = []
  for (const sheetName of sheetNames) {
    const encodedRange = encodeURIComponent(`'${sheetName}'!A:L`)
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_ID}/values/${encodedRange}?key=${GOOGLE_SHEETS_API_KEY}`
    const resp = await fetch(url)
    if (!resp.ok) continue
    const data = await resp.json()
    const rows: string[][] = (data.values || []).slice(1)
    let count = 0
    for (const row of rows) {
      const nombre = (row[1] || "").trim()
      const sku = (row[8] || "").trim()
      const categoria = sheetName
      if (!nombre || !sku || sku === "SKU") continue
      const { error } = await supabase
        .from("products")
        .upsert({ nombre, sku, categoria }, { onConflict: "sku" })
      if (!error) count++
    }
    imported.push(count)
  }
  return res.json({ imported })
})

function getPublicUrl(path: string) {
  const { data } = supabase.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

function sanitize(input: string) {
  return String(input || "")
    .replace(/[<>]/g, "")
    .trim()
}

function toCSV(rows: any[]) {
  if (!rows.length) return ""
  const headers = Object.keys(rows[0])
  const lines = [headers.join(",")]
  for (const r of rows) {
    lines.push(
      headers
        .map((h) => {
          const val = r[h] ?? ""
          const s = String(val).replace(/"/g, '""')
          return `"${s}"`
        })
        .join(","),
    )
  }
  return lines.join("\n")
}

app.listen(Number(PORT), () => {
  console.log(`Backend escuchando en puerto ${PORT}`)
})
