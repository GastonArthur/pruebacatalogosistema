"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSession } from "@/lib/supabase"
import { toast } from "sonner"

export default function AuthCallback() {
  const router = useRouter()
  useEffect(() => {
    const run = async () => {
      const session = await getSession()
      if (session) {
        toast.success("Email verificado correctamente")
        router.replace("/login?verified=1")
      } else {
        router.replace("/login")
      }
    }
    void run()
  }, [router])
  return <div className="min-h-screen flex items-center justify-center">Procesando autenticación…</div>
}
