-- Branch trigger names sort before the older tenant trigger names. Inserts that
-- omit both IDs (for example claim_admin_form_token and cash opening) therefore
-- need to derive tenant_id from the resolved active branch in one step.
create or replace function public.tg_set_active_branch()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_branch_id uuid;
  resolved_branch_tenant_id uuid;
begin
  if new.branch_id is null then
    resolved_branch_id := public.current_staff_branch_id();

    if resolved_branch_id is not null and new.tenant_id is not null then
      select b.tenant_id
      into resolved_branch_tenant_id
      from public.branches b
      where b.id = resolved_branch_id;

      if resolved_branch_tenant_id is distinct from new.tenant_id then
        resolved_branch_id := null;
      end if;
    end if;

    new.branch_id := coalesce(
      resolved_branch_id,
      public.default_branch_id(new.tenant_id)
    );
  end if;

  select b.tenant_id
  into resolved_branch_tenant_id
  from public.branches b
  where b.id = new.branch_id
    and b.is_active;

  if new.tenant_id is null then
    new.tenant_id := resolved_branch_tenant_id;
  end if;

  if new.branch_id is null or new.tenant_id is null then
    raise exception 'branch_required' using errcode = '23514';
  end if;

  if resolved_branch_tenant_id is null
    or resolved_branch_tenant_id <> new.tenant_id
  then
    raise exception 'branch_tenant_mismatch' using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function public.tg_set_active_branch() is
  'Completa branch_id y tenant_id de forma atómica y valida que pertenezcan a la misma cuenta.';

revoke all on function public.tg_set_active_branch() from public;
