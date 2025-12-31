-- Catálogos 1:N con usuarios
create table if not exists public.catalogs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null,
  created_at timestamptz default now()
);

alter table public.catalogs enable row level security;

-- Productos 1:N con catálogos
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.catalogs(id) on delete cascade,
  nombre text not null,
  descripcion text,
  categoria text not null,
  sku text not null,
  variantes jsonb,
  precio_unico numeric,
  precios_por_cantidad jsonb,
  configuracion_personalizable jsonb,
  created_at timestamptz default now()
);

alter table public.products enable row level security;
create index if not exists products_catalog_idx on public.products(catalog_id);

-- Imágenes 1:N con productos
create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  created_at timestamptz default now()
);

alter table public.images enable row level security;
create index if not exists images_product_idx on public.images(product_id);

-- Branding por catálogo
create table if not exists public.branding (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.catalogs(id) on delete cascade,
  logo_url text,
  primary_color text,
  secondary_color text,
  created_at timestamptz default now()
);

alter table public.branding enable row level security;
