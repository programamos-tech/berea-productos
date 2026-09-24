-- Módulos del panel que el operador puede apagar por cuenta (tenant).
-- Vacío = todos encendidos. Los ids viven en lib/admin-account-modules.ts.

alter table public.tenants
  add column if not exists disabled_modules text[] not null default '{}';

comment on column public.tenants.disabled_modules is
  'Ids de módulos apagados para esta cuenta (reportes, creditos, caja, …). Vacío = todos visibles.';
