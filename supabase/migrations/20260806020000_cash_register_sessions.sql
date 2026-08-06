-- Cierre de caja diario: apertura con fondo + snapshot inmutable al cerrar.

create table if not exists public.cash_register_sessions (
  id uuid primary key default gen_random_uuid(),
  business_day date not null,
  status text not null
    check (status in ('open', 'closed')),
  opening_float_cents integer not null default 0
    check (opening_float_cents >= 0),
  opened_at timestamptz not null default now(),
  opened_by uuid not null references public.profiles (id),
  -- Totales congelados al cerrar (null mientras open)
  sales_count integer,
  sales_total_cents integer,
  sales_cash_cents integer,
  sales_transfer_cents integer,
  sales_mixed_cents integer,
  sales_other_cents integer,
  expenses_cash_cents integer,
  expenses_other_cents integer,
  expected_cash_cents integer,
  counted_cash_cents integer
    check (counted_cash_cents is null or counted_cash_cents >= 0),
  cash_difference_cents integer,
  units_sold integer,
  stock_out_lines jsonb not null default '[]'::jsonb,
  notes text,
  closed_at timestamptz,
  closed_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint cash_register_sessions_closed_integrity check (
    (status = 'open'
      and closed_at is null
      and closed_by is null
      and counted_cash_cents is null)
    or
    (status = 'closed'
      and closed_at is not null
      and closed_by is not null
      and counted_cash_cents is not null
      and expected_cash_cents is not null)
  )
);

-- Una sola sesión abierta a la vez (negocio de un solo mostrador).
create unique index if not exists cash_register_sessions_one_open_idx
  on public.cash_register_sessions ((status))
  where status = 'open';

-- Un cierre por día de negocio (calendario tienda).
create unique index if not exists cash_register_sessions_day_unique_idx
  on public.cash_register_sessions (business_day);

create index if not exists cash_register_sessions_day_idx
  on public.cash_register_sessions (business_day desc);

create index if not exists cash_register_sessions_status_idx
  on public.cash_register_sessions (status, opened_at desc);

alter table public.cash_register_sessions enable row level security;

drop policy if exists "cash_register_sessions_select_admin" on public.cash_register_sessions;
create policy "cash_register_sessions_select_admin"
on public.cash_register_sessions
for select
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid()));

drop policy if exists "cash_register_sessions_insert_admin" on public.cash_register_sessions;
create policy "cash_register_sessions_insert_admin"
on public.cash_register_sessions
for insert
to authenticated
with check (
  opened_by = auth.uid()
  and exists (select 1 from public.profiles p where p.id = auth.uid())
);

drop policy if exists "cash_register_sessions_update_admin" on public.cash_register_sessions;
create policy "cash_register_sessions_update_admin"
on public.cash_register_sessions
for update
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid()))
with check (exists (select 1 from public.profiles p where p.id = auth.uid()));

comment on table public.cash_register_sessions is
  'Sesiones de caja diarias: fondo inicial al abrir; al cerrar se congela efectivo esperado vs contado y salidas de stock.';

-- Ampliar activity log con eventos de caja.
alter table public.admin_activity_log
  drop constraint if exists admin_activity_log_action_type_check;

alter table public.admin_activity_log
  add constraint admin_activity_log_action_type_check
  check (
    action_type in (
      'customer_created',
      'customer_updated',
      'product_created',
      'product_updated',
      'stock_adjusted',
      'stock_transferred',
      'sale_created',
      'sale_cancelled',
      'cash_session_opened',
      'cash_session_closed'
    )
  );
