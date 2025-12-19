"use client"

import { useState, useEffect } from "react"
import { CatalogPage } from "@/components/catalog-page"
import { CartProvider } from "@/context/cart-context"

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <CartProvider>
      <CatalogPage />
    </CartProvider>
  )
}
