-- Distingue gastos operativos de egresos (pagos a proveedores / impuestos).
alter table public.store_expenses
  add column if not exists expense_kind text not null default 'gasto'
  constraint store_expenses_expense_kind_check
  check (expense_kind in ('gasto', 'egreso'));

comment on column public.store_expenses.expense_kind is
  'gasto = operativo; egreso = pagos a proveedores o impuestos.';

-- Abonos ya vinculados a facturas de proveedor pasan a egreso.
update public.store_expenses
set expense_kind = 'egreso'
where supplier_invoice_payment_id is not null
  and expense_kind = 'gasto';

create index if not exists store_expenses_kind_date_idx
  on public.store_expenses (expense_kind, expense_date desc, created_at desc);
