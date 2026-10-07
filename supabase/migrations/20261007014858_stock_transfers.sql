-- Traslados entre sucursales: al enviar baja el origen; al recibir suma el destino.

create table public.stock_transfers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  from_branch_id uuid not null references public.branches (id),
  to_branch_id uuid not null references public.branches (id),
  from_branch_name text not null,
  to_branch_name text not null,
  status text not null default 'in_transit'
    check (status in ('in_transit', 'received', 'cancelled')),
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  sent_at timestamptz not null default now(),
  received_by uuid references public.profiles (id) on delete set null,
  received_at timestamptz,
  cancelled_by uuid references public.profiles (id) on delete set null,
  cancelled_at timestamptz,
  constraint stock_transfers_distinct_branches check (from_branch_id <> to_branch_id)
);

create index stock_transfers_tenant_sent_idx
  on public.stock_transfers (tenant_id, sent_at desc);
create index stock_transfers_from_sent_idx
  on public.stock_transfers (from_branch_id, sent_at desc);
create index stock_transfers_to_sent_idx
  on public.stock_transfers (to_branch_id, sent_at desc);

create table public.stock_transfer_items (
  id uuid primary key default gen_random_uuid(),
  transfer_id uuid not null references public.stock_transfers (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  product_id uuid not null references public.products (id),
  quantity integer not null check (quantity > 0 and quantity <= 100000),
  unique (transfer_id, product_id)
);

create index stock_transfer_items_transfer_idx
  on public.stock_transfer_items (transfer_id);

alter table public.stock_transfers enable row level security;
alter table public.stock_transfer_items enable row level security;

create policy stock_transfers_select_staff
on public.stock_transfers
for select
to authenticated
using (
  tenant_id = (select public.current_staff_tenant_id())
  and (
    from_branch_id = any ((select public.staff_accessible_branch_ids())::uuid[])
    or to_branch_id = any ((select public.staff_accessible_branch_ids())::uuid[])
  )
);

create policy stock_transfer_items_select_staff
on public.stock_transfer_items
for select
to authenticated
using (
  exists (
    select 1
    from public.stock_transfers t
    where t.id = transfer_id
      and t.tenant_id = (select public.current_staff_tenant_id())
      and (
        t.from_branch_id = any ((select public.staff_accessible_branch_ids())::uuid[])
        or t.to_branch_id = any ((select public.staff_accessible_branch_ids())::uuid[])
      )
  )
);

grant select on public.stock_transfers to authenticated, service_role;
grant select on public.stock_transfer_items to authenticated, service_role;

create or replace function public.send_stock_transfer(
  p_from_branch_id uuid,
  p_to_branch_id uuid,
  p_items jsonb,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid := public.current_staff_tenant_id();
  v_uid uuid := auth.uid();
  v_id uuid := gen_random_uuid();
  v_from_name text;
  v_to_name text;
  v_item record;
  v_have integer;
  v_name text;
  v_seen uuid[] := '{}';
  v_count integer := 0;
begin
  if v_uid is null or v_tenant is null then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if p_from_branch_id is null
    or p_to_branch_id is null
    or p_from_branch_id = p_to_branch_id
    or not public.staff_can_access_branch(p_from_branch_id)
    or not public.staff_can_access_branch(p_to_branch_id)
    or p_items is null
    or jsonb_typeof(p_items) <> 'array' then
    raise exception 'invalid_transfer' using errcode = '22023';
  end if;

  select name into v_from_name
  from public.branches
  where id = p_from_branch_id and tenant_id = v_tenant and is_active;
  select name into v_to_name
  from public.branches
  where id = p_to_branch_id and tenant_id = v_tenant and is_active;
  if v_from_name is null or v_to_name is null then
    raise exception 'invalid_transfer' using errcode = '22023';
  end if;

  insert into public.stock_transfers (
    id, tenant_id, from_branch_id, to_branch_id,
    from_branch_name, to_branch_name, status, notes, created_by, sent_at
  ) values (
    v_id, v_tenant, p_from_branch_id, p_to_branch_id,
    v_from_name, v_to_name, 'in_transit',
    nullif(left(btrim(coalesce(p_notes, '')), 500), ''),
    v_uid, now()
  );

  for v_item in
    select
      (value->>'product_id')::uuid as product_id,
      floor(coalesce((value->>'quantity')::numeric, 0))::integer as quantity
    from jsonb_array_elements(p_items)
    order by 1
  loop
    v_count := v_count + 1;
    if v_count > 40
      or v_item.product_id is null
      or v_item.quantity < 1
      or v_item.quantity > 100000
      or v_item.product_id = any (v_seen) then
      raise exception 'invalid_transfer' using errcode = '22023';
    end if;
    v_seen := v_seen || v_item.product_id;

    select name into v_name
    from public.products
    where id = v_item.product_id and tenant_id = v_tenant;
    if not found then
      raise exception 'product_not_found' using errcode = 'P0002';
    end if;

    insert into public.branch_inventory (tenant_id, branch_id, product_id, quantity)
    values (v_tenant, p_from_branch_id, v_item.product_id, 0)
    on conflict (branch_id, product_id) do nothing;

    select quantity into v_have
    from public.branch_inventory
    where branch_id = p_from_branch_id and product_id = v_item.product_id
    for update;
    if coalesce(v_have, 0) < v_item.quantity then
      raise exception 'insufficient_stock:%', v_name using errcode = 'P0001';
    end if;

    update public.branch_inventory
    set quantity = v_have - v_item.quantity
    where branch_id = p_from_branch_id and product_id = v_item.product_id;

    insert into public.branch_inventory (tenant_id, branch_id, product_id, quantity)
    values (v_tenant, p_to_branch_id, v_item.product_id, 0)
    on conflict (branch_id, product_id) do nothing;

    insert into public.stock_transfer_items (transfer_id, tenant_id, product_id, quantity)
    values (v_id, v_tenant, v_item.product_id, v_item.quantity);
  end loop;

  if v_count < 1 then
    raise exception 'invalid_transfer' using errcode = '22023';
  end if;

  return v_id;
end;
$$;

create or replace function public.receive_stock_transfer(p_transfer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid := public.current_staff_tenant_id();
  v_uid uuid := auth.uid();
  v_row public.stock_transfers%rowtype;
  v_item record;
  v_have integer;
begin
  if v_uid is null or v_tenant is null or p_transfer_id is null then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  select * into v_row
  from public.stock_transfers
  where id = p_transfer_id and tenant_id = v_tenant
  for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if v_row.status <> 'in_transit' then
    raise exception 'already_closed' using errcode = 'P0004';
  end if;
  if not public.staff_can_access_branch(v_row.to_branch_id) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  for v_item in
    select product_id, quantity
    from public.stock_transfer_items
    where transfer_id = v_row.id
    order by product_id
  loop
    insert into public.branch_inventory (tenant_id, branch_id, product_id, quantity)
    values (v_tenant, v_row.to_branch_id, v_item.product_id, 0)
    on conflict (branch_id, product_id) do nothing;

    select quantity into v_have
    from public.branch_inventory
    where branch_id = v_row.to_branch_id and product_id = v_item.product_id
    for update;

    update public.branch_inventory
    set quantity = coalesce(v_have, 0) + v_item.quantity
    where branch_id = v_row.to_branch_id and product_id = v_item.product_id;
  end loop;

  update public.stock_transfers
  set status = 'received', received_by = v_uid, received_at = now()
  where id = v_row.id;
end;
$$;

create or replace function public.cancel_stock_transfer(p_transfer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid := public.current_staff_tenant_id();
  v_uid uuid := auth.uid();
  v_row public.stock_transfers%rowtype;
  v_item record;
  v_have integer;
begin
  if v_uid is null or v_tenant is null or p_transfer_id is null then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  select * into v_row
  from public.stock_transfers
  where id = p_transfer_id and tenant_id = v_tenant
  for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if v_row.status <> 'in_transit' then
    raise exception 'already_closed' using errcode = 'P0004';
  end if;
  if not public.staff_can_access_branch(v_row.from_branch_id)
    and not public.staff_can_access_branch(v_row.to_branch_id) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  for v_item in
    select product_id, quantity
    from public.stock_transfer_items
    where transfer_id = v_row.id
    order by product_id
  loop
    insert into public.branch_inventory (tenant_id, branch_id, product_id, quantity)
    values (v_tenant, v_row.from_branch_id, v_item.product_id, 0)
    on conflict (branch_id, product_id) do nothing;

    select quantity into v_have
    from public.branch_inventory
    where branch_id = v_row.from_branch_id and product_id = v_item.product_id
    for update;

    update public.branch_inventory
    set quantity = coalesce(v_have, 0) + v_item.quantity
    where branch_id = v_row.from_branch_id and product_id = v_item.product_id;
  end loop;

  update public.stock_transfers
  set status = 'cancelled', cancelled_by = v_uid, cancelled_at = now()
  where id = v_row.id;
end;
$$;

revoke all on function public.send_stock_transfer(uuid, uuid, jsonb, text) from public;
revoke all on function public.receive_stock_transfer(uuid) from public;
revoke all on function public.cancel_stock_transfer(uuid) from public;
grant execute on function public.send_stock_transfer(uuid, uuid, jsonb, text) to authenticated, service_role;
grant execute on function public.receive_stock_transfer(uuid) to authenticated, service_role;
grant execute on function public.cancel_stock_transfer(uuid) to authenticated, service_role;
