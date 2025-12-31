# Arquitectura y Configuración

## Stack
- Frontend: Next.js (React + TypeScript)
- Backend: Express (Node.js)
- Base de datos: Supabase (PostgreSQL) + RLS
- Storage: Supabase Storage (bucket: images)
- Autenticación: Supabase Auth + OAuth Google
- Imágenes: Sharp.js (conversión a WebP, resize)

## Variables de entorno
Frontend (.env.local):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_BACKEND_URL
- NEXT_PUBLIC_DATA_SOURCE=supabase|sheets
- NEXT_PUBLIC_GOOGLE_SHEETS_ID (opcional para fallback)

Backend (server/.env):
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_STORAGE_BUCKET=images
- ALLOWED_ORIGIN=http://localhost:3000
- PORT=4000
- CSRF_SECRET=valor-seguro
- GOOGLE_SHEETS_API_KEY
- GOOGLE_SHEETS_ID

## Esquema de Base de Datos
Ver [schema.sql](file:///c:/Users/pcpanda11/Desktop/pruebacatalogosistema/supabase/schema.sql) y [policies.sql](file:///c:/Users/pcpanda11/Desktop/pruebacatalogosistema/supabase/policies.sql).

## Seguridad
- RLS habilitado para todas las tablas.
- Helmet + CORS en backend.
- CSRF en endpoints mutadores.
- Limpieza básica anti-XSS al guardar strings.

## Flujo de Autenticación
- Login/registro con validaciones del lado cliente.
- Google OAuth manejado por Supabase.
- Redirección a /admin tras login.

## Procesamiento de Imágenes
- Upload al backend (máximo 10 archivos).
- Generación de 3 tamaños: thumb, md, lg.
- Conversión a WebP (quality 80).
- Subida a Supabase Storage y registro en tabla images.

## Importación/Exportación
- Exportación JSON/CSV desde backend.
- Importación simple desde Google Sheets a productos.

