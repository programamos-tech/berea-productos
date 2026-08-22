-- Alcance: diario afecta cierre de caja; mensual solo reportes del mes.
alter table public.store_expenses
  add column if not exists expense_scope text not null default 'diario'
  constraint store_expenses_expense_scope_check
  check (expense_scope in ('diario', 'mensual'));

comment on column public.store_expenses.expense_scope is
  'diario = afecta cierre de caja del día; mensual = solo totales del mes (no toca caja).';

create index if not exists store_expenses_scope_date_idx
  on public.store_expenses (expense_scope, expense_date desc, created_at desc);
