-- Admin puede actualizar líneas de pedido (marcadores de stock al facturar cotización,
-- descuentos web, etc.). Sin UPDATE policy, PostgREST “tiene éxito” con 0 filas.
drop policy if exists "order_items_update_admin" on public.order_items;
create policy "order_items_update_admin"
on public.order_items
for update
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid())
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid())
);

-- Backfill: cotizaciones facturadas donde el stock sí se descontó del producto
-- pero stock_deducted_* quedó en 0 por la policy faltante.
-- No tocamos products.stock_* (ya está correcto).
update public.order_items oi
set
  stock_deducted_local = oi.quantity,
  stock_deducted_warehouse = 0
from public.orders o
where oi.order_id = o.id
  and o.status = 'paid'
  and o.wompi_reference like 'POS:%'
  and o.updated_at >= '2026-08-10 00:00:00+00'
  and oi.product_id is not null
  and coalesce(oi.stock_deducted_local, 0) = 0
  and coalesce(oi.stock_deducted_warehouse, 0) = 0
  and oi.quantity > 0
  and exists (
    select 1
    from public.admin_activity_log a
    where a.entity_id = o.id
      and a.action_type = 'sale_created'
      and coalesce(a.metadata->>'from_quotation', '') = 'true'
      and coalesce(a.metadata->>'stock_direction', '') = 'deduct'
  );
