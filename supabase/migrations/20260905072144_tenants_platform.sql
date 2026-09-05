-- Berea Productos: platform tenants (multi-tenant foundation).
-- Phase 1: tenants registry + profiles.tenant_id.
-- Existing data stays single-store until later migrations add tenant_id to business tables.
-- Default tenant "aleya" = current Aleya Shop production dataset.

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  status text not null default 'active'
    check (status in ('active', 'trial', 'suspended')),
  -- Hosts that resolve to this tenant (custom domains, apex, www).
  custom_domains text[] not null default '{}'::text[],
  -- Optional brand overrides (logos, legal name, etc.) — env still wins until Phase brand-from-DB.
  brand jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenants_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint tenants_slug_len check (char_length(slug) between 2 and 48)
);

create unique index tenants_slug_uidx on public.tenants (slug);
create index tenants_custom_domains_gin on public.tenants using gin (custom_domains);

create trigger tenants_set_updated_at
before update on public.tenants
for each row execute function public.set_updated_at();

comment on table public.tenants is
  'Berea Productos SaaS tenants. Host: {slug}.productos.bereahouse.com or custom_domains.';

-- Seed tenant #1 (current production store). Stable slug for host + env fallbacks.
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
);

alter table public.profiles
  add column if not exists tenant_id uuid references public.tenants (id);

update public.profiles
set tenant_id = (select id from public.tenants where slug = 'aleya' limit 1)
where tenant_id is null;

create index if not exists profiles_tenant_id_idx on public.profiles (tenant_id);

alter table public.tenants enable row level security;

-- Staff can read tenants (narrow when Berea super-admin + membership land).
create policy "tenants_select_staff"
on public.tenants
for select
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid())
);
