-- La tienda pública solo podía leer el inventario de la sucursal predeterminada.
-- Bodega tiene su propio stock; el catálogo de esa sucursal debe verlo.

drop policy if exists branch_inventory_storefront_default on public.branch_inventory;

create policy branch_inventory_storefront_tenant
on public.branch_inventory
for select
to anon, authenticated
using (
  not (select public.is_staff_user())
  and exists (
    select 1
    from public.branches b
    where b.id = branch_id
      and b.is_active
      and b.tenant_id = (select public.request_storefront_tenant_id())
  )
);
