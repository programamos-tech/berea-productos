alter table public.branches
  add column logo_path text;

comment on column public.branches.logo_path is
  'Ruta pública del logo propio de la sucursal en Supabase Storage.';

create or replace function public.admin_branch_sales_totals()
returns table (
  branch_id uuid,
  paid_orders bigint,
  total_sales_cents bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.id,
    count(o.id) filter (where o.status = 'paid')::bigint,
    coalesce(
      sum(greatest(0, o.total_cents)) filter (where o.status = 'paid'),
      0
    )::bigint
  from public.branches b
  left join public.orders o on o.branch_id = b.id
  where (select public.is_staff_user())
    and b.tenant_id = (select public.current_staff_tenant_id())
    and (select public.staff_can_access_branch(b.id))
  group by b.id;
$$;

revoke all on function public.admin_branch_sales_totals() from public;
grant execute on function public.admin_branch_sales_totals() to authenticated;
