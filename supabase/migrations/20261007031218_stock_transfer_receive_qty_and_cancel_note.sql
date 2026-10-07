-- Recibir pide las unidades que llegaron. Anular exige una nota.
-- Lo que no llega vuelve al origen para que el stock no quede en el aire.

alter table public.stock_transfer_items
  add column if not exists received_quantity integer;

alter table public.stock_transfer_items
  drop constraint if exists stock_transfer_items_received_quantity_check;

alter table public.stock_transfer_items
  add constraint stock_transfer_items_received_quantity_check
  check (
    received_quantity is null
    or (received_quantity >= 0 and received_quantity <= quantity)
  );

alter table public.stock_transfers
  add column if not exists cancel_notes text;

drop function if exists public.receive_stock_transfer(uuid);
drop function if exists public.cancel_stock_transfer(uuid);

create or replace function public.receive_stock_transfer(
  p_transfer_id uuid,
  p_items jsonb
)
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
  v_got integer;
  v_have integer;
  v_payload integer;
  v_distinct integer;
  v_lines integer;
  v_received_total integer := 0;
begin
  if v_uid is null or v_tenant is null or p_transfer_id is null then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'invalid_transfer' using errcode = '22023';
  end if;

  select
    count(*) filter (
      where (value->>'product_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and coalesce(value->>'quantity', '') ~ '^[0-9]+$'
    ),
    count(distinct value->>'product_id') filter (
      where (value->>'product_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and coalesce(value->>'quantity', '') ~ '^[0-9]+$'
    ),
    count(*)
  into v_payload, v_distinct, v_lines
  from jsonb_array_elements(p_items);

  if v_lines < 1 or v_payload <> v_lines or v_distinct <> v_lines then
    raise exception 'invalid_transfer' using errcode = '22023';
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

  select count(*) into v_lines
  from public.stock_transfer_items
  where transfer_id = v_row.id;
  if v_lines < 1 or v_lines <> v_payload then
    raise exception 'invalid_transfer' using errcode = '22023';
  end if;

  for v_item in
    select product_id, quantity
    from public.stock_transfer_items
    where transfer_id = v_row.id
    order by product_id
  loop
    select (value->>'quantity')::integer into v_got
    from jsonb_array_elements(p_items)
    where value->>'product_id' = v_item.product_id::text;

    if v_got is null or v_got < 0 or v_got > v_item.quantity then
      raise exception 'invalid_transfer' using errcode = '22023';
    end if;
    v_received_total := v_received_total + v_got;
  end loop;

  if v_received_total < 1 then
    raise exception 'nothing_received' using errcode = '22023';
  end if;

  for v_item in
    select product_id, quantity
    from public.stock_transfer_items
    where transfer_id = v_row.id
    order by product_id
    for update
  loop
    select (value->>'quantity')::integer into v_got
    from jsonb_array_elements(p_items)
    where value->>'product_id' = v_item.product_id::text;

    insert into public.branch_inventory (tenant_id, branch_id, product_id, quantity)
    values (v_tenant, v_row.to_branch_id, v_item.product_id, 0)
    on conflict (branch_id, product_id) do nothing;

    select quantity into v_have
    from public.branch_inventory
    where branch_id = v_row.to_branch_id and product_id = v_item.product_id
    for update;

    update public.branch_inventory
    set quantity = coalesce(v_have, 0) + v_got
    where branch_id = v_row.to_branch_id and product_id = v_item.product_id;

    if v_item.quantity > v_got then
      insert into public.branch_inventory (tenant_id, branch_id, product_id, quantity)
      values (v_tenant, v_row.from_branch_id, v_item.product_id, 0)
      on conflict (branch_id, product_id) do nothing;

      select quantity into v_have
      from public.branch_inventory
      where branch_id = v_row.from_branch_id and product_id = v_item.product_id
      for update;

      update public.branch_inventory
      set quantity = coalesce(v_have, 0) + (v_item.quantity - v_got)
      where branch_id = v_row.from_branch_id and product_id = v_item.product_id;
    end if;

    update public.stock_transfer_items
    set received_quantity = v_got
    where transfer_id = v_row.id and product_id = v_item.product_id;
  end loop;

  update public.stock_transfers
  set status = 'received', received_by = v_uid, received_at = now()
  where id = v_row.id;
end;
$$;

create or replace function public.cancel_stock_transfer(
  p_transfer_id uuid,
  p_notes text
)
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
  v_notes text := nullif(left(btrim(coalesce(p_notes, '')), 500), '');
begin
  if v_uid is null or v_tenant is null or p_transfer_id is null then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if v_notes is null then
    raise exception 'note_required' using errcode = '22023';
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
  set status = 'cancelled',
      cancelled_by = v_uid,
      cancelled_at = now(),
      cancel_notes = v_notes
  where id = v_row.id;
end;
$$;

revoke all on function public.receive_stock_transfer(uuid, jsonb) from public;
revoke all on function public.cancel_stock_transfer(uuid, text) from public;
grant execute on function public.receive_stock_transfer(uuid, jsonb) to authenticated, service_role;
grant execute on function public.cancel_stock_transfer(uuid, text) to authenticated, service_role;
