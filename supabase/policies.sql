-- Catálogos: dueño puede CRUD, público puede leer productos asociados
create policy "catalog owner read" on public.catalogs
  for select
  using (auth.uid() = user_id);
create policy "catalog owner update" on public.catalogs
  for update
  using (auth.uid() = user_id);
create policy "catalog owner delete" on public.catalogs
  for delete
  using (auth.uid() = user_id);
create policy "catalog owner insert" on public.catalogs
  for insert
  with check (auth.uid() = user_id);

-- Productos: dueño del catálogo puede CRUD
create policy "products owner read" on public.products
  for select
  using (
    exists (
      select 1 from public.catalogs c
      where c.id = catalog_id and c.user_id = auth.uid()
    )
  );
create policy "products owner update" on public.products
  for update
  using (
    exists (
      select 1 from public.catalogs c
      where c.id = catalog_id and c.user_id = auth.uid()
    )
  );
create policy "products owner delete" on public.products
  for delete
  using (
    exists (
      select 1 from public.catalogs c
      where c.id = catalog_id and c.user_id = auth.uid()
    )
  );
create policy "products owner insert" on public.products
  for insert
  with check (
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
create policy "images products owner update" on public.images
  for update
  using (
    exists (
      select 1 from public.products p
      join public.catalogs c on c.id = p.catalog_id
      where p.id = product_id and c.user_id = auth.uid()
    )
  );
create policy "images products owner delete" on public.images
  for delete
  using (
    exists (
      select 1 from public.products p
      join public.catalogs c on c.id = p.catalog_id
      where p.id = product_id and c.user_id = auth.uid()
    )
  );
create policy "images products owner insert" on public.images
  for insert
  with check (
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

create policy "profiles self read" on public.profiles
  for select
  using (auth.uid() = id);
create policy "profiles self insert" on public.profiles
  for insert
  with check (auth.uid() = id);
create policy "profiles self update" on public.profiles
  for update
  using (auth.uid() = id);
