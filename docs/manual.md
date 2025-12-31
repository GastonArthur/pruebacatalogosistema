# Manual de Usuario

## Acceso
- Ingresá a /login para iniciar sesión.
- Podés registrarte en /register si no tenés cuenta.
- También podés usar “Continuar con Google”.

## Panel de Administración
- /admin: menú principal.
- Productos:
  - Crear producto con nombre, descripción, categoría y SKU.
  - Listado de productos existentes.
  - Subir imágenes por producto (máximo 10) — se optimizan automáticamente.
  - Exportar datos en JSON/CSV.
- Marca:
  - Seleccionar catálogo.
  - Subir logo (PNG/JPG/SVG).
  - Elegir colores principales.

## Catálogo Público
- La página principal muestra el catálogo con filtros, búsqueda y orden por precio.
- Fuente de datos configurable (Supabase o Google Sheets).

## Importación desde Google Sheets
- Desde el backend se puede importar productos básicos usando /api/import/sheets.
- Configurá GOOGLE_SHEETS_ID y GOOGLE_SHEETS_API_KEY.

