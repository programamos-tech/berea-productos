-- La foto es del producto. Si ya está en la sucursal por defecto y tiene imagen,
-- también se ofrece en las demás sucursales (Bodega). El stock sigue siendo de cada una.

insert into public.product_branch_listings (tenant_id, branch_id, product_id)
select src.tenant_id, other.id, src.product_id
from public.product_branch_listings src
join public.branches home
  on home.id = src.branch_id
 and home.is_default = true
 and home.is_active = true
join public.branches other
  on other.tenant_id = home.tenant_id
 and other.is_active = true
 and other.is_default = false
join public.products p
  on p.id = src.product_id
 and p.image_path is not null
 and btrim(p.image_path) <> ''
on conflict do nothing;
