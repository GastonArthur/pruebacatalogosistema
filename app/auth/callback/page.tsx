"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSession } from "@/lib/supabase"

export default function AuthCallback() {
  const router = useRouter()
  useEffect(() => {
    const run = async () => {
      const session = await getSession()
      if (session) {
        router.replace("/admin")
      } else {
        router.replace("/login")
      }
    }
    void run()
  }, [router])
  return <div className="min-h-screen flex items-center justify-center">Procesando autenticación…</div>
}
