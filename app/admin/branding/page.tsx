"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase, getSession } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function BrandingAdminPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [primaryColor, setPrimaryColor] = useState("#000000")
  const [secondaryColor, setSecondaryColor] = useState("#ffffff")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [catalogId, setCatalogId] = useState<string>("")

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

  async function saveBranding() {
    if (!catalogId) {
      toast.error("Debes indicar el catálogo")
      return
    }
    let logoUrl: string | undefined
    if (logoFile) {
      const path = `branding/${catalogId}/${Date.now()}-${logoFile.name}`
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
      .upsert({ catalog_id: catalogId, logo_url: logoUrl, primary_color: primaryColor, secondary_color: secondaryColor })
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success("Branding guardado")
  }

  if (!ready) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Marca</h2>
          <Button variant="secondary" onClick={() => router.push("/admin")}>
            Volver
          </Button>
        </div>
        <div className="border border-border rounded-lg p-4 space-y-4">
          <div>
            <Label htmlFor="catalogId">Catálogo</Label>
            <Input id="catalogId" value={catalogId} onChange={(e) => setCatalogId(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="logo">Logo (PNG, JPG, SVG)</Label>
            <Input id="logo" type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primaryColor">Color principal</Label>
              <Input id="primaryColor" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="secondaryColor">Color secundario</Label>
              <Input id="secondaryColor" type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} />
            </div>
          </div>
          <Button onClick={saveBranding}>Guardar</Button>
        </div>
      </div>
    </div>
  )
}

