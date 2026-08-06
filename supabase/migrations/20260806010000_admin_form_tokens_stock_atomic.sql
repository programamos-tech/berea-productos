-- Idempotencia de formularios admin (stock, transferencias, POS) + ajuste atómico de stock.

create table if not exists public.admin_form_tokens (
  token text primary key
    check (char_length(token) >= 16 and char_length(token) <= 80),
  action_key text not null,
  actor_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists admin_form_tokens_created_at_idx
  on public.admin_form_tokens (created_at);

alter table public.admin_form_tokens enable row level security;

-- Solo vía funciones SECURITY INVOKER con chequeo de admin; sin políticas = denegado a clientes.
revoke all on table public.admin_form_tokens from anon, authenticated;
grant select, insert on table public.admin_form_tokens to authenticated;

comment on table public.admin_form_tokens is
  'Tokens de un solo uso para evitar doble submit en acciones admin (stock, ventas POS, etc.).';

create or replace function public.claim_admin_form_token(p_token text, p_action_key text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  t text := nullif(btrim(coalesce(p_token, '')), '');
  k text := nullif(btrim(coalesce(p_action_key, '')), '');
begin
  if not public.user_has_admin_profile() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if t is null or char_length(t) < 16 or char_length(t) > 80 then
    raise exception 'invalid_token' using errcode = '22023';
  end if;

  if k is null then
    raise exception 'invalid_action' using errcode = '22023';
  end if;

  begin
    insert into public.admin_form_tokens (token, action_key, actor_id)
    values (t, k, auth.uid());
    return true;
  exception
    when unique_violation then
      return false;
  end;
end;
$$;

comment on function public.claim_admin_form_token(text, text) is
  'Inserta token de formulario; true = primera vez (proceder), false = ya usado (no repetir mutación).';

grant execute on function public.claim_admin_form_token(text, text) to authenticated;

-- Entrada (sumar) atómica: stock_x = stock_x + qty en una sola sentencia.
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
  loc text := lower(btrim(coalesce(p_location, 'local')));
  q int := greatest(0, coalesce(p_qty, 0));
  cur_local int;
  cur_wh int;
begin
  if not public.user_has_admin_profile() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_product_id is null then
    raise exception 'invalid_product' using errcode = '22023';
  end if;

  if loc not in ('local', 'warehouse') then
    raise exception 'invalid_location' using errcode = '22023';
  end if;

  if q <= 0 then
    raise exception 'invalid_quantity' using errcode = '22023';
  end if;

  select p.stock_local, p.stock_warehouse
    into cur_local, cur_wh
  from public.products p
  where p.id = p_product_id
  for update;

  if not found then
    raise exception 'product_not_found' using errcode = 'P0002';
  end if;

  cur_local := greatest(0, coalesce(cur_local, 0));
  cur_wh := greatest(0, coalesce(cur_wh, 0));

  if loc = 'warehouse' then
    update public.products
    set stock_warehouse = cur_wh + q
    where id = p_product_id;
    return query select cur_local, cur_wh, cur_local, cur_wh + q;
  else
    update public.products
    set stock_local = cur_local + q
    where id = p_product_id;
    return query select cur_local, cur_wh, cur_local + q, cur_wh;
  end if;
end;
$$;

comment on function public.adjust_product_stock_add(uuid, text, integer) is
  'Suma stock en local o bodega de forma atómica (FOR UPDATE). Solo admin.';

grant execute on function public.adjust_product_stock_add(uuid, text, integer) to authenticated;

-- Transferencia atómica entre local y bodega.
create or replace function public.transfer_product_stock_qty(
  p_product_id uuid,
  p_direction text,
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
  dir text := lower(btrim(coalesce(p_direction, '')));
  q int := greatest(0, coalesce(p_qty, 0));
  cur_local int;
  cur_wh int;
begin
  if not public.user_has_admin_profile() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_product_id is null then
    raise exception 'invalid_product' using errcode = '22023';
  end if;

  if dir not in ('local_to_warehouse', 'warehouse_to_local') then
    raise exception 'invalid_direction' using errcode = '22023';
  end if;

  if q <= 0 then
    raise exception 'invalid_quantity' using errcode = '22023';
  end if;

  select p.stock_local, p.stock_warehouse
    into cur_local, cur_wh
  from public.products p
  where p.id = p_product_id
  for update;

  if not found then
    raise exception 'product_not_found' using errcode = 'P0002';
  end if;

  cur_local := greatest(0, coalesce(cur_local, 0));
  cur_wh := greatest(0, coalesce(cur_wh, 0));

  if dir = 'local_to_warehouse' then
    if cur_local < q then
      raise exception 'insufficient_stock' using errcode = 'P0001';
    end if;
    update public.products
    set stock_local = cur_local - q,
        stock_warehouse = cur_wh + q
    where id = p_product_id;
    return query select cur_local, cur_wh, cur_local - q, cur_wh + q;
  else
    if cur_wh < q then
      raise exception 'insufficient_stock' using errcode = 'P0001';
    end if;
    update public.products
    set stock_warehouse = cur_wh - q,
        stock_local = cur_local + q
    where id = p_product_id;
    return query select cur_local, cur_wh, cur_local + q, cur_wh - q;
  end if;
end;
$$;

comment on function public.transfer_product_stock_qty(uuid, text, integer) is
  'Mueve stock local↔bodega de forma atómica. Solo admin.';

grant execute on function public.transfer_product_stock_qty(uuid, text, integer) to authenticated;
