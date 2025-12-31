"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSession, signOut } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

export default function AdminPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const run = async () => {
      const session = await getSession()
      if (!session) {
        router.replace("/login")
        return
      }
      setReady(true)
    }
    void run()
  }, [router])

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
        <p className="text-muted-foreground">Seleccioná una sección para gestionar el catálogo.</p>
      </main>
    </div>
  )
}

