// lib/google-sheets.ts
import { getProductImages } from "./product-images"

const SPREADSHEET_ID =
  process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID || "1u0I-cNFvJd02JbcUImOGQq0MYs_XkYWry3vJZz82uYs"

export interface Product {
  id: string
  nombre: string
  sku: string
  marca: string
  stock: number
  precio1: string
  precio2: string
  precio3: string
  precio1Label: string
  precio2Label: string
  precio3Label: string
  urlImagenes: string[]
  categoria: string
  año?: string
  nivelDeJuego?: string
}

export async function fetchProductsFromSheets(): Promise<Product[]> {
  try {
    // ✅ Evita caché/dedupe del browser y proxies
    const ts = Date.now()
    const response = await fetch(`/api/products?_ts=${ts}`, {
      cache: "no-store",
      headers: { "cache-control": "no-cache" },
    })

    if (!response.ok) {
      console.error("Failed to fetch products from API. Status:", response.status)
      return []
    }

    const data = await response.json()
    const rawProducts = data.products || []

    return rawProducts.map((product: any) => ({
      id: product.id,
      nombre: product.nombre || "",
      sku: product.sku || "",
      marca: product.marca || "",
      stock: typeof product.stock === "number" && !isNaN(product.stock) ? product.stock : 0,
      precio1: product.precio1 || "",
      precio2: product.precio2 || "",
      precio3: product.precio3 || "",
      precio1Label: product.precio1Label || "",
      precio2Label: product.precio2Label || "",
      precio3Label: product.precio3Label || "",
      urlImagenes: getProductImages(product.sku),
      categoria: product.categoria || "",
      año: product.año || undefined,
      nivelDeJuego: product.nivelDeJuego || undefined,
    }))
  } catch (error) {
    console.error("Error fetching products:", error)
    return []
  }
}
