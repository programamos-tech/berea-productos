-- Concepts are exactly one kind: gasto XOR egreso.

update public.store_expense_concepts
set
  applies_to_gasto = false,
  applies_to_egreso = true,
  updated_at = now()
where applies_to_gasto
  and applies_to_egreso
  and (
    category = 'impuestos'
    or special_key = 'supplier_payment'
    or lower(name) like '%cámara de comercio%'
    or lower(name) like '%camara de comercio%'
  );

update public.store_expense_concepts
set
  applies_to_gasto = true,
  applies_to_egreso = false,
  updated_at = now()
where applies_to_gasto
  and applies_to_egreso;

alter table public.store_expense_concepts
  drop constraint if exists store_expense_concepts_kind_target;

alter table public.store_expense_concepts
  drop constraint if exists store_expense_concepts_kind_xor;

alter table public.store_expense_concepts
  add constraint store_expense_concepts_kind_xor check (
    (applies_to_gasto and not applies_to_egreso)
    or (applies_to_egreso and not applies_to_gasto)
  );
