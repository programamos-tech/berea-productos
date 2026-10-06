-- Color propio de la tienda de una sucursal (Bodega). Null usa el color del catálogo.

alter table public.branches
  add column if not exists storefront_color text;

alter table public.branches
  drop constraint if exists branches_storefront_color_hex;

alter table public.branches
  add constraint branches_storefront_color_hex
  check (
    storefront_color is null
    or storefront_color ~ '^#[0-9A-Fa-f]{6}$'
  );
