-- Traslados queda apagado en las cuentas nuevas y en las que todavía no lo usan.
-- Si la cuenta ya tiene traslados, el módulo sigue encendido.

alter table public.tenants
  alter column disabled_modules set default '{traslados}';

update public.tenants t
set disabled_modules = (
  select coalesce(array_agg(distinct module_id), '{}')
  from unnest(
    coalesce(t.disabled_modules, '{}'::text[]) || array['traslados']::text[]
  ) as module_id
)
where not exists (
  select 1
  from public.stock_transfers s
  where s.tenant_id = t.id
)
and not ('traslados' = any (coalesce(t.disabled_modules, '{}'::text[])));

comment on column public.tenants.disabled_modules is
  'Ids de módulos apagados para esta cuenta. Las filas nuevas nacen con traslados apagado.';
