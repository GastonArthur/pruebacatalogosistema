-- Usuarios: cada uno sólo puede ver/editar su fila
create policy "users self read" on public.users
  for select
  using (auth.uid() = id);
create policy "users self write" on public.users
  for update
  using (auth.uid() = id);
create policy "users self insert" on public.users
  for insert
  with check (auth.uid() = id);

-- Catálogos: dueño puede CRUD, público puede leer productos asociados
create policy "catalog owner read" on public.catalogs
  for select
  using (auth.uid() = user_id);
create policy "catalog owner write" on public.catalogs
  for all
  using (auth.uid() = user_id);

-- Productos: dueño del catálogo puede CRUD
create policy "products owner read" on public.products
  for select
  using (
    exists (
      select 1 from public.catalogs c
      where c.id = catalog_id and c.user_id = auth.uid()
    )
  );
create policy "products owner write" on public.products
  for all
  using (
    exists (
      select 1 from public.catalogs c
      where c.id = catalog_id and c.user_id = auth.uid()
    )
  );

-- Productos públicos lectura sin auth
create policy "products public read" on public.products
  for select
  to anon
  using (true);

-- Imágenes: mismas reglas que productos
create policy "images products owner read" on public.images
  for select
  using (
    exists (
      select 1 from public.products p
      join public.catalogs c on c.id = p.catalog_id
      where p.id = product_id and c.user_id = auth.uid()
    )
  );
create policy "images products owner write" on public.images
  for all
  using (
    exists (
      select 1 from public.products p
      join public.catalogs c on c.id = p.catalog_id
      where p.id = product_id and c.user_id = auth.uid()
    )
  );
create policy "images public read" on public.images
  for select
  to anon
  using (true);
