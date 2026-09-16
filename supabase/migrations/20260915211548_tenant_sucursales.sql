-- Sucursales reales dentro de cada tenant.
-- Catálogo/clientes siguen perteneciendo al tenant; operación e inventario
-- pertenecen a la sucursal activa.

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  code text not null,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint branches_name_not_blank check (btrim(name) <> ''),
  constraint branches_code_format check (code ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create unique index branches_tenant_code_uidx
  on public.branches (tenant_id, code);
create unique index branches_one_default_per_tenant_uidx
  on public.branches (tenant_id)
  where is_default;
create index branches_tenant_active_idx
  on public.branches (tenant_id, is_active, name);

create trigger branches_set_updated_at
before update on public.branches
for each row execute function public.set_updated_at();

create table public.profile_branch_memberships (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  branch_id uuid not null references public.branches (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, branch_id)
);

create index profile_branch_memberships_branch_idx
  on public.profile_branch_memberships (branch_id, profile_id);

create table public.branch_inventory (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  branch_id uuid not null references public.branches (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  primary key (branch_id, product_id)
);

create index branch_inventory_tenant_product_idx
  on public.branch_inventory (tenant_id, product_id);
create index branch_inventory_branch_quantity_idx
  on public.branch_inventory (branch_id, quantity);

create trigger branch_inventory_set_updated_at
before update on public.branch_inventory
for each row execute function public.set_updated_at();

-- Every customer account starts with a Local branch.
insert into public.branches (tenant_id, name, code, is_default)
select t.id, 'Local', 'local', true
from public.tenants t
where t.kind = 'customer'
on conflict (tenant_id, code) do update
set name = excluded.name,
    is_default = true,
    is_active = true;

-- Aleya additionally starts with Bodega.
insert into public.branches (tenant_id, name, code, is_default)
select t.id, 'Bodega', 'bodega', false
from public.tenants t
where t.slug = 'aleya'
on conflict (tenant_id, code) do update
set name = excluded.name,
    is_active = true;

-- Preserve access for every existing collaborator.
insert into public.profile_branch_memberships (profile_id, branch_id)
select p.id, b.id
from public.profiles p
join public.branches b
  on b.tenant_id = p.tenant_id
 and b.is_default
where p.is_platform_operator = false
on conflict do nothing;

-- Parse the selected branch propagated by middleware/PostgREST.
create or replace function public.request_branch_id()
returns uuid
language plpgsql
stable
as $$
declare
  headers_raw text;
  headers_json json;
  raw text;
begin
  begin
    headers_raw := current_setting('request.headers', true);
    if headers_raw is not null and btrim(headers_raw) <> '' then
      headers_json := headers_raw::json;
      raw := nullif(btrim(headers_json->>'x-berea-branch-id'), '');
    end if;
  exception when others then
    raw := null;
  end;

  if raw is null then
    begin
      raw := nullif(
        btrim(current_setting('request.header.x-berea-branch-id', true)),
        ''
      );
    exception when others then
      raw := null;
    end;
  end if;

  if raw is null
    or raw !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  then
    return null;
  end if;
  return raw::uuid;
end;
$$;

create or replace function public.staff_can_access_branch(p_branch_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.branches b
    where b.id = p_branch_id
      and b.tenant_id = public.current_staff_tenant_id()
      and b.is_active
      and (
        public.is_platform_operator()
        or exists (
          select 1
          from public.profiles p
          where p.id = (select auth.uid())
            and (
              p.job_role in ('owner', 'admin')
              or exists (
                select 1
                from public.profile_branch_memberships m
                where m.profile_id = p.id
                  and m.branch_id = b.id
              )
            )
        )
      )
  );
$$;

create or replace function public.current_staff_branch_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select b.id
      from public.branches b
      where b.id = public.request_branch_id()
        and public.staff_can_access_branch(b.id)
      limit 1
    ),
    (
      select b.id
      from public.branches b
      where b.tenant_id = public.current_staff_tenant_id()
        and b.is_active
        and public.staff_can_access_branch(b.id)
      order by b.is_default desc, b.created_at, b.id
      limit 1
    )
  );
$$;

create or replace function public.tg_validate_profile_branch_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_tenant uuid;
  branch_tenant uuid;
begin
  select tenant_id into profile_tenant from public.profiles where id = new.profile_id;
  select tenant_id into branch_tenant from public.branches where id = new.branch_id;
  if profile_tenant is null or branch_tenant is null
    or profile_tenant <> branch_tenant then
    raise exception 'membership_tenant_mismatch' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger profile_branch_memberships_validate_tenant
before insert or update on public.profile_branch_memberships
for each row execute function public.tg_validate_profile_branch_membership();

create or replace function public.replace_profile_branch_memberships(
  p_profile_id uuid,
  p_branch_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  tid uuid := public.current_staff_tenant_id();
  requested_count integer;
  valid_count integer;
begin
  if tid is null or not exists (
    select 1 from public.profiles manager
    where manager.id = auth.uid()
      and (
        manager.is_platform_operator
        or manager.job_role in ('owner', 'admin')
        or coalesce((manager.permissions->>'sucursales_gestionar')::boolean, false)
        or coalesce((manager.permissions->>'colaboradores_gestionar')::boolean, false)
      )
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.profiles target
    where target.id = p_profile_id and target.tenant_id = tid
  ) then
    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;

  select count(*) into requested_count
  from (select distinct unnest(coalesce(p_branch_ids, '{}'::uuid[]))) ids;
  select count(*) into valid_count
  from public.branches b
  where b.tenant_id = tid
    and b.is_active
    and b.id = any(coalesce(p_branch_ids, '{}'::uuid[]));
  if requested_count <> valid_count then
    raise exception 'invalid_branch_membership' using errcode = '23514';
  end if;

  delete from public.profile_branch_memberships where profile_id = p_profile_id;
  insert into public.profile_branch_memberships (profile_id, branch_id)
  select p_profile_id, b.id
  from public.branches b
  where b.tenant_id = tid
    and b.is_active
    and b.id = any(coalesce(p_branch_ids, '{}'::uuid[]));
end;
$$;

create or replace function public.update_branch_settings(
  p_branch_id uuid,
  p_name text,
  p_code text,
  p_is_active boolean,
  p_make_default boolean
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  tid uuid := public.current_staff_tenant_id();
  was_default boolean;
begin
  select is_default into was_default
  from public.branches
  where id = p_branch_id and tenant_id = tid
  for update;
  if not found then
    raise exception 'branch_not_found' using errcode = 'P0002';
  end if;
  if was_default and not p_make_default then
    raise exception 'default_branch_required' using errcode = '23514';
  end if;
  if p_make_default and not p_is_active then
    raise exception 'default_branch_must_be_active' using errcode = '23514';
  end if;

  if p_make_default and not was_default then
    perform 1 from public.branches where tenant_id = tid for update;
    update public.branches set is_default = false
    where tenant_id = tid and is_default;
  end if;
  update public.branches
  set name = p_name,
      code = p_code,
      is_active = p_is_active,
      is_default = p_make_default
  where id = p_branch_id and tenant_id = tid;
end;
$$;

create or replace function public.default_branch_id(p_tenant_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select b.id
  from public.branches b
  where b.tenant_id = p_tenant_id
    and b.is_active
  order by b.is_default desc, b.created_at, b.id
  limit 1;
$$;

revoke all on function public.request_branch_id() from public;
revoke all on function public.staff_can_access_branch(uuid) from public;
revoke all on function public.current_staff_branch_id() from public;
revoke all on function public.default_branch_id(uuid) from public;
grant execute on function public.request_branch_id() to authenticated, service_role;
grant execute on function public.staff_can_access_branch(uuid) to authenticated, service_role;
grant execute on function public.current_staff_branch_id() to authenticated, service_role;
grant execute on function public.default_branch_id(uuid) to anon, authenticated, service_role;
grant execute on function public.replace_profile_branch_memberships(uuid, uuid[]) to authenticated;
grant execute on function public.update_branch_settings(uuid, text, text, boolean, boolean)
  to authenticated;

-- Operational roots and children keep an immutable branch origin.
alter table public.orders add column branch_id uuid references public.branches (id);
alter table public.orders add column stock_deducted_at timestamptz;
alter table public.order_items add column branch_id uuid references public.branches (id);
alter table public.customers add column branch_id uuid references public.branches (id);
alter table public.customer_addresses add column branch_id uuid references public.branches (id);
alter table public.store_expenses add column branch_id uuid references public.branches (id);
alter table public.cash_register_sessions add column branch_id uuid references public.branches (id);
alter table public.supplier_invoices add column branch_id uuid references public.branches (id);
alter table public.supplier_invoice_lines add column branch_id uuid references public.branches (id);
alter table public.supplier_invoice_payments add column branch_id uuid references public.branches (id);
alter table public.supplier_invoice_attachments add column branch_id uuid references public.branches (id);
alter table public.order_transfer_proofs add column branch_id uuid references public.branches (id);
alter table public.admin_activity_log add column branch_id uuid references public.branches (id);
alter table public.admin_form_tokens add column branch_id uuid references public.branches (id);

update public.orders r
set branch_id = public.default_branch_id(r.tenant_id)
where branch_id is null;

update public.order_items c
set branch_id = p.branch_id
from public.orders p
where c.order_id = p.id and c.branch_id is null;

update public.customers c
set branch_id = public.default_branch_id(c.tenant_id)
where c.branch_id is null;

update public.customer_addresses a
set branch_id = c.branch_id
from public.customers c
where a.customer_id = c.id and a.branch_id is null;

update public.store_expenses r
set branch_id = public.default_branch_id(r.tenant_id)
where branch_id is null;

update public.cash_register_sessions r
set branch_id = public.default_branch_id(r.tenant_id)
where branch_id is null;

update public.supplier_invoices r
set branch_id = public.default_branch_id(r.tenant_id)
where branch_id is null;

update public.supplier_invoice_lines c
set branch_id = p.branch_id
from public.supplier_invoices p
where c.invoice_id = p.id and c.branch_id is null;

update public.supplier_invoice_payments c
set branch_id = p.branch_id
from public.supplier_invoices p
where c.invoice_id = p.id and c.branch_id is null;

update public.supplier_invoice_attachments c
set branch_id = p.branch_id
from public.supplier_invoices p
where c.invoice_id = p.id and c.branch_id is null;

update public.order_transfer_proofs c
set branch_id = p.branch_id
from public.orders p
where c.order_id = p.id and c.branch_id is null;

update public.admin_activity_log r
set branch_id = public.default_branch_id(r.tenant_id)
where branch_id is null;

update public.admin_form_tokens r
set branch_id = public.default_branch_id(r.tenant_id)
where branch_id is null;

update public.orders o
set stock_deducted_at = coalesce(o.updated_at, o.created_at)
where o.stock_deducted_at is null
  and exists (
    select 1
    from public.order_items oi
    where oi.order_id = o.id
      and (
        coalesce(oi.stock_deducted_local, 0) > 0
        or coalesce(oi.stock_deducted_warehouse, 0) > 0
        or oi.kit_component_deductions is not null
      )
  );

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
    execute format('alter table public.%I alter column branch_id set not null', t);
    execute format(
      'create index %I on public.%I (branch_id)',
      t || '_branch_id_idx',
      t
    );
  end loop;
end $$;

create unique index customers_id_branch_unique
  on public.customers (id, branch_id);
alter table public.orders
  add constraint orders_customer_branch_fk
  foreign key (customer_id, branch_id)
  references public.customers (id, branch_id);
alter table public.customer_addresses
  add constraint customer_addresses_customer_branch_fk
  foreign key (customer_id, branch_id)
  references public.customers (id, branch_id)
  on delete cascade;

drop index if exists public.customers_email_normalized_unique;
create unique index customers_email_normalized_unique
  on public.customers (tenant_id, branch_id, lower(trim(both from email)))
  where email is not null and length(trim(both from email)) > 0;

create or replace function public.find_customer_id_by_document_normalized(
  p_normalized text,
  p_branch_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.id
  from public.customers c
  where c.branch_id = p_branch_id
    and public.normalize_document_id(c.document_id) = p_normalized
  order by c.created_at asc, c.id asc
  limit 1;
$$;
revoke all on function public.find_customer_id_by_document_normalized(text)
  from public, service_role;
revoke all on function public.find_customer_id_by_document_normalized(text, uuid)
  from public;
grant execute on function public.find_customer_id_by_document_normalized(text, uuid)
  to service_role;

insert into public.customers (tenant_id, branch_id, name, source)
select b.tenant_id, b.id, 'Cliente Final', 'manual'
from public.branches b
where b.is_active
  and not exists (
    select 1 from public.customers c
    where c.branch_id = b.id
      and lower(btrim(c.name)) = 'cliente final'
  );

-- Populate branch inventory without losing any existing units.
insert into public.branch_inventory (tenant_id, branch_id, product_id, quantity)
select
  p.tenant_id,
  b.id,
  p.id,
  case
    when t.slug = 'aleya' then greatest(0, coalesce(p.stock_local, 0))
    else greatest(0, coalesce(p.stock_local, 0))
       + greatest(0, coalesce(p.stock_warehouse, 0))
  end
from public.products p
join public.tenants t on t.id = p.tenant_id
join public.branches b on b.tenant_id = p.tenant_id and b.is_default
on conflict (branch_id, product_id) do update
set quantity = excluded.quantity;

insert into public.branch_inventory (tenant_id, branch_id, product_id, quantity)
select
  p.tenant_id,
  b.id,
  p.id,
  greatest(0, coalesce(p.stock_warehouse, 0))
from public.products p
join public.tenants t on t.id = p.tenant_id and t.slug = 'aleya'
join public.branches b on b.tenant_id = p.tenant_id and b.code = 'bodega'
on conflict (branch_id, product_id) do update
set quantity = excluded.quantity;

-- New products automatically receive a zero row in every active branch.
create or replace function public.tg_create_product_branch_inventory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.branch_inventory (tenant_id, branch_id, product_id, quantity)
  select new.tenant_id, b.id, new.id, 0
  from public.branches b
  where b.tenant_id = new.tenant_id and b.is_active
  on conflict do nothing;
  return new;
end;
$$;

create trigger products_create_branch_inventory
after insert on public.products
for each row execute function public.tg_create_product_branch_inventory();

-- New branches receive one inventory row per existing product.
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
  insert into public.customers (tenant_id, branch_id, name, source)
  values (new.tenant_id, new.id, 'Cliente Final', 'manual');
  return new;
end;
$$;

create trigger branches_create_product_inventory
after insert on public.branches
for each row execute function public.tg_create_branch_product_inventory();

create or replace function public.tg_create_tenant_default_branch()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.kind = 'customer' then
    insert into public.branches (tenant_id, name, code, is_default)
    values (new.id, 'Principal', 'principal', true)
    on conflict (tenant_id, code) do nothing;
  end if;
  return new;
end;
$$;

create trigger tenants_create_default_branch
after insert on public.tenants
for each row execute function public.tg_create_tenant_default_branch();

create or replace function public.tg_set_active_branch()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.branch_id is null then
    new.branch_id := coalesce(
      public.current_staff_branch_id(),
      public.default_branch_id(new.tenant_id)
    );
  end if;

  if not exists (
    select 1 from public.branches b
    where b.id = new.branch_id and b.tenant_id = new.tenant_id
  ) then
    raise exception 'branch_tenant_mismatch' using errcode = '23514';
  end if;
  return new;
end;
$$;

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
    execute format('drop trigger if exists %I on public.%I', t || '_set_active_branch', t);
    execute format(
      'create trigger %I before insert or update of branch_id, tenant_id on public.%I for each row execute function public.tg_set_active_branch()',
      t || '_set_active_branch',
      t
    );
  end loop;
end $$;

-- Cash uniqueness now belongs to a branch, not the whole account.
drop index if exists public.cash_register_sessions_one_open_idx;
drop index if exists public.cash_register_sessions_day_unique_idx;
create unique index cash_register_sessions_one_open_idx
  on public.cash_register_sessions (branch_id)
  where status = 'open';
create unique index cash_register_sessions_day_unique_idx
  on public.cash_register_sessions (branch_id, business_day);

-- RLS: account-wide catalog, branch-wide operation.
alter table public.branches enable row level security;
alter table public.profile_branch_memberships enable row level security;
alter table public.branch_inventory enable row level security;

create policy branches_select_staff
on public.branches for select to authenticated
using (
  tenant_id = (select public.current_staff_tenant_id())
  and (
    (select public.is_platform_operator())
    or (select public.staff_can_access_branch(id))
  )
);

create policy branches_select_storefront_default
on public.branches for select to anon, authenticated
using (
  not (select public.is_staff_user())
  and tenant_id = (select public.request_storefront_tenant_id())
  and is_default
  and is_active
);

create policy branches_manage_staff
on public.branches for all to authenticated
using (
  tenant_id = (select public.current_staff_tenant_id())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and (
        p.is_platform_operator
        or p.job_role in ('owner', 'admin')
        or coalesce((p.permissions->>'sucursales_gestionar')::boolean, false)
      )
  )
)
with check (
  tenant_id = (select public.current_staff_tenant_id())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and (
        p.is_platform_operator
        or p.job_role in ('owner', 'admin')
        or coalesce((p.permissions->>'sucursales_gestionar')::boolean, false)
      )
  )
);

create policy memberships_select_staff
on public.profile_branch_memberships for select to authenticated
using (
  profile_id = (select auth.uid())
  or exists (
    select 1
    from public.branches b
    where b.id = branch_id
      and b.tenant_id = (select public.current_staff_tenant_id())
  )
);

create policy memberships_manage_staff
on public.profile_branch_memberships for all to authenticated
using (
  exists (
    select 1
    from public.branches b
    join public.profiles p on p.id = (select auth.uid())
    where b.id = branch_id
      and b.tenant_id = (select public.current_staff_tenant_id())
      and (
        p.is_platform_operator
        or p.job_role in ('owner', 'admin')
        or coalesce((p.permissions->>'sucursales_gestionar')::boolean, false)
      )
  )
)
with check (
  exists (
    select 1
    from public.branches b
    join public.profiles p on p.id = (select auth.uid())
    where b.id = branch_id
      and b.tenant_id = (select public.current_staff_tenant_id())
      and (
        p.is_platform_operator
        or p.job_role in ('owner', 'admin')
        or coalesce((p.permissions->>'sucursales_gestionar')::boolean, false)
      )
  )
);

create policy branch_inventory_staff
on public.branch_inventory for all to authenticated
using (
  tenant_id = (select public.current_staff_tenant_id())
  and (select public.staff_can_access_branch(branch_id))
)
with check (
  tenant_id = (select public.current_staff_tenant_id())
  and (select public.staff_can_access_branch(branch_id))
);

create policy branch_inventory_storefront_default
on public.branch_inventory for select to anon, authenticated
using (
  not (select public.is_staff_user())
  and branch_id = (
    select public.default_branch_id(public.request_storefront_tenant_id())
  )
);

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
    execute format('drop policy if exists %I on public.%I', t || '_staff_branch_isolation', t);
    execute format(
      $policy$
        create policy %I on public.%I as restrictive for all to authenticated
        using (
          not (select public.is_staff_user())
          or (select public.staff_can_access_branch(branch_id))
        )
        with check (
          not (select public.is_staff_user())
          or (select public.staff_can_access_branch(branch_id))
        )
      $policy$,
      t || '_staff_branch_isolation',
      t
    );
  end loop;
end $$;

-- Branch inventory RPCs used by the admin and storefront.
create or replace function public.current_branch_inventory(p_product_ids uuid[] default null)
returns table (product_id uuid, quantity integer)
language sql
stable
security invoker
set search_path = public
as $$
  select bi.product_id, bi.quantity
  from public.branch_inventory bi
  where bi.branch_id = public.current_staff_branch_id()
    and (p_product_ids is null or bi.product_id = any(p_product_ids));
$$;

create or replace function public.decrement_products_stock_local(p_items jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  r record;
  bid uuid := public.current_staff_branch_id();
begin
  if bid is null then
    raise exception 'branch_required' using errcode = '42501';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) = 0 then
    raise exception 'invalid_items' using errcode = '22023';
  end if;

  for r in
    select (elem->>'product_id')::uuid product_id,
           sum(greatest(1, floor((elem->>'quantity')::numeric))::int)::int quantity
    from jsonb_array_elements(p_items) elem
    where elem ? 'product_id' and elem ? 'quantity'
    group by 1 order by 1
  loop
    update public.branch_inventory bi
    set quantity = bi.quantity - r.quantity
    where bi.branch_id = bid
      and bi.product_id = r.product_id
      and bi.quantity >= r.quantity;
    if not found then
      raise exception 'insufficient_stock'
        using errcode = 'P0001', detail = r.product_id::text;
    end if;
  end loop;
end;
$$;

create or replace function public.decrement_order_branch_inventory(
  p_order_id uuid,
  p_items jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  order_row record;
begin
  select branch_id, stock_deducted_at, stock_restored_at
  into order_row
  from public.orders
  where id = p_order_id
  for update;
  if not found
    or order_row.branch_id <> public.current_staff_branch_id() then
    raise exception 'order_not_found' using errcode = 'P0002';
  end if;
  if order_row.stock_deducted_at is not null
    and order_row.stock_restored_at is null then
    return;
  end if;
  perform public.decrement_products_stock_local(p_items);
  update public.orders
  set stock_deducted_at = now(), stock_restored_at = null
  where id = p_order_id;
end;
$$;

create or replace function public.adjust_product_stock_add(
  p_product_id uuid,
  p_location text,
  p_qty integer
)
returns table (
  previous_local integer,
  previous_warehouse integer,
  next_local integer,
  next_warehouse integer
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  bid uuid := public.current_staff_branch_id();
  previous_qty integer;
  q integer := greatest(0, coalesce(p_qty, 0));
begin
  if bid is null or q <= 0 then
    raise exception 'invalid_branch_or_quantity' using errcode = '22023';
  end if;

  insert into public.branch_inventory (tenant_id, branch_id, product_id, quantity)
  select p.tenant_id, bid, p.id, q
  from public.products p
  where p.id = p_product_id
  on conflict (branch_id, product_id) do update
    set quantity = public.branch_inventory.quantity + excluded.quantity
  returning quantity - q into previous_qty;

  if previous_qty is null then
    raise exception 'product_not_found' using errcode = 'P0002';
  end if;
  return query select previous_qty, 0, previous_qty + q, 0;
end;
$$;

create or replace function public.set_product_branch_stock(
  p_product_id uuid,
  p_quantity integer
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  bid uuid := public.current_staff_branch_id();
  q integer := greatest(0, coalesce(p_quantity, 0));
begin
  if bid is null then
    raise exception 'branch_required' using errcode = '42501';
  end if;

  insert into public.branch_inventory (tenant_id, branch_id, product_id, quantity)
  select p.tenant_id, bid, p.id, q
  from public.products p
  where p.id = p_product_id
  on conflict (branch_id, product_id) do update set quantity = excluded.quantity
  returning quantity into q;

  if not found then
    raise exception 'product_not_found' using errcode = 'P0002';
  end if;
  return q;
end;
$$;

create or replace function public.transfer_product_stock_between_branches(
  p_product_id uuid,
  p_from_branch_id uuid,
  p_to_branch_id uuid,
  p_qty integer
)
returns table (previous_from integer, previous_to integer, next_from integer, next_to integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  q integer := greatest(0, coalesce(p_qty, 0));
  from_qty integer;
  to_qty integer;
begin
  if q <= 0 or p_from_branch_id = p_to_branch_id
    or not public.staff_can_access_branch(p_from_branch_id)
    or not public.staff_can_access_branch(p_to_branch_id) then
    raise exception 'invalid_transfer' using errcode = '22023';
  end if;

  select quantity into from_qty
  from public.branch_inventory
  where branch_id = p_from_branch_id and product_id = p_product_id
  for update;
  select quantity into to_qty
  from public.branch_inventory
  where branch_id = p_to_branch_id and product_id = p_product_id
  for update;

  from_qty := coalesce(from_qty, 0);
  to_qty := coalesce(to_qty, 0);
  if from_qty < q then
    raise exception 'insufficient_stock' using errcode = 'P0001';
  end if;

  update public.branch_inventory
  set quantity = from_qty - q
  where branch_id = p_from_branch_id and product_id = p_product_id;
  update public.branch_inventory
  set quantity = to_qty + q
  where branch_id = p_to_branch_id and product_id = p_product_id;

  return query select from_qty, to_qty, from_qty - q, to_qty + q;
end;
$$;

create or replace function public.deduct_order_branch_inventory(p_order_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  bid uuid;
  order_row record;
  item record;
  component jsonb;
  pid uuid;
  qty integer;
  saw_item boolean := false;
begin
  select branch_id, stock_deducted_at, stock_restored_at
  into order_row
  from public.orders
  where id = p_order_id
  for update;
  if not found then
    raise exception 'order_not_found' using errcode = 'P0002';
  end if;
  if order_row.stock_deducted_at is not null
    and order_row.stock_restored_at is null then
    return;
  end if;
  bid := order_row.branch_id;

  for item in
    select id, product_id, kit_id, quantity, kit_component_deductions
    from public.order_items
    where order_id = p_order_id
    order by id
  loop
    saw_item := true;
    if item.kit_id is not null and item.kit_component_deductions is not null then
      for component in
        select value from jsonb_array_elements(item.kit_component_deductions)
      loop
        pid := (component->>'product_id')::uuid;
        qty := greatest(
          0,
          coalesce((component->>'stock_deducted_local')::integer, 0)
            + coalesce((component->>'stock_deducted_warehouse')::integer, 0)
        );
        if pid is null or qty = 0 then continue; end if;
        update public.branch_inventory
        set quantity = quantity - qty
        where branch_id = bid and product_id = pid and quantity >= qty;
        if not found then
          raise exception 'insufficient_stock'
            using errcode = 'P0001', detail = pid::text;
        end if;
      end loop;
    elsif item.product_id is not null then
      qty := greatest(0, coalesce(item.quantity, 0));
      update public.branch_inventory
      set quantity = quantity - qty
      where branch_id = bid
        and product_id = item.product_id
        and quantity >= qty;
      if not found then
        raise exception 'insufficient_stock'
          using errcode = 'P0001', detail = item.product_id::text;
      end if;
      update public.order_items
      set stock_deducted_local = qty, stock_deducted_warehouse = 0
      where id = item.id;
    end if;
  end loop;
  if not saw_item then
    raise exception 'no_items' using errcode = 'P0002';
  end if;
  update public.orders
  set stock_deducted_at = now(), stock_restored_at = null
  where id = p_order_id;
end;
$$;

create or replace function public.restore_order_items_stock(p_order_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  order_row record;
  item record;
  component jsonb;
  pid uuid;
  qty integer;
begin
  select branch_id, stock_restored_at, status, wompi_reference
  into order_row
  from public.orders
  where id = p_order_id
  for update;
  if not found then
    raise exception 'order_not_found' using errcode = 'P0002';
  end if;
  if order_row.status <> 'cancelled'
    or not public.staff_can_access_branch(order_row.branch_id)
    or not exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          p.is_platform_operator
          or p.job_role in ('owner', 'admin')
          or coalesce((p.permissions->>'ventas_crear')::boolean, false)
        )
    ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if order_row.stock_restored_at is not null then return; end if;
  if order_row.status = 'quotation'
    or coalesce(order_row.wompi_reference, '') = 'POS:quotation' then
    update public.orders set stock_restored_at = now() where id = p_order_id;
    return;
  end if;

  for item in
    select product_id, kit_id, quantity, stock_deducted_local,
           stock_deducted_warehouse, kit_component_deductions
    from public.order_items
    where order_id = p_order_id
  loop
    if item.kit_id is not null and item.kit_component_deductions is not null then
      for component in
        select value from jsonb_array_elements(item.kit_component_deductions)
      loop
        pid := (component->>'product_id')::uuid;
        qty := greatest(
          0,
          coalesce((component->>'stock_deducted_local')::integer, 0)
            + coalesce((component->>'stock_deducted_warehouse')::integer, 0)
        );
        if pid is null or qty = 0 then continue; end if;
        update public.branch_inventory
        set quantity = quantity + qty
        where branch_id = order_row.branch_id and product_id = pid;
      end loop;
    elsif item.product_id is not null then
      qty := greatest(
        0,
        coalesce(item.stock_deducted_local, 0)
          + coalesce(item.stock_deducted_warehouse, 0)
      );
      if qty = 0 and coalesce(order_row.wompi_reference, '') like 'POS:%' then
        qty := greatest(0, coalesce(item.quantity, 0));
      end if;
      if qty > 0 then
        update public.branch_inventory
        set quantity = quantity + qty
        where branch_id = order_row.branch_id
          and product_id = item.product_id;
      end if;
    end if;
  end loop;

  update public.orders
  set stock_restored_at = now()
  where id = p_order_id and stock_restored_at is null;
end;
$$;

create or replace function public.cancel_order_and_restore_stock(
  p_order_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  order_branch uuid;
begin
  if length(btrim(coalesce(p_reason, ''))) < 8 then
    raise exception 'reason_required' using errcode = '22023';
  end if;
  select branch_id into order_branch
  from public.orders
  where id = p_order_id
  for update;
  if not found or not public.staff_can_access_branch(order_branch) then
    raise exception 'order_not_found' using errcode = 'P0002';
  end if;

  update public.orders
  set status = 'cancelled', cancellation_reason = btrim(p_reason)
  where id = p_order_id;
  perform public.restore_order_items_stock(p_order_id);
end;
$$;

create or replace function public.process_wompi_order_status(
  p_order_id uuid,
  p_status text,
  p_transaction_id text,
  p_reference text
)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_status text;
begin
  if p_status not in ('pending', 'paid', 'failed', 'cancelled') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;
  select status into current_status
  from public.orders
  where id = p_order_id
  for update;
  if not found then return 'missing'; end if;
  if current_status = 'paid' then return 'already_paid'; end if;

  if p_status = 'paid' then
    perform public.deduct_order_branch_inventory(p_order_id);
  end if;
  update public.orders
  set status = p_status::public.order_status,
      wompi_transaction_id = coalesce(p_transaction_id, wompi_transaction_id),
      wompi_reference = coalesce(p_reference, wompi_reference)
  where id = p_order_id;
  return 'updated';
end;
$$;

revoke all on function public.replace_profile_branch_memberships(uuid, uuid[]) from public;
revoke all on function public.update_branch_settings(uuid, text, text, boolean, boolean)
  from public;
revoke all on function public.current_branch_inventory(uuid[]) from public;
revoke all on function public.decrement_products_stock_local(jsonb) from public;
revoke all on function public.decrement_order_branch_inventory(uuid, jsonb) from public;
revoke all on function public.adjust_product_stock_add(uuid, text, integer) from public;
revoke all on function public.set_product_branch_stock(uuid, integer) from public;
revoke all on function public.transfer_product_stock_between_branches(uuid, uuid, uuid, integer)
  from public;
revoke all on function public.deduct_order_branch_inventory(uuid) from public;
revoke all on function public.cancel_order_and_restore_stock(uuid, text) from public;
revoke all on function public.process_wompi_order_status(uuid, text, text, text)
  from public;

grant execute on function public.current_branch_inventory(uuid[]) to authenticated;
grant execute on function public.decrement_products_stock_local(jsonb) to authenticated;
grant execute on function public.decrement_order_branch_inventory(uuid, jsonb)
  to authenticated;
grant execute on function public.adjust_product_stock_add(uuid, text, integer) to authenticated;
grant execute on function public.set_product_branch_stock(uuid, integer) to authenticated;
grant execute on function public.transfer_product_stock_between_branches(uuid, uuid, uuid, integer)
  to authenticated;
grant execute on function public.deduct_order_branch_inventory(uuid) to service_role;
revoke all on function public.restore_order_items_stock(uuid) from public, authenticated;
grant execute on function public.cancel_order_and_restore_stock(uuid, text) to authenticated;
grant execute on function public.process_wompi_order_status(uuid, text, text, text)
  to service_role;

-- These report functions must obey branch RLS.
alter function public.admin_report_monthly_pulse(date, integer) security invoker;
alter function public.admin_report_period_line_metrics(date, date) security invoker;
alter function public.admin_report_dashboard_agg(date, date, date, date, date, date) security invoker;

create or replace function public.admin_stock_investment_totals()
returns table (net_cents bigint, gross_cents bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce(sum(bi.quantity::bigint * coalesce(p.cost_cents, 0)::bigint), 0)::bigint,
    coalesce(
      sum(
        bi.quantity::bigint
          * coalesce(p.cost_gross_cents, p.cost_cents, 0)::bigint
      ),
      0
    )::bigint
  from public.branch_inventory bi
  join public.products p on p.id = bi.product_id
  where bi.branch_id = public.current_staff_branch_id();
$$;

comment on table public.branches is
  'Sucursales operativas de una cuenta/tenant. Catálogo y clientes siguen compartidos.';
comment on table public.branch_inventory is
  'Existencias de un producto compartido dentro de una sucursal.';
