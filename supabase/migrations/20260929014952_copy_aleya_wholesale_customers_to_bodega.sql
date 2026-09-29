-- Aleya: copy wholesale customers from "Aleya Guacari" into "Aleya Bodega Mayorista"
-- (profile + addresses only, no orders). Customers already present in the bodega
-- (same document or email) are skipped, so re-running is a no-op.

create temp table aleya_wholesale_copy on commit drop as
select c.id as source_id, gen_random_uuid() as new_id
from public.customers c
where c.tenant_id = '29e45d00-d453-4b56-8c27-8ff43fadb809'
  and c.branch_id = '9ebdf02e-bab5-44e8-9ed0-6c960980115f'
  and c.customer_kind = 'wholesale'
  and not exists (
    select 1
    from public.customers b
    where b.tenant_id = c.tenant_id
      and b.branch_id = '610af7e1-6891-4ba3-9a54-e0afadb21c0f'
      and (
        (
          nullif(regexp_replace(coalesce(b.document_id, ''), '\D', '', 'g'), '')
          = nullif(regexp_replace(coalesce(c.document_id, ''), '\D', '', 'g'), '')
        )
        or (
          nullif(lower(trim(b.email)), '') = nullif(lower(trim(c.email)), '')
        )
      )
  );

insert into public.customers (
  id,
  name,
  email,
  phone,
  document_id,
  document_type,
  requires_electronic_invoice,
  birth_date,
  shipping_address,
  shipping_city,
  shipping_postal_code,
  shipping_neighborhood,
  shipping_reference,
  notes,
  source,
  customer_kind,
  wholesale_discount_percent,
  tenant_id,
  branch_id
)
select
  m.new_id,
  c.name,
  c.email,
  c.phone,
  c.document_id,
  c.document_type,
  c.requires_electronic_invoice,
  c.birth_date,
  c.shipping_address,
  c.shipping_city,
  c.shipping_postal_code,
  c.shipping_neighborhood,
  c.shipping_reference,
  c.notes,
  c.source,
  c.customer_kind,
  c.wholesale_discount_percent,
  c.tenant_id,
  '610af7e1-6891-4ba3-9a54-e0afadb21c0f'
from aleya_wholesale_copy m
join public.customers c on c.id = m.source_id;

insert into public.customer_addresses (
  customer_id,
  label,
  address_line,
  reference,
  sort_order,
  tenant_id,
  branch_id
)
select
  m.new_id,
  a.label,
  a.address_line,
  a.reference,
  a.sort_order,
  a.tenant_id,
  '610af7e1-6891-4ba3-9a54-e0afadb21c0f'
from aleya_wholesale_copy m
join public.customer_addresses a on a.customer_id = m.source_id;
