-- Scope security-definer storefront coupon RPCs to a tenant.
-- Drop zero-arg overload so callers use the slug-scoped function (default → aleya).

drop function if exists public.storefront_coupon_discounts();

create or replace function public.storefront_coupon_discounts(
  p_tenant_slug text default null
)
returns table (product_id uuid, discount_percent integer)
language sql
stable
security definer
set search_path to public
as $$
  select
    l.product_id,
    max(c.discount_percent)::integer as discount_percent
  from store_coupon_products l
  inner join store_coupons c on c.id = l.coupon_id
  where c.tenant_id = coalesce(
      (
        select t.id
        from public.tenants t
        where t.slug = nullif(btrim(coalesce(p_tenant_slug, '')), '')
          and t.status = 'active'
        limit 1
      ),
      public.aleya_tenant_id()
    )
    and l.tenant_id = c.tenant_id
    and c.is_enabled
    and (c.starts_at is null or c.starts_at <= now())
    and (c.ends_at is null or c.ends_at >= now())
    and c.discount_percent > 0
  group by l.product_id;
$$;

create or replace function public.storefront_coupon_discount_for_product(
  p_product_id uuid
)
returns integer
language sql
stable
security definer
set search_path to public
as $$
  select coalesce(max(c.discount_percent), 0)::integer
  from store_coupon_products l
  inner join store_coupons c on c.id = l.coupon_id
  inner join products p on p.id = l.product_id
  where l.product_id = p_product_id
    and c.tenant_id = p.tenant_id
    and l.tenant_id = c.tenant_id
    and c.is_enabled
    and (c.starts_at is null or c.starts_at <= now())
    and (c.ends_at is null or c.ends_at >= now())
    and c.discount_percent > 0;
$$;

revoke all on function public.storefront_coupon_discounts(text) from public;
grant execute on function public.storefront_coupon_discounts(text) to anon, authenticated, service_role;
revoke all on function public.storefront_coupon_discount_for_product(uuid) from public;
grant execute on function public.storefront_coupon_discount_for_product(uuid) to anon, authenticated, service_role;
