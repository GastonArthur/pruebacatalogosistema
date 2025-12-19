// lib/product-images.ts
import rawData from './images-db.json';

/**
 * Definimos la interfaz básica de cada fila del Excel.
 * No importa cómo se llamen las columnas de las fotos, 
 * el código las detectará automáticamente.
 */
interface ExcelRow {
  SKU: string | number;
  Nombre?: string; // Columna A
  [key: string]: any; // Para el resto de columnas dinámicas
}

// Transformamos el JSON plano en un mapa optimizado: { "SKU": ["url1", "url2"] }
const productImagesMap = (rawData as ExcelRow[]).reduce((acc, row) => {
  // 1. Aseguramos que el SKU sea un string limpio
  const sku = String(row.SKU || '').trim();
  
  if (!sku) return acc; // Si no hay SKU, saltamos la fila

  // 2. Extraemos las imágenes dinámicamente
  const images: string[] = Object.entries(row)
    .filter(([key, value]) => {
      // Ignoramos las columnas que NO son imágenes
      if (key === 'SKU' || key === 'Nombre') return false;
      
      // Verificamos que el valor sea un texto y parezca un link (http...)
      return typeof value === 'string' && value.trim().startsWith('http');
    })
    .map(([, value]) => value.trim()); // Nos quedamos solo con el link limpio

  // 3. Guardamos en el diccionario si encontramos imágenes
  if (images.length > 0) {
    acc[sku] = images;
  }

  return acc;
}, {} as Record<string, string[]>);


// --- FUNCIÓN PÚBLICA ---

export const getProductImages = (sku: string): string[] => {
  if (!sku) return [];
  const cleanSku = sku.trim();
  
  // Retorna las imágenes del Excel, o un array vacío si no encontró nada
  return productImagesMap[cleanSku] || [];
};
