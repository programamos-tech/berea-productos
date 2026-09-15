-- Platform operator (Berea): a hidden platform tenant + acting-tenant header
-- so soporte can enter a customer account without appearing on their Equipo.

alter table public.tenants
  add column if not exists kind text not null default 'customer';

alter table public.tenants drop constraint if exists tenants_kind_check;
alter table public.tenants
  add constraint tenants_kind_check
  check (kind in ('customer', 'platform'));

alter table public.tenants
  add column if not exists account_holder_name text;

alter table public.tenants
  add column if not exists account_holder_email text;

update public.tenants
set kind = 'customer'
where kind is null or btrim(kind) = '';

insert into public.tenants (slug, name, status, kind, brand)
values (
  'berea',
  'Berea Productos',
  'active',
  'platform',
  jsonb_build_object('trade_name', 'Berea Productos', 'legal_name', 'Berea House')
)
on conflict (slug) do update
set kind = 'platform',
    name = excluded.name;

update public.tenants
set
  account_holder_name = 'Martha',
  account_holder_email = 'martha@aleyashop.com'
where slug = 'aleya'
  and (account_holder_name is null or btrim(account_holder_name) = '');

update public.tenants
set
  account_holder_name = 'Isaac Hernández',
  account_holder_email = 'isaachernandezmendoza3@gmail.com'
where slug = 'estacion-iphone'
  and (account_holder_name is null or btrim(account_holder_name) = '');

alter table public.profiles
  add column if not exists is_platform_operator boolean not null default false;

create or replace function public.request_acting_tenant_id()
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
      raw := nullif(btrim(headers_json->>'x-berea-acting-tenant-id'), '');
    end if;
  exception when others then
    raw := null;
  end;

  if raw is null then
    begin
      raw := nullif(
        btrim(current_setting('request.header.x-berea-acting-tenant-id', true)),
        ''
      );
    exception when others then
      raw := null;
    end;
  end if;

  if raw is null or raw !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return null;
  end if;
  return raw::uuid;
end;
$$;

create or replace function public.is_platform_operator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.is_platform_operator = true
  );
$$;

create or replace function public.current_staff_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.is_platform_operator() then
      coalesce(
        (
          select t.id
          from public.tenants t
          where t.id = public.request_acting_tenant_id()
            and t.kind = 'customer'
            and t.status in ('active', 'trial')
          limit 1
        ),
        (
          select p.tenant_id
          from public.profiles p
          where p.id = (select auth.uid())
          limit 1
        )
      )
    else
      (
        select p.tenant_id
        from public.profiles p
        where p.id = (select auth.uid())
        limit 1
      )
  end;
$$;

create or replace function public.staff_owns_tenant(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_tenant_id is not null
    and p_tenant_id = public.current_staff_tenant_id();
$$;

revoke all on function public.request_acting_tenant_id() from public;
revoke all on function public.is_platform_operator() from public;
grant execute on function public.request_acting_tenant_id() to anon, authenticated, service_role;
grant execute on function public.is_platform_operator() to authenticated, service_role;
grant execute on function public.current_staff_tenant_id() to authenticated, service_role;
grant execute on function public.staff_owns_tenant(uuid) to authenticated, service_role;
