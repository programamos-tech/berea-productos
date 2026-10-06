-- Aleya Bodega abre en durazno. La tienda pública sigue con su propio color.

update public.branches b
set storefront_color = '#FFDAB8'
from public.tenants t
where b.tenant_id = t.id
  and t.slug = 'aleya'
  and b.code = 'bodega';
