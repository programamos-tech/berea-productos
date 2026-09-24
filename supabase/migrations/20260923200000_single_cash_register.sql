-- Una sola caja abierta por sucursal y por día. Sin cajas por cajera.

update public.cash_registers
set assigned_user_id = null
where assigned_user_id is not null;

drop index if exists public.cash_registers_branch_assigned_uidx;
drop index if exists public.cash_register_sessions_one_open_per_register_idx;
drop index if exists public.cash_register_sessions_one_open_per_user_idx;
drop index if exists public.cash_register_sessions_register_day_uidx;

create unique index cash_register_sessions_one_open_idx
  on public.cash_register_sessions (branch_id)
  where status = 'open';

create unique index cash_register_sessions_day_unique_idx
  on public.cash_register_sessions (branch_id, business_day);

drop policy if exists cash_register_sessions_own_or_manager on public.cash_register_sessions;

create or replace function public.tg_cash_session_default_register()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.cash_register_id is null and new.branch_id is not null then
    select r.id
    into new.cash_register_id
    from public.cash_registers r
    where r.branch_id = new.branch_id
      and r.is_active
    order by r.sort_order, r.created_at
    limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists cash_register_sessions_z_default_register on public.cash_register_sessions;
create trigger cash_register_sessions_z_default_register
before insert on public.cash_register_sessions
for each row execute function public.tg_cash_session_default_register();
