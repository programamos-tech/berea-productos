-- Un abono anulado se conserva en el historial y deja de sumar al saldo pagado.

alter table public.supplier_invoice_payments
  add column if not exists is_cancelled boolean not null default false;

alter table public.supplier_invoice_payments
  add column if not exists cancelled_at timestamptz;

alter table public.supplier_invoice_payments
  add column if not exists cancellation_reason text;
