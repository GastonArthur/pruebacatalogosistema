"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSession, signOut, supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function AdminPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [catalogs, setCatalogs] = useState<{ id: string; name: string }[]>([])
  const [newCatalogName, setNewCatalogName] = useState("")

  useEffect(() => {
    const run = async () => {
      const session = await getSession()
      if (!session) {
        router.replace("/login")
        return
      }
      setReady(true)
      await loadCatalogs()
    }
    void run()
  }, [router])

  async function loadCatalogs() {
    const { data } = await supabase.from("catalogs").select("id,name").order("created_at", { ascending: true })
    setCatalogs((data || []) as any)
  }

  async function createCatalog() {
    if (!newCatalogName.trim()) return
    const { error } = await supabase.from("catalogs").insert({ name: newCatalogName })
    if (!error) {
      setNewCatalogName("")
      await loadCatalogs()
    }
  }

  if (!ready) return null

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">Panel de Administración</h1>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.push("/admin/productos")}>
              Productos
            </Button>
            <Button variant="secondary" onClick={() => router.push("/admin/branding")}>
              Marca
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
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-border rounded-lg p-4">
            <h2 className="font-semibold mb-4">Tus catálogos</h2>
            <ul className="space-y-3">
              {catalogs.map((c) => (
                <li key={c.id} className="border border-border rounded p-3">
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-sm text-muted-foreground">{`${typeof window !== "undefined" ? window.location.origin : ""}/catalog/${c.id}`}</div>
                  <div className="mt-2 flex gap-2">
                    <Button variant="secondary" onClick={() => router.push(`/admin/productos?catalog=${c.id}`)}>
                      Gestionar productos
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const link = `${typeof window !== "undefined" ? window.location.origin : ""}/catalog/${c.id}`
                        navigator.clipboard.writeText(link)
                      }}
                    >
                      Copiar link
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="border border-border rounded-lg p-4">
            <h2 className="font-semibold mb-4">Crear catálogo</h2>
            <div className="space-y-3">
              <div>
                <Label htmlFor="catalogName">Nombre</Label>
                <Input id="catalogName" value={newCatalogName} onChange={(e) => setNewCatalogName(e.target.value)} />
              </div>
              <Button onClick={createCatalog}>Crear</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
