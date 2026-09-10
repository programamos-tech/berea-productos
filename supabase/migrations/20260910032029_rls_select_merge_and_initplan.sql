-- Unifica políticas SELECT duplicadas (OR en una sola) y evalúa staff/tenant
-- una vez por query: (select is_staff()) / (select current_staff_tenant_id()).
-- Así Postgres deja de correr EXISTS sobre profiles en cada fila.

create or replace function public.is_staff_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
  );
$$;

----------------------------------------------------------------------------
-- Restrictive tenant isolation: comparación con un uuid cacheado
----------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and policyname like '%_staff_tenant_isolation'
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      r.policyname,
      r.tablename
    );
    execute format(
      $p$
      create policy %I on public.%I
        as restrictive
        for all
        to authenticated
        using (
          (not (select public.is_staff()))
          or (tenant_id = (select public.current_staff_tenant_id()))
        )
        with check (
          (not (select public.is_staff()))
          or (tenant_id = (select public.current_staff_tenant_id()))
        )
      $p$,
      r.policyname,
      r.tablename
    );
  end loop;
end $$;

----------------------------------------------------------------------------
-- orders / order_items / customers / customer_addresses: una política SELECT
----------------------------------------------------------------------------
drop policy if exists orders_select_store_owner on public.orders;
drop policy if exists orders_select_admin on public.orders;
create policy orders_select_admin on public.orders
  for select to authenticated
  using (
    (select public.is_staff())
    or exists (
      select 1
      from public.customers c
      where c.id = orders.customer_id
        and c.auth_user_id = (select auth.uid())
    )
  );

drop policy if exists order_items_select_store_owner on public.order_items;
drop policy if exists order_items_select_admin on public.order_items;
create policy order_items_select_admin on public.order_items
  for select to authenticated
  using (
    (select public.is_staff())
    or exists (
      select 1
      from public.orders o
      join public.customers c on c.id = o.customer_id
      where o.id = order_items.order_id
        and c.auth_user_id = (select auth.uid())
    )
  );

drop policy if exists customers_select_store_owner on public.customers;
drop policy if exists customers_select_admin on public.customers;
create policy customers_select_admin on public.customers
  for select to authenticated
  using (
    (select public.is_staff())
    or (auth_user_id = (select auth.uid()))
  );

drop policy if exists customers_update_store_owner on public.customers;
drop policy if exists customers_update_admin on public.customers;
create policy customers_update_admin on public.customers
  for update to authenticated
  using (
    (select public.is_staff())
    or (auth_user_id = (select auth.uid()))
  )
  with check (
    (select public.is_staff())
    or (auth_user_id = (select auth.uid()))
  );

drop policy if exists customer_addresses_select_store_owner on public.customer_addresses;
drop policy if exists customer_addresses_select_admin on public.customer_addresses;
create policy customer_addresses_select_admin on public.customer_addresses
  for select to authenticated
  using (
    (select public.is_staff())
    or exists (
      select 1
      from public.customers c
      where c.id = customer_addresses.customer_id
        and c.auth_user_id = (select auth.uid())
    )
  );

drop policy if exists customer_addresses_insert_store_owner on public.customer_addresses;
drop policy if exists customer_addresses_insert_admin on public.customer_addresses;
create policy customer_addresses_insert_admin on public.customer_addresses
  for insert to authenticated
  with check (
    (select public.is_staff())
    or exists (
      select 1
      from public.customers c
      where c.id = customer_addresses.customer_id
        and c.auth_user_id = (select auth.uid())
    )
  );

drop policy if exists customer_addresses_update_store_owner on public.customer_addresses;
drop policy if exists customer_addresses_update_admin on public.customer_addresses;
create policy customer_addresses_update_admin on public.customer_addresses
  for update to authenticated
  using (
    (select public.is_staff())
    or exists (
      select 1
      from public.customers c
      where c.id = customer_addresses.customer_id
        and c.auth_user_id = (select auth.uid())
    )
  )
  with check (
    (select public.is_staff())
    or exists (
      select 1
      from public.customers c
      where c.id = customer_addresses.customer_id
        and c.auth_user_id = (select auth.uid())
    )
  );

drop policy if exists customer_addresses_delete_store_owner on public.customer_addresses;
drop policy if exists customer_addresses_delete_admin on public.customer_addresses;
create policy customer_addresses_delete_admin on public.customer_addresses
  for delete to authenticated
  using (
    (select public.is_staff())
    or exists (
      select 1
      from public.customers c
      where c.id = customer_addresses.customer_id
        and c.auth_user_id = (select auth.uid())
    )
  );

----------------------------------------------------------------------------
-- Catálogo / vitrina: authenticated = staff OR público; anon = solo público
----------------------------------------------------------------------------
drop policy if exists products_select_admin_all on public.products;
drop policy if exists products_select_published on public.products;
create policy products_select_admin_all on public.products
  for select to authenticated
  using ((select public.is_staff()) or (is_published = true));
create policy products_select_published on public.products
  for select to anon
  using (is_published = true);

drop policy if exists product_kits_select_admin on public.product_kits;
drop policy if exists product_kits_select_published on public.product_kits;
create policy product_kits_select_admin on public.product_kits
  for select to authenticated
  using ((select public.is_staff()) or (is_published = true));
create policy product_kits_select_published on public.product_kits
  for select to anon
  using (is_published = true);

drop policy if exists product_kit_items_select_admin on public.product_kit_items;
drop policy if exists product_kit_items_select_published on public.product_kit_items;
create policy product_kit_items_select_admin on public.product_kit_items
  for select to authenticated
  using (
    (select public.is_staff())
    or exists (
      select 1
      from public.product_kits k
      where k.id = product_kit_items.kit_id
        and k.is_published = true
    )
  );
create policy product_kit_items_select_published on public.product_kit_items
  for select to anon
  using (
    exists (
      select 1
      from public.product_kits k
      where k.id = product_kit_items.kit_id
        and k.is_published = true
    )
  );

drop policy if exists store_banners_select_admin on public.store_banners;
drop policy if exists store_banners_select_public on public.store_banners;
create policy store_banners_select_admin on public.store_banners
  for select to authenticated
  using ((select public.is_staff()) or (is_published = true));
create policy store_banners_select_public on public.store_banners
  for select to anon
  using (is_published = true);

drop policy if exists store_coupons_select_admin on public.store_coupons;
drop policy if exists store_coupons_select_public_banner on public.store_coupons;
create policy store_coupons_select_admin on public.store_coupons
  for select to authenticated
  using (
    (select public.is_staff())
    or (
      is_enabled = true
      and show_in_banner = true
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at >= now())
    )
  );
create policy store_coupons_select_public_banner on public.store_coupons
  for select to anon
  using (
    is_enabled = true
    and show_in_banner = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

drop policy if exists store_shipping_municipalities_select_admin
  on public.store_shipping_municipalities;
drop policy if exists store_shipping_municipalities_select_public
  on public.store_shipping_municipalities;
create policy store_shipping_municipalities_select_admin
  on public.store_shipping_municipalities
  for select to authenticated
  using ((select public.is_staff()) or (is_enabled = true));
create policy store_shipping_municipalities_select_public
  on public.store_shipping_municipalities
  for select to anon
  using (is_enabled = true);

drop policy if exists store_welcome_modals_select_admin on public.store_welcome_modals;
drop policy if exists store_welcome_modals_select_public on public.store_welcome_modals;
create policy store_welcome_modals_select_admin on public.store_welcome_modals
  for select to authenticated
  using ((select public.is_staff()) or (is_enabled = true));
create policy store_welcome_modals_select_public on public.store_welcome_modals
  for select to anon
  using (is_enabled = true);

drop policy if exists tenants_select_staff on public.tenants;
drop policy if exists tenants_select_public_active on public.tenants;
create policy tenants_select_staff on public.tenants
  for select to authenticated
  using ((select public.is_staff()) or (status = 'active'));
create policy tenants_select_public_active on public.tenants
  for select to anon
  using (status = 'active');

----------------------------------------------------------------------------
-- Staff helpers: initplan también en SELECT de log / egresos / productos admin
----------------------------------------------------------------------------
drop policy if exists admin_activity_log_select_team on public.admin_activity_log;
create policy admin_activity_log_select_team on public.admin_activity_log
  for select to authenticated
  using ((select public.is_staff()));

drop policy if exists store_expenses_select_admin on public.store_expenses;
create policy store_expenses_select_admin on public.store_expenses
  for select to authenticated
  using ((select public.is_staff()));
