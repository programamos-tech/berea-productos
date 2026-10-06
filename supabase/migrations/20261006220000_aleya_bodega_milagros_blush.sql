-- Bodega usa un rosa polvo, distinto del rosa pleno de Local.

update public.branches b
set storefront_color = '#F3C6D6'
from public.tenants t
where b.tenant_id = t.id
  and t.slug = 'aleya'
  and b.code = 'bodega'
  and upper(b.storefront_color) in ('#FFDAB8', '#FFB4CB');
