"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { CheckCircle, Mail, Clock, RefreshCcw } from "lucide-react"

export default function ConfirmEmailContent({ initialEmail }: { initialEmail: string }) {
  const router = useRouter()
  const [email, setEmail] = useState(initialEmail)
  const [secondsLeft, setSecondsLeft] = useState(15 * 60)
  const [sending, setSending] = useState(false)

  const minutes = useMemo(() => Math.floor(secondsLeft / 60), [secondsLeft])
  const seconds = useMemo(() => secondsLeft % 60, [secondsLeft])
  const progressPct = useMemo(() => Math.min(100, Math.max(0, ((15 * 60 - secondsLeft) / (15 * 60)) * 100)), [secondsLeft])

  useEffect(() => {
    setEmail(initialEmail)
  }, [initialEmail])

  useEffect(() => {
    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  async function resend() {
    if (!email) {
      toast.error("Ingresá tu email para reenviar")
      return
    }
    setSending(true)
    const { error } = await supabase.auth.resend({ type: "signup", email })
    setSending(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success("Correo de verificación reenviado")
  }

  async function checkVerification() {
    const { data } = await supabase.auth.getUser()
    const u = data.user
    if (u && u.email_confirmed_at) {
      toast.success("Email verificado correctamente")
      router.replace("/login?verified=1")
      return
    }
    toast.error("Tu email aún no está verificado")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="text-accent" />
          <h1 className="text-2xl font-bold">Por favor verifique su dirección de email</h1>
        </div>
        <p className="text-muted-foreground">
          Enviamos un correo de verificación a {email || "tu email"}. Revisá tu bandeja de entrada y hacé clic en el enlace de verificación.
        </p>

        <div className="border border-border rounded-lg p-3 space-y-2">
          <ol className="list-decimal list-inside space-y-1">
            <li>Abrí tu correo y buscá el mensaje de verificación</li>
            <li>Hacé clic en el enlace de verificación dentro del correo</li>
            <li>Volvé aquí o continuá iniciando sesión con tu cuenta</li>
          </ol>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="flex items-center justify-between">
          <Button onClick={resend} disabled={sending} variant="secondary" className="flex items-center gap-2">
            <RefreshCcw className="w-4 h-4" />
            {sending ? "Reenviando..." : "Reenviar correo"}
          </Button>
          <Button onClick={checkVerification} className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Ya verifiqué
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Tiempo restante: {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}</span>
          </div>
          <div className="w-full h-2 bg-muted rounded">
            <div className="h-2 bg-accent rounded" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">1</div>
            <span className="text-xs">Registro</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-background">2</div>
            <span className="text-xs">Verificación</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">3</div>
            <span className="text-xs">Login</span>
          </div>
        </div>
      </div>
    </div>
  )
}

