-- El proveedor de una orden queda asociado al producto que surte.
alter table public.products
  add column if not exists supplier_id uuid references public.suppliers (id) on delete set null;

create index if not exists products_supplier_idx on public.products (supplier_id);

-- Marca de mercancía mala en la línea de la orden de compra.
alter table public.supplier_invoice_lines
  add column if not exists is_defective boolean not null default false;
