-- Dynamic expense concepts (gasto / egreso catalogs) per tenant.

create table if not exists public.store_expense_concepts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id),
  name text not null,
  category text not null default 'operativo',
  default_payment_method text not null default 'transferencia',
  applies_to_gasto boolean not null default true,
  applies_to_egreso boolean not null default false,
  allows_custom_text boolean not null default false,
  special_key text null
    check (
      special_key is null
      or special_key in ('personal_turnos', 'supplier_payment', 'other_gasto', 'other_egreso')
    ),
  sort_order integer not null default 100,
  is_active boolean not null default true,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_expense_concepts_name_len check (
    char_length(trim(name)) between 2 and 120
  ),
  constraint store_expense_concepts_kind_target check (
    applies_to_gasto or applies_to_egreso
  )
);

create unique index if not exists store_expense_concepts_tenant_name_uidx
  on public.store_expense_concepts (tenant_id, lower(trim(name)));

create unique index if not exists store_expense_concepts_tenant_special_uidx
  on public.store_expense_concepts (tenant_id, special_key)
  where special_key is not null;

create index if not exists store_expense_concepts_tenant_active_idx
  on public.store_expense_concepts (tenant_id, is_active, sort_order, name);

drop trigger if exists store_expense_concepts_set_tenant on public.store_expense_concepts;
create trigger store_expense_concepts_set_tenant
  before insert on public.store_expense_concepts
  for each row
  execute function public.tg_set_tenant_id_from_staff();

drop trigger if exists store_expense_concepts_set_updated_at on public.store_expense_concepts;
create trigger store_expense_concepts_set_updated_at
  before update on public.store_expense_concepts
  for each row
  execute function public.set_updated_at();

alter table public.store_expense_concepts enable row level security;

drop policy if exists "store_expense_concepts_select_staff" on public.store_expense_concepts;
create policy "store_expense_concepts_select_staff"
  on public.store_expense_concepts
  for select
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid()));

drop policy if exists "store_expense_concepts_insert_staff" on public.store_expense_concepts;
create policy "store_expense_concepts_insert_staff"
  on public.store_expense_concepts
  for insert
  to authenticated
  with check (exists (select 1 from public.profiles p where p.id = auth.uid()));

drop policy if exists "store_expense_concepts_update_staff" on public.store_expense_concepts;
create policy "store_expense_concepts_update_staff"
  on public.store_expense_concepts
  for update
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid()))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid()));

drop policy if exists "store_expense_concepts_delete_staff" on public.store_expense_concepts;
create policy "store_expense_concepts_delete_staff"
  on public.store_expense_concepts
  for delete
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid()));

drop policy if exists store_expense_concepts_staff_tenant_isolation on public.store_expense_concepts;
create policy store_expense_concepts_staff_tenant_isolation
  on public.store_expense_concepts
  as restrictive
  for all
  to authenticated
  using (
    not public.is_staff_user()
    or public.staff_owns_tenant(tenant_id)
  )
  with check (
    not public.is_staff_user()
    or public.staff_owns_tenant(tenant_id)
  );

-- Seed Aleya (and any existing tenants) from the previous hardcoded catalogs.
do $$
declare
  t uuid;
begin
  for t in select id from public.tenants loop
    if exists (
      select 1 from public.store_expense_concepts c where c.tenant_id = t limit 1
    ) then
      continue;
    end if;

    insert into public.store_expense_concepts (
      tenant_id, name, category, default_payment_method,
      applies_to_gasto, applies_to_egreso, allows_custom_text,
      special_key, sort_order, is_active, is_system
    ) values
      (t, 'Sueldo/Nómina', 'nomina', 'transferencia', true, false, false, null, 10, true, false),
      (t, 'Administración', 'administracion', 'transferencia', true, false, false, null, 20, true, false),
      (t, 'Arriendo', 'fijo', 'transferencia', true, false, false, null, 30, true, false),
      (t, 'Servicio público', 'servicios', 'transferencia', true, false, false, null, 40, true, false),
      (t, 'Línea corporativa', 'servicios', 'transferencia', true, false, false, null, 50, true, false),
      (t, 'Personal Turnos', 'nomina', 'efectivo', true, false, false, 'personal_turnos', 60, true, true),
      (t, 'Seguridad social', 'nomina', 'transferencia', true, false, false, null, 70, true, false),
      (t, 'Domicilios propios', 'logistica', 'efectivo', true, false, false, null, 80, true, false),
      (t, 'Flete', 'logistica', 'transferencia', true, false, false, null, 90, true, false),
      (t, 'Material/insumos y papelería', 'insumos', 'transferencia', true, false, false, null, 100, true, false),
      (t, 'Datafono y 4xMIL', 'financiero', 'transferencia', true, false, false, null, 110, true, false),
      (t, 'Honorarios contabilidad', 'honorarios', 'transferencia', true, false, false, null, 120, true, false),
      (t, 'Viáticos/gastos representación', 'representacion', 'transferencia', true, false, false, null, 130, true, false),
      (t, 'Publicidad', 'marketing', 'tarjeta', true, false, false, null, 140, true, false),
      (t, 'Soporte web Contapyme', 'tecnologia', 'transferencia', true, false, false, null, 150, true, false),
      (t, 'Arreglos locativos', 'mantenimiento', 'transferencia', true, false, false, null, 160, true, false),
      (t, 'Intereses x préstamos', 'financiero', 'transferencia', true, false, false, null, 170, true, false),
      (t, 'Pago a préstamo', 'financiero', 'transferencia', true, false, false, null, 180, true, false),
      (t, 'Prestaciones sociales', 'nomina', 'transferencia', true, false, false, null, 190, true, false),
      (t, 'Renovación Sigo nómina', 'nomina', 'transferencia', true, false, false, null, 200, true, false),
      (t, 'Cámara de comercio', 'impuestos', 'transferencia', true, true, false, null, 210, true, false),
      (t, 'Pago por transacción Milagros', 'financiero', 'transferencia', true, false, false, null, 220, true, false),
      (t, 'Bolsas Milagros', 'insumos', 'efectivo', true, false, false, null, 230, true, false),
      (t, 'Pago a proveedor', 'insumos', 'transferencia', true, true, false, 'supplier_payment', 240, true, true),
      (t, 'Seguro local y mercancía protegida', 'seguros', 'transferencia', true, false, false, null, 250, true, false),
      (t, 'Otro', 'operativo', 'transferencia', true, false, true, 'other_gasto', 900, true, true),
      (t, 'Impuesto de renta', 'impuestos', 'transferencia', false, true, false, null, 1010, true, false),
      (t, 'IVA', 'impuestos', 'transferencia', false, true, false, null, 1020, true, false),
      (t, 'Retención en la fuente', 'impuestos', 'transferencia', false, true, false, null, 1030, true, false),
      (t, 'Autorretención de renta', 'impuestos', 'transferencia', false, true, false, null, 1040, true, false),
      (t, 'ICA (industria y comercio)', 'impuestos', 'transferencia', false, true, false, null, 1050, true, false),
      (t, 'GMF 4x1000', 'impuestos', 'transferencia', false, true, false, null, 1060, true, false),
      (t, 'Impuesto al patrimonio', 'impuestos', 'transferencia', false, true, false, null, 1070, true, false),
      (t, 'Predial', 'impuestos', 'transferencia', false, true, false, null, 1080, true, false),
      (t, 'Régimen Simple de Tributación', 'impuestos', 'transferencia', false, true, false, null, 1090, true, false),
      (t, 'Otro impuesto', 'impuestos', 'transferencia', false, true, true, 'other_egreso', 1900, true, true);
  end loop;
end $$;

comment on table public.store_expense_concepts is
  'Catálogo editable de conceptos de gasto/egreso por tenant.';
