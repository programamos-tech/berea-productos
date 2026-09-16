alter table public.tenants
  add column storefront_config jsonb not null
    default '{"checkout_mode":"transfer"}'::jsonb;

alter table public.tenants
  add constraint tenants_storefront_config_object
  check (jsonb_typeof(storefront_config) = 'object');

alter table public.tenants
  add constraint tenants_checkout_mode_valid
  check (
    coalesce(storefront_config->>'checkout_mode', 'transfer')
      in ('wompi', 'transfer')
  );

update public.tenants
set
  brand = brand || jsonb_build_object(
    'primary_color',
    case
      when slug = 'aleya' then '#FF76A1'
      when slug = 'estacion-iphone' then '#111111'
      else '#18181B'
    end
  ),
  storefront_config = storefront_config || jsonb_build_object(
    'checkout_mode',
    case when slug = 'aleya' then 'wompi' else 'transfer' end
  )
where kind = 'customer';

update public.products p
set is_published = true
from public.tenants t
where p.tenant_id = t.id
  and t.slug = 'estacion-iphone';

comment on column public.tenants.storefront_config is
  'Configuración no sensible del catálogo público, incluido el modo de checkout.';
