-- Estado de recepción de la orden de compra y cantidades ya ingresadas al inventario.

alter table public.supplier_invoices
  add column if not exists receipt_status text not null default 'sent';

alter table public.supplier_invoices
  drop constraint if exists supplier_invoices_receipt_status_check;

alter table public.supplier_invoices
  add constraint supplier_invoices_receipt_status_check
  check (receipt_status in ('sent', 'receiving', 'received'));

alter table public.supplier_invoice_lines
  add column if not exists received_quantity integer not null default 0;

alter table public.supplier_invoice_lines
  drop constraint if exists supplier_invoice_lines_received_quantity_check;

alter table public.supplier_invoice_lines
  add constraint supplier_invoice_lines_received_quantity_check
  check (received_quantity >= 0);
