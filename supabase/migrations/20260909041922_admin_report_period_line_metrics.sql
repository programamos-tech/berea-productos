-- Métricas de líneas del periodo en 1 RPC (evita N round-trips PostgREST de ítems/productos).
-- Misma regla de neto/bruto/costo que admin_report_monthly_pulse / lib/order-revenue-vat.ts.

create or replace function public.admin_report_period_line_metrics(
  p_from date,
  p_to date
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_from date;
  v_to date;
  v_gte timestamptz;
  v_lt timestamptz;
begin
  if p_from is null or p_to is null then
    return jsonb_build_object(
      'ingresos_sin_iva', 0,
      'ingresos_con_iva', 0,
      'ganancia_bruta', 0
    );
  end if;

  v_from := least(p_from, p_to);
  v_to := greatest(p_from, p_to);
  v_gte := (v_from::text || ' 00:00:00')::timestamp at time zone 'America/Bogota';
  v_lt := ((v_to + 1)::text || ' 00:00:00')::timestamp at time zone 'America/Bogota';

  return (
    with paid as (
      select
        o.id,
        o.total_cents,
        coalesce(o.wompi_reference, '') as wr
      from orders o
      where o.status = 'paid'
        and o.created_at >= v_gte
        and o.created_at < v_lt
    ),
    lines as (
      select
        p.id as order_id,
        p.total_cents,
        greatest(0, floor(coalesce(oi.quantity, 0)))::int as qty,
        greatest(0, round(coalesce(oi.unit_price_cents, 0)))::int as unit,
        coalesce(pr.has_vat, false) as has_vat,
        greatest(0, round(coalesce(pr.price_cents, 0)))::int as catalog_net,
        greatest(0, round(coalesce(pr.cost_cents, 0)))::int as cost_unit,
        (p.wr like 'POS:%') as is_pos,
        (oi.id is null) as no_item
      from paid p
      left join order_items oi on oi.order_id = p.id
      left join products pr on pr.id = oi.product_id
    ),
    priced as (
      select
        case
          when no_item then greatest(0, total_cents)
          when qty <= 0 then 0
          when is_pos and has_vat then
            case
              when abs(unit - catalog_net) < abs(unit - round(catalog_net * 1.19))
                   and abs(unit - catalog_net) <= greatest(2, round(catalog_net * 0.005))
              then unit * qty
              else round(unit / 1.19) * qty
            end
          when has_vat and not is_pos
               and abs(unit - catalog_net) <= greatest(4, round(catalog_net * 0.02))
            then unit * qty
          when has_vat then round(unit / 1.19) * qty
          else unit * qty
        end as net_cents,
        case
          when no_item then greatest(0, total_cents)
          when qty <= 0 then 0
          when is_pos and has_vat then
            case
              when abs(unit - catalog_net) < abs(unit - round(catalog_net * 1.19))
                   and abs(unit - catalog_net) <= greatest(2, round(catalog_net * 0.005))
              then round(unit * 1.19) * qty
              else unit * qty
            end
          when has_vat and not is_pos
               and abs(unit - catalog_net) <= greatest(4, round(catalog_net * 0.02))
            then round(unit * 1.19) * qty
          else unit * qty
        end as gross_cents,
        case
          when no_item or qty <= 0 then 0
          else cost_unit * qty
        end as cost_cents
      from lines
    )
    select jsonb_build_object(
      'ingresos_sin_iva', coalesce(sum(net_cents), 0)::bigint,
      'ingresos_con_iva', coalesce(sum(gross_cents), 0)::bigint,
      'ganancia_bruta', coalesce(sum(net_cents - cost_cents), 0)::bigint
    )
    from priced
  );
end;
$$;

grant execute on function public.admin_report_period_line_metrics(date, date) to authenticated;
