-- Equipo and public catalog must not leak across tenants / platform.

drop policy if exists tenants_select_public_active on public.tenants;
create policy tenants_select_public_active on public.tenants
  for select to anon
  using (status = 'active' and kind = 'customer');

drop policy if exists "profiles_select_access" on public.profiles;
create policy "profiles_select_access"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or tenant_id = (select public.current_staff_tenant_id())
);

drop policy if exists "profiles_update_team" on public.profiles;
create policy "profiles_update_team"
on public.profiles
for update
to authenticated
using (
  id = (select auth.uid())
  or tenant_id = (select public.current_staff_tenant_id())
)
with check (
  id = (select auth.uid())
  or tenant_id = (select public.current_staff_tenant_id())
);
