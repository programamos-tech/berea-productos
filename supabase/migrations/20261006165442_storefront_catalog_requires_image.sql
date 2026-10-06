-- La tienda solo lista productos publicados que tienen foto.

create or replace function public.store_catalog_browse_preview(p_per_category int default 12)
returns table (
  category_id uuid,
  id uuid,
  name text,
  brand text,
  description text,
  price_cents integer,
  has_vat boolean,
  image_path text,
  stock_quantity integer,
  size_options jsonb,
  size_value numeric,
  size_unit text,
  fragrance_options text[],
  colors text[],
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    ranked.category_id,
    ranked.id,
    ranked.name,
    ranked.brand,
    ranked.description,
    ranked.price_cents,
    ranked.has_vat,
    ranked.image_path,
    ranked.stock_quantity,
    ranked.size_options,
    ranked.size_value,
    ranked.size_unit,
    ranked.fragrance_options,
    ranked.colors,
    ranked.created_at
  from (
    select
      p.category_id,
      p.id,
      p.name,
      p.brand,
      p.description,
      p.price_cents,
      p.has_vat,
      p.image_path,
      p.stock_quantity,
      p.size_options,
      p.size_value,
      p.size_unit,
      p.fragrance_options,
      p.colors,
      p.created_at,
      row_number() over (
        partition by p.category_id
        order by p.created_at desc nulls last
      ) as rn
    from products p
    where p.is_published = true
      and p.image_path is not null
      and btrim(p.image_path) <> ''
  ) ranked
  where ranked.rn <= greatest(1, coalesce(p_per_category, 12));
$$;

create or replace function public.store_published_product_counts_by_category()
returns table (category_id uuid, product_count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select p.category_id, count(*)::bigint as product_count
  from products p
  where p.is_published = true
    and p.category_id is not null
    and p.image_path is not null
    and btrim(p.image_path) <> ''
  group by p.category_id;
$$;
