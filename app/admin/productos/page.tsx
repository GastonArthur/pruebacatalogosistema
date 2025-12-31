"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase, getSession } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"

type ProductRow = {
  id: string
  nombre: string
  descripcion: string
  categoria: string
  sku: string
  variantes?: any
}

export default function ProductosAdminPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [products, setProducts] = useState<ProductRow[]>([])
  const [creating, setCreating] = useState(false)
  const [catalogs, setCatalogs] = useState<{ id: string; name: string }[]>([])
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>("")
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    categoria: "",
    sku: "",
  })
  const [csrfToken, setCsrfToken] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      const session = await getSession()
      if (!session) {
        router.replace("/login")
        return
      }
      setReady(true)
      await refreshCsrf()
      await loadCatalogs()
      await loadProducts()
    }
    void run()
  }, [router])

  async function loadCatalogs() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const userId = user?.id
    const { data } = await supabase.from("catalogs").select("id,name").eq("user_id", userId).order("created_at", { ascending: true })
    const list = (data || []) as any
    setCatalogs(list)
    if (!selectedCatalogId && list.length) setSelectedCatalogId(list[0].id)
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

  async function loadProducts() {
    let query = supabase.from("products").select("*").order("created_at", { ascending: false })
    if (selectedCatalogId) query = query.eq("catalog_id", selectedCatalogId)
    const { data, error } = await query
    if (error) {
      toast.error(error.message)
      return
    }
    setProducts(data as ProductRow[])
  }

  async function createProduct() {
    setCreating(true)
    const payload = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      categoria: form.categoria,
      sku: form.sku,
      catalog_id: selectedCatalogId,
    }
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
    await loadProducts()
    toast.success("Producto creado")
    await refreshCsrf()
  }

  async function exportJSON() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/export/json`)
      if (!res.ok) throw new Error("Error al exportar JSON")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "productos.json"
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  async function exportCSV() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/export/csv`)
      if (!res.ok) throw new Error("Error al exportar CSV")
      const text = await res.text()
      const blob = new Blob([text], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "productos.csv"
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  async function uploadImages(productId: string, files: FileList | null) {
    if (!files || files.length === 0) return
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

  if (!ready) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Productos</h2>
          <Button variant="secondary" onClick={() => router.push("/admin")}>
            Volver
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Crear producto</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="catalog">Catálogo</Label>
                <select
                  id="catalog"
                  className="w-full px-2 py-1.5 border border-border rounded"
                  value={selectedCatalogId}
                  onChange={(e) => setSelectedCatalogId(e.target.value)}
                >
                  {catalogs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="categoria">Categoría</Label>
                <Input
                  id="categoria"
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
              <Button onClick={createProduct} disabled={creating}>
                {creating ? "Creando…" : "Crear"}
              </Button>
            </div>
          </div>

          <div className="border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Listado</h3>
            <div className="flex gap-2 mb-4">
              <Button variant="secondary" onClick={exportJSON}>
                Exportar JSON
              </Button>
              <Button variant="secondary" onClick={exportCSV}>
                Exportar CSV
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
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
                }}
              >
                Importar desde Sheets
              </Button>
            </div>
            <ul className="space-y-3">
              {products.map((p) => (
                <li key={p.id} className="border border-border rounded p-3">
                  <div className="font-semibold">{p.nombre}</div>
                  <div className="text-sm text-muted-foreground">{p.sku}</div>
                  <div className="text-sm">{p.categoria}</div>
                  <div className="mt-2">
                    <Label htmlFor={`img-${p.id}`}>Subir imágenes (máx. 10)</Label>
                    <Input id={`img-${p.id}`} type="file" multiple accept="image/*" onChange={(e) => uploadImages(p.id, e.target.files)} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
