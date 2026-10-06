-- Catálogo público por sucursal y código de acceso de mayoristas.

create table if not exists public.product_branch_listings (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  branch_id uuid not null references public.branches (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (branch_id, product_id)
);

create index if not exists product_branch_listings_product_idx
  on public.product_branch_listings (product_id);

create index if not exists product_branch_listings_tenant_idx
  on public.product_branch_listings (tenant_id);

alter table public.product_branch_listings enable row level security;

drop policy if exists product_branch_listings_select on public.product_branch_listings;
drop policy if exists product_branch_listings_select_public on public.product_branch_listings;
drop policy if exists product_branch_listings_select_staff on public.product_branch_listings;

create policy product_branch_listings_select_public
  on public.product_branch_listings
  for select
  to anon
  using (
    exists (
      select 1
      from public.products p
      where p.id = product_id
        and p.is_published = true
    )
  );

create policy product_branch_listings_select_staff
  on public.product_branch_listings
  for select
  to authenticated
  using (
    (select public.is_staff())
    or exists (
      select 1
      from public.products p
      where p.id = product_id
        and p.is_published = true
    )
  );

drop policy if exists product_branch_listings_staff_insert on public.product_branch_listings;
create policy product_branch_listings_staff_insert
  on public.product_branch_listings
  for insert
  to authenticated
  with check (public.is_staff());

drop policy if exists product_branch_listings_staff_update on public.product_branch_listings;
create policy product_branch_listings_staff_update
  on public.product_branch_listings
  for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists product_branch_listings_staff_delete on public.product_branch_listings;
create policy product_branch_listings_staff_delete
  on public.product_branch_listings
  for delete
  to authenticated
  using (public.is_staff());

-- El catálogo publicado actual sigue solo en la sucursal por defecto (Local).
insert into public.product_branch_listings (tenant_id, branch_id, product_id)
select p.tenant_id, b.id, p.id
from public.products p
join public.branches b
  on b.tenant_id = p.tenant_id
 and b.is_default = true
 and b.is_active = true
where p.is_published = true
on conflict do nothing;

alter table public.customers
  add column if not exists storefront_access_code text;

create unique index if not exists customers_storefront_access_code_tenant_uidx
  on public.customers (tenant_id, storefront_access_code)
  where storefront_access_code is not null;

-- Un código por cliente mayorista que aún no tenga uno.
do $$
declare
  rec record;
  candidate text;
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
  n int;
begin
  for rec in
    select id, tenant_id
    from public.customers
    where customer_kind = 'wholesale'
      and storefront_access_code is null
  loop
    loop
      candidate := '';
      for i in 1..8 loop
        n := 1 + floor(random() * length(alphabet))::int;
        candidate := candidate || substr(alphabet, n, 1);
      end loop;
      exit when not exists (
        select 1
        from public.customers c
        where c.tenant_id is not distinct from rec.tenant_id
          and c.storefront_access_code = candidate
      );
    end loop;

    update public.customers
      set storefront_access_code = candidate
      where id = rec.id;
  end loop;
end $$;
