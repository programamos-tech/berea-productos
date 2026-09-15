-- Storefront catalog: anon/customers only see the tenant resolved from
-- `x-berea-tenant-slug` (middleware / supabase-js global header).
-- Missing or unknown slug → Aleya, so aleyashop.net never lists other tenants.

create or replace function public.request_storefront_tenant_slug()
returns text
language plpgsql
stable
as $$
declare
  headers_raw text;
  headers_json json;
  slug text;
begin
  begin
    headers_raw := current_setting('request.headers', true);
    if headers_raw is not null and btrim(headers_raw) <> '' then
      headers_json := headers_raw::json;
      slug := nullif(lower(btrim(headers_json->>'x-berea-tenant-slug')), '');
    end if;
  exception when others then
    slug := null;
  end;

  if slug is null then
    begin
      slug := nullif(
        lower(btrim(current_setting('request.header.x-berea-tenant-slug', true))),
        ''
      );
    exception when others then
      slug := null;
    end;
  end if;

  return slug;
end;
$$;

create or replace function public.request_storefront_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select t.id
      from public.tenants t
      where t.slug = public.request_storefront_tenant_slug()
        and t.status in ('active', 'trial')
      limit 1
    ),
    public.aleya_tenant_id()
  );
$$;

revoke all on function public.request_storefront_tenant_slug() from public;
revoke all on function public.request_storefront_tenant_id() from public;
grant execute on function public.request_storefront_tenant_slug() to anon, authenticated, service_role, postgres;
grant execute on function public.request_storefront_tenant_id() to anon, authenticated, service_role, postgres;

----------------------------------------------------------------------------
-- products
----------------------------------------------------------------------------
drop policy if exists products_select_admin_all on public.products;
drop policy if exists products_select_published on public.products;
create policy products_select_admin_all on public.products
  for select to authenticated
  using (
    (select public.is_staff())
    or (
      is_published = true
      and tenant_id = (select public.request_storefront_tenant_id())
    )
  );
create policy products_select_published on public.products
  for select to anon
  using (
    is_published = true
    and tenant_id = (select public.request_storefront_tenant_id())
  );

----------------------------------------------------------------------------
-- categories (was using (true) for anon+authenticated)
----------------------------------------------------------------------------
drop policy if exists categories_select_public on public.categories;
drop policy if exists categories_select_staff on public.categories;
create policy categories_select_staff on public.categories
  for select to authenticated
  using (
    (select public.is_staff())
    or tenant_id = (select public.request_storefront_tenant_id())
  );
create policy categories_select_public on public.categories
  for select to anon
  using (tenant_id = (select public.request_storefront_tenant_id()));

----------------------------------------------------------------------------
-- product kits + items
----------------------------------------------------------------------------
drop policy if exists product_kits_select_admin on public.product_kits;
drop policy if exists product_kits_select_published on public.product_kits;
create policy product_kits_select_admin on public.product_kits
  for select to authenticated
  using (
    (select public.is_staff())
    or (
      is_published = true
      and tenant_id = (select public.request_storefront_tenant_id())
    )
  );
create policy product_kits_select_published on public.product_kits
  for select to anon
  using (
    is_published = true
    and tenant_id = (select public.request_storefront_tenant_id())
  );

drop policy if exists product_kit_items_select_admin on public.product_kit_items;
drop policy if exists product_kit_items_select_published on public.product_kit_items;
create policy product_kit_items_select_admin on public.product_kit_items
  for select to authenticated
  using (
    (select public.is_staff())
    or (
      tenant_id = (select public.request_storefront_tenant_id())
      and exists (
        select 1
        from public.product_kits k
        where k.id = product_kit_items.kit_id
          and k.is_published = true
          and k.tenant_id = product_kit_items.tenant_id
      )
    )
  );
create policy product_kit_items_select_published on public.product_kit_items
  for select to anon
  using (
    tenant_id = (select public.request_storefront_tenant_id())
    and exists (
      select 1
      from public.product_kits k
      where k.id = product_kit_items.kit_id
        and k.is_published = true
        and k.tenant_id = product_kit_items.tenant_id
    )
  );

----------------------------------------------------------------------------
-- banners / coupons / welcome / shipping
----------------------------------------------------------------------------
drop policy if exists store_banners_select_admin on public.store_banners;
drop policy if exists store_banners_select_public on public.store_banners;
create policy store_banners_select_admin on public.store_banners
  for select to authenticated
  using (
    (select public.is_staff())
    or (
      is_published = true
      and tenant_id = (select public.request_storefront_tenant_id())
    )
  );
create policy store_banners_select_public on public.store_banners
  for select to anon
  using (
    is_published = true
    and tenant_id = (select public.request_storefront_tenant_id())
  );

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
      and tenant_id = (select public.request_storefront_tenant_id())
    )
  );
create policy store_coupons_select_public_banner on public.store_coupons
  for select to anon
  using (
    is_enabled = true
    and show_in_banner = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
    and tenant_id = (select public.request_storefront_tenant_id())
  );

drop policy if exists store_welcome_modals_select_admin on public.store_welcome_modals;
drop policy if exists store_welcome_modals_select_public on public.store_welcome_modals;
create policy store_welcome_modals_select_admin on public.store_welcome_modals
  for select to authenticated
  using (
    (select public.is_staff())
    or (
      is_enabled = true
      and tenant_id = (select public.request_storefront_tenant_id())
    )
  );
create policy store_welcome_modals_select_public on public.store_welcome_modals
  for select to anon
  using (
    is_enabled = true
    and tenant_id = (select public.request_storefront_tenant_id())
  );

drop policy if exists store_shipping_municipalities_select_admin
  on public.store_shipping_municipalities;
drop policy if exists store_shipping_municipalities_select_public
  on public.store_shipping_municipalities;
create policy store_shipping_municipalities_select_admin
  on public.store_shipping_municipalities
  for select to authenticated
  using (
    (select public.is_staff())
    or (
      is_enabled = true
      and tenant_id = (select public.request_storefront_tenant_id())
    )
  );
create policy store_shipping_municipalities_select_public
  on public.store_shipping_municipalities
  for select to anon
  using (
    is_enabled = true
    and tenant_id = (select public.request_storefront_tenant_id())
  );
