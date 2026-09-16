alter table public.customers
  add column if not exists document_type text not null default 'cc',
  add column if not exists requires_electronic_invoice boolean not null default false;

alter table public.customers
  drop constraint if exists customers_document_type_check;

alter table public.customers
  add constraint customers_document_type_check
  check (document_type in ('cc', 'nit'));

update public.customers
set document_type = 'nit'
where customer_kind = 'wholesale'
  and document_type = 'cc';

comment on column public.customers.document_type is
  'Tipo de identificación fiscal del cliente: cc = cédula, nit = NIT.';

comment on column public.customers.requires_electronic_invoice is
  'Indica si el cliente solicita factura electrónica en sus compras.';
