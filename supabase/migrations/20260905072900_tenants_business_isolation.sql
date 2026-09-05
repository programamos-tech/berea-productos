-- Berea Productos Phase 2: isolate all business rows under tenants.
-- Backfill every existing row to tenant slug "aleya" (Aleya Shop).
-- Uses RESTRICTIVE RLS so staff only see their tenant; anon/customer paths unchanged.

-- ---------------------------------------------------------------------------
-- 0) Ensure platform tenants table + aleya seed (idempotent if Phase 1 applied)
-- ---------------------------------------------------------------------------
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  status text not null default 'active'
    check (status in ('active', 'trial', 'suspended')),
  custom_domains text[] not null default '{}'::text[],
  brand jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenants_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint tenants_slug_len check (char_length(slug) between 2 and 48)
);

create unique index if not exists tenants_slug_uidx on public.tenants (slug);
create index if not exists tenants_custom_domains_gin on public.tenants using gin (custom_domains);

drop trigger if exists tenants_set_updated_at on public.tenants;
create trigger tenants_set_updated_at
before update on public.tenants
for each row execute function public.set_updated_at();

insert into public.tenants (slug, name, status, custom_domains, brand)
values (
  'aleya',
  'Aleya Shop',
  'active',
  array[
    'aleyashop.net',
    'www.aleyashop.net',
    'milagrosguacari.com',
    'www.milagrosguacari.com'
  ]::text[],
  jsonb_build_object(
    'trade_name', 'Aleya Shop',
    'legal_name', 'Aleya Shop SAS'
  )
)
on conflict (slug) do update
set
  name = excluded.name,
  custom_domains = excluded.custom_domains,
  brand = excluded.brand;

alter table public.profiles
  add column if not exists tenant_id uuid references public.tenants (id);

update public.profiles
set tenant_id = (select id from public.tenants where slug = 'aleya' limit 1)
where tenant_id is null;

create index if not exists profiles_tenant_id_idx on public.profiles (tenant_id);

alter table public.tenants enable row level security;

drop policy if exists "tenants_select_staff" on public.tenants;
create policy "tenants_select_staff"
on public.tenants
for select
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid())
);

drop policy if exists "tenants_select_public_active" on public.tenants;
create policy "tenants_select_public_active"
on public.tenants
for select
to anon, authenticated
using (status = 'active');

-- ---------------------------------------------------------------------------
-- 1) Helpers
-- ---------------------------------------------------------------------------
create or replace function public.aleya_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.tenants where slug = 'aleya' limit 1;
$$;

create or replace function public.current_staff_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.tenant_id from public.profiles p where p.id = auth.uid() limit 1;
$$;

create or replace function public.is_staff_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid());
$$;

create or replace function public.staff_owns_tenant(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_tenant_id is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.tenant_id is not null
        and p.tenant_id = p_tenant_id
    );
$$;

revoke all on function public.aleya_tenant_id() from public;
revoke all on function public.current_staff_tenant_id() from public;
revoke all on function public.is_staff_user() from public;
revoke all on function public.staff_owns_tenant(uuid) from public;
grant execute on function public.aleya_tenant_id() to authenticated, anon, service_role;
grant execute on function public.current_staff_tenant_id() to authenticated, service_role;
grant execute on function public.is_staff_user() to authenticated, anon, service_role;
grant execute on function public.staff_owns_tenant(uuid) to authenticated, service_role;

create or replace function public.tg_set_tenant_id_from_staff()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  tid uuid;
begin
  if new.tenant_id is null then
    tid := public.current_staff_tenant_id();
    if tid is null then
      tid := public.aleya_tenant_id();
    end if;
    if tid is null then
      raise exception 'tenant_id is required (no staff tenant / aleya seed)';
    end if;
    new.tenant_id := tid;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2) Add tenant_id columns (nullable first)
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  root_tables text[] := array[
    'products',
    'categories',
    'customers',
    'orders',
    'store_expenses',
    'cash_register_sessions',
    'product_kits',
    'store_coupons',
    'store_banners',
    'store_welcome_modals',
    'store_shipping_municipalities',
    'suppliers',
    'supplier_invoices',
    'admin_activity_log',
    'admin_form_tokens',
    'order_items',
    'customer_addresses',
    'product_kit_items',
    'store_coupon_products',
    'supplier_invoice_lines',
    'supplier_invoice_payments',
    'supplier_invoice_attachments',
    'order_transfer_proofs'
  ];
begin
  foreach t in array root_tables loop
    execute format(
      'alter table public.%I add column if not exists tenant_id uuid references public.tenants (id)',
      t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 3) Backfill → aleya (parents first, then children via parent FK)
-- ---------------------------------------------------------------------------
update public.products set tenant_id = public.aleya_tenant_id() where tenant_id is null;
update public.categories set tenant_id = public.aleya_tenant_id() where tenant_id is null;
update public.customers set tenant_id = public.aleya_tenant_id() where tenant_id is null;
update public.orders set tenant_id = public.aleya_tenant_id() where tenant_id is null;
update public.store_expenses set tenant_id = public.aleya_tenant_id() where tenant_id is null;
update public.cash_register_sessions set tenant_id = public.aleya_tenant_id() where tenant_id is null;
update public.product_kits set tenant_id = public.aleya_tenant_id() where tenant_id is null;
update public.store_coupons set tenant_id = public.aleya_tenant_id() where tenant_id is null;
update public.store_banners set tenant_id = public.aleya_tenant_id() where tenant_id is null;
update public.store_welcome_modals set tenant_id = public.aleya_tenant_id() where tenant_id is null;
update public.store_shipping_municipalities set tenant_id = public.aleya_tenant_id() where tenant_id is null;
update public.suppliers set tenant_id = public.aleya_tenant_id() where tenant_id is null;
update public.supplier_invoices set tenant_id = public.aleya_tenant_id() where tenant_id is null;
update public.admin_activity_log set tenant_id = public.aleya_tenant_id() where tenant_id is null;
update public.admin_form_tokens set tenant_id = public.aleya_tenant_id() where tenant_id is null;

update public.order_items oi
set tenant_id = o.tenant_id
from public.orders o
where oi.order_id = o.id and oi.tenant_id is null;

update public.order_items
set tenant_id = public.aleya_tenant_id()
where tenant_id is null;

update public.customer_addresses ca
set tenant_id = c.tenant_id
from public.customers c
where ca.customer_id = c.id and ca.tenant_id is null;

update public.customer_addresses
set tenant_id = public.aleya_tenant_id()
where tenant_id is null;

update public.product_kit_items pki
set tenant_id = pk.tenant_id
from public.product_kits pk
where pki.kit_id = pk.id and pki.tenant_id is null;

update public.product_kit_items
set tenant_id = public.aleya_tenant_id()
where tenant_id is null;

update public.store_coupon_products scp
set tenant_id = sc.tenant_id
from public.store_coupons sc
where scp.coupon_id = sc.id and scp.tenant_id is null;

update public.store_coupon_products
set tenant_id = public.aleya_tenant_id()
where tenant_id is null;

update public.supplier_invoice_lines sil
set tenant_id = si.tenant_id
from public.supplier_invoices si
where sil.invoice_id = si.id and sil.tenant_id is null;

update public.supplier_invoice_lines
set tenant_id = public.aleya_tenant_id()
where tenant_id is null;

update public.supplier_invoice_payments sip
set tenant_id = si.tenant_id
from public.supplier_invoices si
where sip.invoice_id = si.id and sip.tenant_id is null;

update public.supplier_invoice_payments
set tenant_id = public.aleya_tenant_id()
where tenant_id is null;

update public.supplier_invoice_attachments sia
set tenant_id = si.tenant_id
from public.supplier_invoices si
where sia.invoice_id = si.id and sia.tenant_id is null;

update public.supplier_invoice_attachments
set tenant_id = public.aleya_tenant_id()
where tenant_id is null;

update public.order_transfer_proofs otp
set tenant_id = o.tenant_id
from public.orders o
where otp.order_id = o.id and otp.tenant_id is null;

update public.order_transfer_proofs
set tenant_id = public.aleya_tenant_id()
where tenant_id is null;

-- ---------------------------------------------------------------------------
-- 4) NOT NULL + indexes
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'profiles',
    'products',
    'categories',
    'customers',
    'orders',
    'store_expenses',
    'cash_register_sessions',
    'product_kits',
    'store_coupons',
    'store_banners',
    'store_welcome_modals',
    'store_shipping_municipalities',
    'suppliers',
    'supplier_invoices',
    'admin_activity_log',
    'admin_form_tokens',
    'order_items',
    'customer_addresses',
    'product_kit_items',
    'store_coupon_products',
    'supplier_invoice_lines',
    'supplier_invoice_payments',
    'supplier_invoice_attachments',
    'order_transfer_proofs'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I alter column tenant_id set not null', t);
    execute format(
      'create index if not exists %I on public.%I (tenant_id)',
      t || '_tenant_id_idx',
      t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 5) Per-tenant unique constraints (drop globals, recreate composite)
-- ---------------------------------------------------------------------------
drop index if exists public.customers_email_normalized_unique;
create unique index customers_email_normalized_unique
  on public.customers (tenant_id, lower(trim(both from email)))
  where email is not null and length(trim(both from email)) > 0;

drop index if exists public.customers_auth_user_id_unique;
create unique index customers_auth_user_id_unique
  on public.customers (tenant_id, auth_user_id)
  where auth_user_id is not null;

drop index if exists public.store_coupons_code_normalized_unique;
create unique index store_coupons_code_normalized_unique
  on public.store_coupons (tenant_id, lower(trim(both from code)));

drop index if exists public.cash_register_sessions_one_open_idx;
create unique index cash_register_sessions_one_open_idx
  on public.cash_register_sessions (tenant_id)
  where status = 'open';

drop index if exists public.cash_register_sessions_day_unique_idx;
create unique index cash_register_sessions_day_unique_idx
  on public.cash_register_sessions (tenant_id, business_day);

drop index if exists public.store_shipping_municipalities_name_normalized_unique;
create unique index store_shipping_municipalities_name_normalized_unique
  on public.store_shipping_municipalities (tenant_id, lower(trim(both from name)));

alter table public.supplier_invoices drop constraint if exists supplier_invoices_folio_key;
drop index if exists public.supplier_invoices_folio_key;
create unique index supplier_invoices_folio_tenant_uidx
  on public.supplier_invoices (tenant_id, folio);

drop index if exists public.profiles_login_username_lower_key;
create unique index profiles_login_username_lower_key
  on public.profiles (tenant_id, lower(trim(both from login_username)))
  where login_username is not null and length(trim(both from login_username)) > 0;

-- ---------------------------------------------------------------------------
-- 6) BEFORE INSERT triggers (auto tenant_id from staff / aleya fallback)
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'products',
    'categories',
    'customers',
    'orders',
    'store_expenses',
    'cash_register_sessions',
    'product_kits',
    'store_coupons',
    'store_banners',
    'store_welcome_modals',
    'store_shipping_municipalities',
    'suppliers',
    'supplier_invoices',
    'admin_activity_log',
    'admin_form_tokens',
    'order_items',
    'customer_addresses',
    'product_kit_items',
    'store_coupon_products',
    'supplier_invoice_lines',
    'supplier_invoice_payments',
    'supplier_invoice_attachments',
    'order_transfer_proofs'
  ];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists %I on public.%I', t || '_set_tenant_id', t);
    execute format(
      'create trigger %I before insert on public.%I for each row execute function public.tg_set_tenant_id_from_staff()',
      t || '_set_tenant_id',
      t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 7) RESTRICTIVE RLS: staff may only touch rows of their tenant
--    Non-staff authenticated (store customers) are not restricted by these.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'products',
    'categories',
    'customers',
    'orders',
    'store_expenses',
    'cash_register_sessions',
    'product_kits',
    'store_coupons',
    'store_banners',
    'store_welcome_modals',
    'store_shipping_municipalities',
    'suppliers',
    'supplier_invoices',
    'admin_activity_log',
    'admin_form_tokens',
    'order_items',
    'customer_addresses',
    'product_kit_items',
    'store_coupon_products',
    'supplier_invoice_lines',
    'supplier_invoice_payments',
    'supplier_invoice_attachments',
    'order_transfer_proofs'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists %I on public.%I', t || '_staff_tenant_isolation', t);
    execute format(
      $p$
      create policy %I
      on public.%I
      as restrictive
      for all
      to authenticated
      using (
        not public.is_staff_user()
        or public.staff_owns_tenant(tenant_id)
      )
      with check (
        not public.is_staff_user()
        or public.staff_owns_tenant(tenant_id)
      )
      $p$,
      t || '_staff_tenant_isolation',
      t
    );
  end loop;
end $$;

-- profiles: staff only sees own row already; keep tenant assigned
alter table public.profiles
  alter column tenant_id set not null;

comment on function public.staff_owns_tenant(uuid) is
  'RLS helper: authenticated staff may only access rows for profiles.tenant_id';
