# Plan de Migración de Datos

## Objetivo
Migrar productos e imágenes del catálogo actual (Google Sheets + archivos locales) a Supabase.

## Pasos
1. Crear bucket de Storage “images” en Supabase (visibilidad pública).
2. Aplicar esquema y políticas:
   - Ejecutar schema.sql y policies.sql en Supabase.
3. Crear catálogo inicial y asociarlo al usuario dueño.
4. Importar productos desde Google Sheets:
   - Configurar GOOGLE_SHEETS_ID y GOOGLE_SHEETS_API_KEY en el backend.
   - Ejecutar POST /api/import/sheets.
5. Subir imágenes:
   - Usar el panel admin para subir imágenes por producto.
   - Opcional: script de migración para subir en lote (pendiente según fuente).
6. Verificación:
   - Revisar catálogo público con NEXT_PUBLIC_DATA_SOURCE=supabase.
   - Chequear que imágenes se sirvan correctamente desde Storage.

## Consideraciones
- Mantener SKU como referencia única para evitar duplicados.
- Completar campos avanzados (precios por cantidad, variantes) según necesidad.
- Preservar diseño y navegación actuales en el frontend.

