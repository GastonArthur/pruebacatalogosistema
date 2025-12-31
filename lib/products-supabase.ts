import { supabase } from "./supabase"
import type { Product as SheetProduct } from "./google-sheets"

export type ProductRow = {
  id: string
  nombre: string
  sku: string
  marca?: string
  descripcion?: string
  categoria: string
  precio_unico?: number | null
  precios_por_cantidad?: any | null
  configuracion_personalizable?: any | null
  variantes?: any | null
  images?: { url: string }[]
}

export async function fetchProductsFromSupabase(catalogId?: string): Promise<SheetProduct[]> {
  let query = supabase.from("products").select("*, images:images(url)")
  if (catalogId) query = query.eq("catalog_id", catalogId)
  const { data, error } = await query
  if (error || !data) return []
  return data.map((p: ProductRow) => ({
    id: p.id,
    nombre: p.nombre,
    sku: p.sku,
    marca: p.marca || "",
    stock: 0,
    precio1: "",
    precio2: "",
    precio3: "",
    precio1Label: "",
    precio2Label: "",
    precio3Label: "",
    urlImagenes: (p.images || []).map((i) => i.url),
    categoria: p.categoria,
  }))
}
