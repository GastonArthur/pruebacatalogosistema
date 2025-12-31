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
  fullName: z.string().min(3, "Mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Debe incluir 1 mayúscula")
    .regex(/[0-9]/, "Debe incluir 1 número"),
})

type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    const { error: signUpError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.fullName },
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
      },
    })
    if (signUpError) {
      setLoading(false)
      toast.error(signUpError.message)
      return
    }
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: values.email,
      options: { shouldCreateUser: false },
    })
    setLoading(false)
    if (otpError) {
      toast.error(otpError.message)
      return
    }
    toast.success("Te enviamos un código de verificación a tu email.")
    router.replace(`/auth/verify?email=${encodeURIComponent(values.email)}`)
  }

  async function signupWithGoogle() {
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
        <h1 className="text-2xl font-bold mb-4">Registrarse</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input id="fullName" type="text" placeholder="Juan Pérez" {...register("fullName")} />
            {errors.fullName && <p className="text-sm text-red-600 mt-1">{errors.fullName.message}</p>}
          </div>
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
            {loading ? "Procesando..." : "Crear cuenta"}
          </Button>
        </form>
        <div className="mt-6">
          <Button onClick={signupWithGoogle} variant="secondary" className="w-full">
            Registrarse con Google
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          ¿Ya tenés cuenta? <a href="/login" className="underline">Iniciar sesión</a>
        </p>
      </div>
    </div>
  )
}
