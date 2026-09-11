-- Roles laborales: Propietario, Administrador, Venta, Inventario.
-- cashier → sales, support → inventory. owner se mantiene.

alter table public.profiles drop constraint if exists profiles_job_role_check;

update public.profiles
set job_role = 'sales'
where job_role = 'cashier';

update public.profiles
set job_role = 'inventory'
where job_role = 'support';

alter table public.profiles
  add constraint profiles_job_role_check
  check (job_role in ('owner', 'admin', 'sales', 'inventory'));
