"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function VerifyPage() {
  const params = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const e = params.get("email")
    if (e) setEmail(e)
  }, [params])

  async function verify() {
    if (!email || !code) {
      toast.error("Email y código son requeridos")
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    } as any)
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success("Verificación exitosa")
    router.replace("/admin")
  }

  async function resend() {
    if (!email) {
      toast.error("Email requerido")
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success("Reenviamos el código a tu email")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-4">Verificar email</h1>
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
          </div>
          <div>
            <Label htmlFor="code">Código</Label>
            <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ingresa el código recibido" />
          </div>
          <Button onClick={verify} disabled={loading} className="w-full">
            {loading ? "Verificando..." : "Verificar"}
          </Button>
          <Button onClick={resend} variant="secondary" disabled={loading} className="w-full">
            Reenviar código
          </Button>
        </div>
      </div>
    </div>
  )
}

