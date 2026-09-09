-- KPIs de reportes en 1 round-trip: agrega ingresos/IVA/ganancia bruta al dashboard
-- (misma regla que admin_report_period_line_metrics). Omite paidOrderIds y el detalle
-- de expenseLines (no los usa la UI de KPIs) para achicar el payload.

create or replace function public.admin_report_dashboard_agg(
  p_fetch_from date,
  p_fetch_to date,
  p_range_from date,
  p_range_to date,
  p_chart_from date,
  p_chart_to date
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_gte timestamptz;
  v_lt timestamptz;
  v_range_gte timestamptz;
  v_range_lt timestamptz;
  v_result jsonb;
begin
  if p_fetch_from is null or p_fetch_to is null
     or p_range_from is null or p_range_to is null
     or p_chart_from is null or p_chart_to is null then
    return '{}'::jsonb;
  end if;

  v_gte := (p_fetch_from::text || ' 00:00:00')::timestamp at time zone 'America/Bogota';
  v_lt := ((p_fetch_to + 1)::text || ' 00:00:00')::timestamp at time zone 'America/Bogota';
  v_range_gte := (p_range_from::text || ' 00:00:00')::timestamp at time zone 'America/Bogota';
  v_range_lt := ((p_range_to + 1)::text || ' 00:00:00')::timestamp at time zone 'America/Bogota';

  with order_rows as (
    select
      o.id,
      o.status,
      o.total_cents,
      o.created_at,
      coalesce(o.wompi_reference, '') as wompi_reference,
      o.pos_mixed_cash_cents,
      o.pos_mixed_transfer_cents,
      to_char(o.created_at at time zone 'America/Bogota', 'YYYY-MM-DD') as day_key
    from orders o
    where o.created_at >= v_gte
      and o.created_at < v_lt
  ),
  order_period as (
    select *
    from order_rows
    where day_key >= p_range_from::text
      and day_key <= p_range_to::text
  ),
  order_chart as (
    select *
    from order_rows
    where day_key >= p_chart_from::text
      and day_key <= p_chart_to::text
      and status = 'paid'
  ),
  order_stats as (
    select
      coalesce(sum(case when status = 'paid' then greatest(0, coalesce(total_cents, 0)) else 0 end), 0)::bigint as total_cobrado,
      coalesce(sum(
        case when status = 'paid' then
          case
            when wompi_reference = 'POS:cash' then greatest(0, coalesce(total_cents, 0))
            when wompi_reference = 'POS:mixed' then greatest(0, coalesce(pos_mixed_cash_cents, 0))
            else 0
          end
        else 0 end
      ), 0)::bigint as efectivo,
      coalesce(sum(
        case when status = 'paid' then
          case
            when wompi_reference = 'POS:transfer' then greatest(0, coalesce(total_cents, 0))
            when wompi_reference = 'POS:mixed' then greatest(0, coalesce(pos_mixed_transfer_cents, 0))
            when wompi_reference not like 'POS:%' then greatest(0, coalesce(total_cents, 0))
            else 0
          end
        else 0 end
      ), 0)::bigint as transferencia,
      coalesce(count(*) filter (where status = 'cancelled'), 0)::int as anuladas,
      coalesce(sum(case when status = 'paid' and wompi_reference not like 'POS:%'
        then greatest(0, coalesce(total_cents, 0)) else 0 end), 0)::bigint as ventas_virtuales,
      coalesce(count(*) filter (where status = 'paid'), 0)::int as ventas_pagadas
    from order_period
  ),
  chart_stats as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'day_key', day_key,
          'income_cents', income_cents,
          'order_count', order_count
        )
        order by day_key
      ),
      '[]'::jsonb
    ) as points
    from (
      select
        day_key,
        coalesce(sum(greatest(0, coalesce(total_cents, 0))), 0)::bigint as income_cents,
        count(*)::int as order_count
      from order_chart
      group by day_key
    ) d
  ),
  expense_rows as (
    select
      e.id,
      e.concept,
      e.category,
      e.amount_cents,
      e.payment_method,
      e.created_at,
      coalesce(e.is_cancelled, false) as is_cancelled,
      coalesce(
        nullif(left(trim(e.expense_date::text), 10), ''),
        to_char(e.created_at at time zone 'America/Bogota', 'YYYY-MM-DD')
      ) as day_key
    from store_expenses e
    where e.expense_date >= p_fetch_from
      and e.expense_date <= p_fetch_to
  ),
  expense_stats as (
    select
      coalesce(sum(case when not is_cancelled and day_key >= p_range_from::text and day_key <= p_range_to::text
        then greatest(0, coalesce(amount_cents, 0)) else 0 end), 0)::bigint as egresos_period,
      coalesce(count(*) filter (
        where not is_cancelled and day_key >= p_range_from::text and day_key <= p_range_to::text
      ), 0)::int as cantidad_egresos,
      coalesce(sum(case when not is_cancelled and day_key >= p_range_from::text and day_key <= p_range_to::text
        and lower(trim(coalesce(payment_method, ''))) = 'efectivo'
        then greatest(0, coalesce(amount_cents, 0)) else 0 end), 0)::bigint as egresos_efectivo,
      coalesce(sum(case when not is_cancelled and day_key >= p_range_from::text and day_key <= p_range_to::text
        and lower(trim(coalesce(payment_method, ''))) <> 'efectivo'
        then greatest(0, coalesce(amount_cents, 0)) else 0 end), 0)::bigint as egresos_otros
    from expense_rows
  ),
  expense_chart as (
    select coalesce(
      jsonb_object_agg(day_key, day_total),
      '{}'::jsonb
    ) as by_day
    from (
      select
        day_key,
        sum(greatest(0, coalesce(amount_cents, 0)))::bigint as day_total
      from expense_rows
      where not is_cancelled
        and day_key >= p_chart_from::text
        and day_key <= p_chart_to::text
      group by day_key
    ) d
  ),
  paid_period as (
    select
      o.id,
      o.total_cents,
      coalesce(o.wompi_reference, '') as wr
    from orders o
    where o.status = 'paid'
      and o.created_at >= v_range_gte
      and o.created_at < v_range_lt
  ),
  line_rows as (
    select
      p.total_cents,
      greatest(0, floor(coalesce(oi.quantity, 0)))::int as qty,
      greatest(0, round(coalesce(oi.unit_price_cents, 0)))::int as unit,
      coalesce(pr.has_vat, false) as has_vat,
      greatest(0, round(coalesce(pr.price_cents, 0)))::int as catalog_net,
      greatest(0, round(coalesce(pr.cost_cents, 0)))::int as cost_unit,
      (p.wr like 'POS:%') as is_pos,
      (oi.id is null) as no_item
    from paid_period p
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
    from line_rows
  ),
  line_metrics as (
    select
      coalesce(sum(net_cents), 0)::bigint as ingresos_sin_iva,
      coalesce(sum(gross_cents), 0)::bigint as ingresos_con_iva,
      coalesce(sum(net_cents - cost_cents), 0)::bigint as ganancia_bruta
    from priced
  )
  select jsonb_build_object(
    'totalCobradoPedidos', (select total_cobrado from order_stats),
    'efectivo', (select efectivo from order_stats),
    'transferencia', (select transferencia from order_stats),
    'anuladas', (select anuladas from order_stats),
    'ventasVirtuales', (select ventas_virtuales from order_stats),
    'ventasPagadasPeriod', (select ventas_pagadas from order_stats),
    'paidOrderIds', '[]'::jsonb,
    'chartPoints', (select points from chart_stats),
    'expensesByChartDay', (select by_day from expense_chart),
    'egresosPeriod', (select egresos_period from expense_stats),
    'cantidadEgresosPeriod', (select cantidad_egresos from expense_stats),
    'egresosEfectivoCents', (select egresos_efectivo from expense_stats),
    'egresosTransferenciaBucketCents', (select egresos_otros from expense_stats),
    'expenseLines', '[]'::jsonb,
    'ingresosSinIva', (select ingresos_sin_iva from line_metrics),
    'ingresosConIva', (select ingresos_con_iva from line_metrics),
    'gananciaBruta', (select ganancia_bruta from line_metrics)
  )
  into v_result;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;
