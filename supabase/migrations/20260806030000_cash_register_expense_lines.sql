-- Detalle de egresos congelado al cerrar caja.
alter table public.cash_register_sessions
  add column if not exists expense_lines jsonb not null default '[]'::jsonb;

comment on column public.cash_register_sessions.expense_lines is
  'Egresos del día al cerrar: [{id,concept,payment_method,amount_cents}].';
