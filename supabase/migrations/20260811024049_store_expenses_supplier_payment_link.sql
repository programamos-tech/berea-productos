-- Vincula egresos operativos a abonos de factura de proveedor (dual-write desde Proveedores).
alter table public.store_expenses
  add column if not exists supplier_invoice_payment_id uuid
    references public.supplier_invoice_payments (id)
    on delete set null;

create unique index if not exists store_expenses_supplier_invoice_payment_id_uidx
  on public.store_expenses (supplier_invoice_payment_id)
  where supplier_invoice_payment_id is not null;

comment on column public.store_expenses.supplier_invoice_payment_id is
  'Abono de proveedor que generó este egreso (espejo automático).';
