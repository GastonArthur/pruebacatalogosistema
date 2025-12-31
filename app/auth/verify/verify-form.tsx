"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function VerifyForm({ initialEmail }: { initialEmail: string }) {
  const router = useRouter()
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setEmail(initialEmail)
  }, [initialEmail])

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
    const { data: userData } = await supabase.auth.getUser()
    const u = userData.user
    if (u) {
      await supabase
        .from("profiles")
        .upsert({ id: u.id, email: email, full_name: (u.user_metadata as any)?.full_name })
    }
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

