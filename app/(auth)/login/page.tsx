"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Debe incluir 1 mayúscula")
    .regex(/[0-9]/, "Debe incluir 1 número"),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })
    setLoading(false)
    if (error) {
      const msg =
        /Email not confirmed/i.test(error.message) || /invalid_grant/i.test(error.message)
          ? "Debes verificar tu email. Revisá tu correo o verifica con código."
          : error.message
      toast.error(msg)
      return
    }
    router.replace("/admin")
  }

  async function loginWithGoogle() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    })
    setLoading(false)
    if (error) toast.error(error.message)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-4">Acceder</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="tu@correo.com" {...register("email")} />
            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" placeholder="********" {...register("password")} />
            {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Procesando..." : "Ingresar"}
          </Button>
        </form>
        <div className="mt-6">
          <Button onClick={loginWithGoogle} variant="secondary" className="w-full">
            Continuar con Google
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          ¿No tenés cuenta? <a href="/register" className="underline">Registrate</a>
        </p>
      </div>
    </div>
  )
}
