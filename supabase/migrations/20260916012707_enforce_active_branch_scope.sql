-- Access to a branch is not the same as selecting it. Owners may access every
-- branch, but ordinary admin reads and writes must only see the active branch.
do $$
declare
  t text;
begin
  foreach t in array array[
    'orders', 'order_items', 'customers', 'customer_addresses',
    'store_expenses', 'cash_register_sessions',
    'supplier_invoices', 'supplier_invoice_lines',
    'supplier_invoice_payments', 'supplier_invoice_attachments',
    'order_transfer_proofs', 'admin_activity_log', 'admin_form_tokens'
  ] loop
    execute format(
      'drop policy if exists %I on public.%I',
      t || '_staff_branch_isolation',
      t
    );
    execute format(
      $policy$
        create policy %I on public.%I as restrictive for all to authenticated
        using (
          not (select public.is_staff_user())
          or branch_id = (select public.current_staff_branch_id())
        )
        with check (
          not (select public.is_staff_user())
          or branch_id = (select public.current_staff_branch_id())
        )
      $policy$,
      t || '_staff_branch_isolation',
      t
    );
  end loop;
end $$;

-- New branches start with shared products and zero inventory, customers and
-- operations. A POS sale can still use the text snapshot "Cliente Final".
create or replace function public.tg_create_branch_product_inventory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.branch_inventory (tenant_id, branch_id, product_id, quantity)
  select new.tenant_id, new.id, p.id, 0
  from public.products p
  where p.tenant_id = new.tenant_id
  on conflict do nothing;
  return new;
end;
$$;

delete from public.customers c
using public.branches b
where c.branch_id = b.id
  and not b.is_default
  and lower(btrim(c.name)) = 'cliente final'
  and c.source = 'manual'
  and c.email is null
  and c.phone is null
  and c.document_id is null
  and c.auth_user_id is null
  and not exists (
    select 1 from public.orders o where o.customer_id = c.id
  );
