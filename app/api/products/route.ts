// app/api/products/route.ts
import { type NextRequest, NextResponse } from "next/server"

// ✅ OBLIGATORIO: fuerza a Next a NO cachear esta route
export const dynamic = "force-dynamic"
export const revalidate = 0

const SPREADSHEET_ID = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY || "AIzaSyDesCADKpwTYViq4jt01unINJBvvDastZc"

export interface Product {
  id: string
  nombre: string
  sku: string
  marca: string
  año: string
  nivelDeJuego: string
  descripcion: string
  stock: number
  stockStatus: string
  precio1: string
  precio1Label: string
  precio2: string
  precio2Label: string
  precio3: string
  precio3Label: string
  categoria: string
  isZapatilla: boolean
  urlImagenes: string[]
}

const DEFAULT_PRICE_RANGES = {
  labels: ["+20", "10-19", "4-9"],
  quantities: ["+20 unidades", "10 a 19 unidades", "4 a 9 unidades"],
}

const ACCESSORY_MIN_PRICE_RANGES = {
  labels: ["60+", "41-59", "20-40"],
  quantities: ["60 o más unidades", "41 a 59 unidades", "20 a 40 unidades"],
}

const CATEGORY_SHEET_NAMES: Record<string, boolean> = {
  "Paletas de Padel": true,
  "Bolsos y Mochilas": true,
  "Accesorios y zapatillas": true,
  "Pelotas Padel": true,
}

export async function GET(request: NextRequest) {
  if (!SPREADSHEET_ID || !API_KEY) {
    return NextResponse.json(
      { error: "Google Sheets credentials not configured", products: [] },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  }

  try {
    const sheetNames = Object.keys(CATEGORY_SHEET_NAMES)
    const allProducts: Product[] = []

    for (const sheetName of sheetNames) {
      // Pedimos de la columna A hasta la L (index 0 a 11)
      const encodedRange = encodeURIComponent(`'${sheetName}'!A:L`)
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodedRange}?key=${API_KEY}`

      // ✅ CRÍTICO: NO CACHEAR la consulta a Google Sheets
      // cache: "no-store" fuerza request real (sin revalidate)
      const response = await fetch(url, { cache: "no-store" })

      if (!response.ok) {
        console.error("Sheets fetch failed:", sheetName, response.status)
        continue
      }

      const data = await response.json()

      if (data.values && data.values.length > 1) {
        const products = data.values.slice(1)

        products.forEach((row: string[]) => {
          const nombre = row[1]?.trim() || ""
          const sku = row[8]?.trim() || ""

          if (nombre && sku && sku.length > 2 && sku !== "SKU") {
            const marca = extractBrand(nombre)

            const rawPrecio1 = row[2]?.trim() || ""
            const rawPrecio2 = row[3]?.trim() || ""
            const rawPrecio3 = row[4]?.trim() || ""

            const availablePrices = [rawPrecio1, rawPrecio2, rawPrecio3].filter(
              (p) => p && p !== "-" && p !== "0" && p !== "$0",
            )
            const fallbackPrice = availablePrices[0] || "0"

            const precio1 = rawPrecio1 && rawPrecio1 !== "-" && rawPrecio1 !== "0" ? rawPrecio1 : fallbackPrice
            const precio2 = rawPrecio2 && rawPrecio2 !== "-" && rawPrecio2 !== "0" ? rawPrecio2 : fallbackPrice
            const precio3 = rawPrecio3 && rawPrecio3 !== "-" && rawPrecio3 !== "0" ? rawPrecio3 : fallbackPrice

            const isCurrentProductZapatilla =
              sheetName === "Accesorios y zapatillas" && nombre.toLowerCase().includes("zapatilla")

            let currentPriceRanges
            if (sheetName === "Accesorios y zapatillas") {
              currentPriceRanges = isCurrentProductZapatilla ? DEFAULT_PRICE_RANGES : ACCESSORY_MIN_PRICE_RANGES
            } else {
              currentPriceRanges = DEFAULT_PRICE_RANGES
            }

            const rawStock = String(row[7] || "").trim()
            const parsedStock = Number.parseInt(rawStock, 10)
            const stockValue = isNaN(parsedStock) ? 0 : parsedStock
            const stockStatus = stockValue > 0 ? "Con stock" : "Sin stock"

            // Imágenes (Columna K / Index 10)
            const rawImages = row[10] || ""
            const urlImagenes = rawImages ? rawImages.split(",").map((url: string) => url.trim()) : []

            const product: Product = {
              id: `${sheetName}-${sku}`,
              nombre,
              sku,
              marca,
              año: row[9]?.trim() || "",
              nivelDeJuego: row[11]?.trim() || "",
              descripcion: row[5]?.trim() || "",
              stockStatus,
              stock: stockValue,
              precio1,
              precio1Label: currentPriceRanges.quantities[0],
              precio2,
              precio2Label: currentPriceRanges.quantities[1],
              precio3,
              precio3Label: currentPriceRanges.quantities[2],
              categoria: sheetName,
              isZapatilla: isCurrentProductZapatilla,
              urlImagenes,
            }

            allProducts.push(product)
          }
        })
      }
    }

    return NextResponse.json(
      { products: allProducts },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    console.error("Error fetching from Google Sheets:", error)
    return NextResponse.json(
      { error: "Failed to fetch products", products: [] },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  }
}

function extractBrand(productName: string): string {
  const brands = ["Bullpadel", "Nox", "Sane", "Siux", "Wingpadel", "Black Crown", "Varlion", "X-TRUST", "Odpro"]
  const lowerName = productName.toLowerCase()
  for (const brand of brands) {
    if (lowerName.includes(brand.toLowerCase())) return brand
  }
  return ""
}
