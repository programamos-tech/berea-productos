-- Cotizaciones POS no descuentan stock. Al anular, el fallback POS:% + quantity
-- reinflaba inventario (p. ej. Desenredante Martina +18). Corregir RPC + stock fantasma.

create or replace function public.restore_order_items_stock(p_order_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  o record;
  it record;
  comp jsonb;
  loc int;
  wh int;
  pid uuid;
  pos_paid boolean;
begin
  if not public.user_has_admin_profile() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select status, wompi_reference, stock_restored_at
  into o
  from public.orders
  where id = p_order_id;

  if not found then
    raise exception 'order_not_found' using errcode = 'P0001';
  end if;

  if o.stock_restored_at is not null then
    return;
  end if;

  -- Cotización: nunca descontó; solo marcar para idempotencia.
  if o.status = 'quotation'
    or coalesce(o.wompi_reference, '') = 'POS:quotation'
  then
    update public.orders
    set stock_restored_at = now()
    where id = p_order_id
      and stock_restored_at is null;
    return;
  end if;

  -- Fallback a quantity solo para ventas POS cobradas (no cotizaciones).
  pos_paid := coalesce(o.wompi_reference, '') in (
    'POS:cash',
    'POS:transfer',
    'POS:mixed'
  )
  or (
    coalesce(o.wompi_reference, '') like 'POS:%'
    and coalesce(o.wompi_reference, '') <> 'POS:quotation'
  );

  for it in
    select
      oi.product_id,
      oi.quantity,
      oi.stock_deducted_local,
      oi.stock_deducted_warehouse,
      oi.kit_id,
      oi.kit_component_deductions
    from public.order_items oi
    where oi.order_id = p_order_id
  loop
    if it.kit_id is not null and it.kit_component_deductions is not null then
      for comp in
        select * from jsonb_array_elements(it.kit_component_deductions)
      loop
        pid := (comp->>'product_id')::uuid;
        loc := coalesce((comp->>'stock_deducted_local')::int, 0);
        wh := coalesce((comp->>'stock_deducted_warehouse')::int, 0);
        if pid is null or (loc = 0 and wh = 0) then
          continue;
        end if;
        update public.products p
        set
          stock_local = p.stock_local + loc,
          stock_warehouse = p.stock_warehouse + wh
        where p.id = pid;
      end loop;
      continue;
    end if;

    if it.product_id is null then
      continue;
    end if;

    loc := coalesce(it.stock_deducted_local, 0);
    wh := coalesce(it.stock_deducted_warehouse, 0);

    if loc = 0 and wh = 0 then
      if pos_paid then
        loc := greatest(0, coalesce(it.quantity, 0));
      else
        continue;
      end if;
    end if;

    if loc = 0 and wh = 0 then
      continue;
    end if;

    update public.products p
    set
      stock_local = p.stock_local + loc,
      stock_warehouse = p.stock_warehouse + wh
    where p.id = it.product_id;
  end loop;

  update public.orders
  set stock_restored_at = now()
  where id = p_order_id
    and stock_restored_at is null;
end;
$$;

comment on function public.restore_order_items_stock(uuid) is
  'Devuelve inventario al anular (idempotente). Cotizaciones no reponen stock. Fallback quantity solo en ventas POS cobradas.';

-- Revertir unidades fantasma inyectadas al anular cotizaciones DEISY (13 ago 2026).
with phantom as (
  select
    (m->>'product_id')::uuid as product_id,
    sum((m->>'local_delta')::int)::int as phantom_units
  from public.admin_activity_log a
  join public.orders o on o.id = a.entity_id
  cross join lateral jsonb_array_elements(coalesce(a.metadata->'stock_movements', '[]'::jsonb)) m
  where a.action_type = 'sale_cancelled'
    and coalesce(a.metadata->>'stock_direction', '') = 'restore'
    and o.wompi_reference = 'POS:quotation'
    and (m->>'local_delta')::int > 0
  group by 1
)
update public.products p
set stock_local = greatest(0, p.stock_local - ph.phantom_units)
from phantom ph
where p.id = ph.product_id;
