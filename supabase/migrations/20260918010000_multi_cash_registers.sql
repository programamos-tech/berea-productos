-- Varias cajas abiertas a la vez, cada una asignada a una cajera.
-- El dueño/admin ve todos los puntos; venta solo el suyo.

create or replace function public.staff_manages_all_cash_registers()
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
      and p.job_role in ('owner', 'admin')
  );
$$;

revoke all on function public.staff_manages_all_cash_registers() from public;
grant execute on function public.staff_manages_all_cash_registers() to authenticated;

create table public.cash_registers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id),
  branch_id uuid not null references public.branches (id),
  name text not null,
  assigned_user_id uuid references public.profiles (id) on delete set null,
  sort_order integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index cash_registers_branch_name_uidx
  on public.cash_registers (branch_id, lower(btrim(name)))
  where is_active;

create unique index cash_registers_branch_assigned_uidx
  on public.cash_registers (branch_id, assigned_user_id)
  where assigned_user_id is not null and is_active;

create index cash_registers_branch_idx
  on public.cash_registers (branch_id, sort_order, created_at);

create index cash_registers_assigned_user_idx
  on public.cash_registers (assigned_user_id)
  where assigned_user_id is not null;

comment on table public.cash_registers is
  'Puntos de caja de la sucursal. Cada uno puede asignarse a una cajera.';

alter table public.cash_registers enable row level security;

create policy cash_registers_select_staff
on public.cash_registers for select to authenticated
using ((select public.is_staff()));

create policy cash_registers_manage_managers
on public.cash_registers for all to authenticated
using (
  (select public.is_platform_operator())
  or (select public.staff_manages_all_cash_registers())
)
with check (
  (select public.is_platform_operator())
  or (select public.staff_manages_all_cash_registers())
);

create policy cash_registers_staff_tenant_isolation
on public.cash_registers as restrictive for all to authenticated
using (
  not (select public.is_staff_user())
  or (select public.staff_owns_tenant(tenant_id))
)
with check (
  not (select public.is_staff_user())
  or (select public.staff_owns_tenant(tenant_id))
);

create policy cash_registers_staff_branch_isolation
on public.cash_registers as restrictive for all to authenticated
using (
  not (select public.is_staff_user())
  or branch_id = (select public.current_staff_branch_id())
)
with check (
  not (select public.is_staff_user())
  or branch_id = (select public.current_staff_branch_id())
);

create trigger cash_registers_set_tenant_id
before insert on public.cash_registers
for each row execute function public.tg_set_tenant_id_from_staff();

create trigger cash_registers_set_active_branch
before insert or update of branch_id, tenant_id on public.cash_registers
for each row execute function public.tg_set_active_branch();

insert into public.cash_registers (tenant_id, branch_id, name, sort_order, is_active)
select b.tenant_id, b.id, 'Caja 1', 1, true
from public.branches b
where not exists (
  select 1 from public.cash_registers r where r.branch_id = b.id
);

create or replace function public.tg_create_branch_default_cash_register()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.cash_registers (tenant_id, branch_id, name, sort_order, is_active)
  values (new.tenant_id, new.id, 'Caja 1', 1, true);
  return new;
end;
$$;

create trigger branches_default_cash_register
after insert on public.branches
for each row execute function public.tg_create_branch_default_cash_register();

alter table public.cash_register_sessions
  add column cash_register_id uuid references public.cash_registers (id);

update public.cash_register_sessions s
set cash_register_id = r.id
from public.cash_registers r
where s.cash_register_id is null
  and s.branch_id = r.branch_id
  and r.name = 'Caja 1';

alter table public.cash_register_sessions
  alter column cash_register_id set not null;

create index cash_register_sessions_register_idx
  on public.cash_register_sessions (cash_register_id, business_day desc);

drop index if exists public.cash_register_sessions_one_open_idx;
drop index if exists public.cash_register_sessions_day_unique_idx;

create unique index cash_register_sessions_one_open_per_register_idx
  on public.cash_register_sessions (cash_register_id)
  where status = 'open';

create unique index cash_register_sessions_one_open_per_user_idx
  on public.cash_register_sessions (branch_id, opened_by)
  where status = 'open';

create unique index cash_register_sessions_register_day_uidx
  on public.cash_register_sessions (cash_register_id, business_day);

drop policy if exists cash_register_sessions_own_or_manager on public.cash_register_sessions;
create policy cash_register_sessions_own_or_manager
on public.cash_register_sessions
as restrictive
for all
to authenticated
using (
  not (select public.is_staff_user())
  or (select public.is_platform_operator())
  or (select public.staff_manages_all_cash_registers())
  or opened_by = (select auth.uid())
  or cash_register_id in (
    select r.id
    from public.cash_registers r
    where r.assigned_user_id = (select auth.uid())
      and r.is_active
  )
)
with check (
  not (select public.is_staff_user())
  or (select public.is_platform_operator())
  or (select public.staff_manages_all_cash_registers())
  or opened_by = (select auth.uid())
  or cash_register_id in (
    select r.id
    from public.cash_registers r
    where r.assigned_user_id = (select auth.uid())
      and r.is_active
  )
);

alter table public.orders
  add column cash_register_session_id uuid references public.cash_register_sessions (id);

create index orders_cash_register_session_idx
  on public.orders (cash_register_session_id)
  where cash_register_session_id is not null;

alter table public.store_expenses
  add column cash_register_session_id uuid references public.cash_register_sessions (id);

create index store_expenses_cash_register_session_idx
  on public.store_expenses (cash_register_session_id)
  where cash_register_session_id is not null;

alter table public.order_payments
  add column cash_register_session_id uuid references public.cash_register_sessions (id);

create index order_payments_cash_register_session_idx
  on public.order_payments (cash_register_session_id)
  where cash_register_session_id is not null;

-- Histórico: había una sola caja por sucursal y día.
update public.orders o
set cash_register_session_id = s.id
from public.cash_register_sessions s
where o.cash_register_session_id is null
  and o.branch_id = s.branch_id
  and o.status = 'paid'
  and (timezone('America/Bogota', o.created_at))::date = s.business_day;

update public.store_expenses e
set cash_register_session_id = s.id
from public.cash_register_sessions s
where e.cash_register_session_id is null
  and e.branch_id = s.branch_id
  and e.expense_scope = 'diario'
  and e.expense_date = s.business_day;

update public.order_payments p
set cash_register_session_id = s.id
from public.cash_register_sessions s
where p.cash_register_session_id is null
  and p.branch_id = s.branch_id
  and (timezone('America/Bogota', p.paid_at))::date = s.business_day;
