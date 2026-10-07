-- Bodega pasa de vino a rosa bebé. La tienda pública no cambia.

update public.branches b
set storefront_color = '#FDE8F2'
from public.tenants t
where b.tenant_id = t.id
  and t.slug = 'aleya'
  and b.code = 'bodega'
  and upper(b.storefront_color) in ('#FFDAB8', '#FFB4CB', '#F3C6D6');
