-- Pulso mensual de Reportes: 1 round-trip en vez de miles de ítems vía PostgREST.
-- Misma regla de neto/bruto que lib/order-revenue-vat.ts (IVA venta 19 %).

create or replace function public.admin_report_monthly_pulse(
  p_today date,
  p_max_months int default 24
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_today date;
  v_max int;
  v_first date;
  v_gte timestamptz;
  v_lt timestamptz;
  v_prior_from date;
  v_prior_to date;
  v_result jsonb;
begin
  v_today := coalesce(
    p_today,
    (timezone('America/Bogota', now()))::date
  );
  v_max := least(greatest(coalesce(p_max_months, 24), 2), 24);

  select (date_trunc(
    'month',
    min(o.created_at at time zone 'America/Bogota')
  ))::date
  into v_first
  from orders o
  where o.status = 'paid';

  if v_first is null then
    return jsonb_build_object('months', '[]'::jsonb, 'prior_mtd_neta', null);
  end if;

  v_first := greatest(
    v_first,
    (date_trunc('month', v_today) - make_interval(months => v_max - 1))::date
  );

  v_gte := (v_first::text || ' 00:00:00')::timestamp at time zone 'America/Bogota';
  v_lt := ((v_today + 1)::text || ' 00:00:00')::timestamp at time zone 'America/Bogota';

  v_prior_from := (date_trunc('month', v_today) - interval '1 month')::date;
  v_prior_to := least(
    v_prior_from + (extract(day from v_today)::int - 1),
    (date_trunc('month', v_today) - interval '1 day')::date
  );

  with paid as (
    select
      o.id,
      o.total_cents,
      o.created_at,
      coalesce(o.wompi_reference, '') as wr,
      to_char(o.created_at at time zone 'America/Bogota', 'YYYY-MM') as ym,
      to_char(o.created_at at time zone 'America/Bogota', 'YYYY-MM-DD') as day_key
    from orders o
    where o.status = 'paid'
      and o.created_at >= v_gte
      and o.created_at < v_lt
  ),
  lines as (
    select
      p.id as order_id,
      p.ym,
      p.day_key,
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
      order_id,
      ym,
      day_key,
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
  ),
  by_month as (
    select
      ym,
      count(distinct order_id)::int as ventas,
      coalesce(sum(gross_cents), 0)::bigint as ingresos_con_iva,
      coalesce(sum(net_cents - cost_cents), 0)::bigint as ganancia_bruta
    from priced
    group by ym
  ),
  expenses as (
    select
      to_char(
        coalesce(
          expense_date,
          (created_at at time zone 'America/Bogota')::date
        ),
        'YYYY-MM'
      ) as ym,
      coalesce(sum(greatest(0, coalesce(amount_cents, 0))), 0)::bigint as egresos
    from store_expenses
    where coalesce(is_cancelled, false) = false
      and coalesce(expense_date, (created_at at time zone 'America/Bogota')::date)
        between v_first and v_today
    group by 1
  ),
  months as (
    select
      b.ym,
      b.ventas,
      b.ingresos_con_iva,
      b.ganancia_bruta,
      coalesce(e.egresos, 0)::bigint as egresos,
      (b.ganancia_bruta - coalesce(e.egresos, 0))::bigint as ganancia_neta
    from by_month b
    left join expenses e on e.ym = b.ym
    union all
    select
      e.ym,
      0,
      0::bigint,
      0::bigint,
      e.egresos,
      (0 - e.egresos)::bigint
    from expenses e
    where not exists (select 1 from by_month b where b.ym = e.ym)
  ),
  prior_mtd as (
    select
      coalesce(sum(p.net_cents - p.cost_cents), 0)::bigint
      - coalesce((
          select sum(greatest(0, coalesce(se.amount_cents, 0)))
          from store_expenses se
          where coalesce(se.is_cancelled, false) = false
            and coalesce(
              se.expense_date,
              (se.created_at at time zone 'America/Bogota')::date
            ) between v_prior_from and v_prior_to
        ), 0)::bigint as neta
    from priced p
    where p.day_key >= v_prior_from::text
      and p.day_key <= v_prior_to::text
  )
  select jsonb_build_object(
    'months', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'year_month', ym,
            'ventas', ventas,
            'ingresos_con_iva', ingresos_con_iva,
            'ganancia_bruta', ganancia_bruta,
            'egresos', egresos,
            'ganancia_neta', ganancia_neta
          )
          order by ym
        )
        from months
      ),
      '[]'::jsonb
    ),
    'prior_mtd_neta', (select neta from prior_mtd)
  )
  into v_result;

  return coalesce(
    v_result,
    jsonb_build_object('months', '[]'::jsonb, 'prior_mtd_neta', null)
  );
end;
$$;

grant execute on function public.admin_report_monthly_pulse(date, int) to authenticated;
