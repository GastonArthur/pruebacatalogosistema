"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { getSession, signOut, supabase, getAppBaseUrl } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"

type Catalog = { id: string; name: string }
type Branding = { logo_url?: string | null; primary_color?: string | null; secondary_color?: string | null }
type ProductRow = { id: string; nombre: string; descripcion?: string; categoria: string; sku: string }

export default function AdminPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [branding, setBranding] = useState<Branding>({})
  const [products, setProducts] = useState<ProductRow[]>([])
  const [creating, setCreating] = useState(false)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [form, setForm] = useState({ nombre: "", descripcion: "", categoria: "", sku: "" })
  const [colorPrimary, setColorPrimary] = useState("#0ea5e9")
  const [colorSecondary, setColorSecondary] = useState("#10b981")
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const shareUrl = useMemo(() => {
    const base = getAppBaseUrl()
    return catalog ? `${base}/catalog/${catalog.id}` : ""
  }, [catalog])

  useEffect(() => {
    const run = async () => {
      const session = await getSession()
      if (!session) {
        router.replace("/login")
        return
      }
      await ensureSingleCatalog()
      await refreshCsrf()
      await loadBranding()
      await loadProducts()
      setReady(true)
    }
    void run()
  }, [router])

  async function ensureSingleCatalog() {
    const { data } = await supabase.from("catalogs").select("id,name").order("created_at", { ascending: true })
    const list = (data || []) as Catalog[]
    if (!list.length) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const userId = user?.id
      const { data: inserted, error } = await supabase
        .from("catalogs")
        .insert({ user_id: userId, name: "Mi Catálogo" })
        .select("id,name")
        .single()
      if (error) {
        toast.error(error.message)
        return
      }
      setCatalog(inserted as Catalog)
      return
    }
    setCatalog(list[0])
  }

  async function refreshCsrf() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/csrf-token`, { credentials: "include" })
      const json = await res.json()
      setCsrfToken(json.csrfToken || null)
    } catch {
      setCsrfToken(null)
    }
  }

  async function loadBranding() {
    if (!catalog) return
    const { data } = await supabase.from("branding").select("*").eq("catalog_id", catalog.id).maybeSingle()
    const b = (data || {}) as Branding
    setBranding(b)
    setColorPrimary(b.primary_color || colorPrimary)
    setColorSecondary(b.secondary_color || colorSecondary)
  }

  async function saveBranding() {
    if (!catalog) return
    let logoUrl = branding.logo_url || undefined
    if (logoFile) {
      const path = `branding/${catalog.id}/${Date.now()}-${logoFile.name}`
      const { error: upErr } = await supabase.storage.from("images").upload(path, logoFile, {
        upsert: true,
        contentType: logoFile.type,
      })
      if (upErr) {
        toast.error(upErr.message)
        return
      }
      const { data } = supabase.storage.from("images").getPublicUrl(path)
      logoUrl = data.publicUrl
    }
    const { error } = await supabase
      .from("branding")
      .upsert({
        catalog_id: catalog.id,
        logo_url: logoUrl,
        primary_color: colorPrimary,
        secondary_color: colorSecondary,
      })
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success("Branding actualizado")
    await loadBranding()
  }

  async function loadProducts() {
    if (!catalog) return
    const { data, error } = await supabase.from("products").select("*").eq("catalog_id", catalog.id).order("created_at", { ascending: false })
    if (error) {
      toast.error(error.message)
      return
    }
    setProducts((data || []) as ProductRow[])
  }

  async function createProduct() {
    if (!catalog) return
    setCreating(true)
    const payload = { ...form, catalog_id: catalog.id }
    const res = await fetch(`${BACKEND_URL}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "csrf-token": csrfToken } : {}),
      },
      body: JSON.stringify(payload),
      credentials: "include",
    })
    setCreating(false)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || "Error al crear producto")
      return
    }
    setForm({ nombre: "", descripcion: "", categoria: "", sku: "" })
    toast.success("Producto creado")
    await loadProducts()
    await refreshCsrf()
  }

  async function exportJSON() {
    const res = await fetch(`${BACKEND_URL}/api/export/json`)
    if (!res.ok) {
      toast.error("Error al exportar JSON")
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "productos.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  async function exportCSV() {
    const res = await fetch(`${BACKEND_URL}/api/export/csv`)
    if (!res.ok) {
      toast.error("Error al exportar CSV")
      return
    }
    const text = await res.text()
    const blob = new Blob([text], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "productos.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importSheets() {
    await refreshCsrf()
    const res = await fetch(`${BACKEND_URL}/api/import/sheets`, {
      method: "POST",
      headers: {
        ...(csrfToken ? { "csrf-token": csrfToken } : {}),
      },
      credentials: "include",
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || "Error al importar de Sheets")
      return
    }
    toast.success("Importación iniciada")
    await loadProducts()
  }

  async function uploadImages(productId: string, files: FileList | null) {
    if (!files || !files.length) return
    const formData = new FormData()
    Array.from(files).forEach((f) => formData.append("images", f))
    const res = await fetch(`${BACKEND_URL}/api/products/${productId}/images`, {
      method: "POST",
      body: formData,
      headers: {
        ...(csrfToken ? { "csrf-token": csrfToken } : {}),
      },
      credentials: "include",
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || "Error al subir imágenes")
      return
    }
    toast.success("Imágenes subidas")
    await refreshCsrf()
  }

  if (!ready || !catalog) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <header className="border-b border-slate-700 bg-slate-900/60 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400" />
            <h1 className="text-xl font-bold">Panel de Administración</h1>
          </div>
          <div className="flex items-center gap-2">
            <a href={shareUrl} target="_blank" rel="noreferrer" className="text-sm underline underline-offset-4">
              {shareUrl}
            </a>
            <Button
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl)
                toast.success("Link copiado")
              }}
            >
              Copiar link
            </Button>
            <Button
              onClick={async () => {
                await signOut()
                router.replace("/login")
              }}
            >
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-slate-800 border-slate-700 p-4">
            <h2 className="text-lg font-semibold mb-4">Marca y apariencia</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="catalogName">Nombre del catálogo</Label>
                <Input
                  id="catalogName"
                  value={catalog.name}
                  onChange={async (e) => {
                    const name = e.target.value
                    setCatalog({ ...catalog, name })
                    await supabase.from("catalogs").update({ name }).eq("id", catalog.id)
                  }}
                />
              </div>
              <div>
                <Label htmlFor="logo">Logo</Label>
                <Input id="logo" type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
                {branding.logo_url ? <img src={branding.logo_url} alt="Logo" className="mt-2 h-12" /> : null}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="primaryColor">Color principal</Label>
                  <Input id="primaryColor" type="color" value={colorPrimary} onChange={(e) => setColorPrimary(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="secondaryColor">Color secundario</Label>
                  <Input id="secondaryColor" type="color" value={colorSecondary} onChange={(e) => setColorSecondary(e.target.value)} />
                </div>
              </div>
              <Button variant="secondary" onClick={saveBranding}>
                Guardar apariencia
              </Button>
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-4">
            <h2 className="text-lg font-semibold mb-4">Crear producto</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea id="descripcion" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="categoria">Categoría</Label>
                <Input id="categoria" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
              <Button onClick={createProduct} disabled={creating}>
                {creating ? "Creando…" : "Crear"}
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={exportJSON}>
                  Exportar JSON
                </Button>
                <Button variant="secondary" onClick={exportCSV}>
                  Exportar CSV
                </Button>
                <Button variant="secondary" onClick={importSheets}>
                  Importar desde Sheets
                </Button>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-4">
            <h2 className="text-lg font-semibold mb-4">Productos</h2>
            <ul className="space-y-3">
              {products.map((p) => (
                <li key={p.id} className="rounded border border-slate-700 p-3">
                  <div className="font-semibold">{p.nombre}</div>
                  <div className="text-xs text-slate-300">{p.sku}</div>
                  <div className="text-xs">{p.categoria}</div>
                  <div className="mt-2">
                    <Label htmlFor={`img-${p.id}`}>Subir imágenes (máx. 10)</Label>
                    <Input id={`img-${p.id}`} type="file" multiple accept="image/*" onChange={(e) => uploadImages(p.id, e.target.files)} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </main>
    </div>
  )
}
