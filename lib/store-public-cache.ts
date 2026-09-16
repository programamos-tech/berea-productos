import type { SupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { fetchCatalogBrowseSections } from "@/lib/catalog-browse-rows";
import { fetchStoreCategoriesWithCounts } from "@/lib/fetch-store-categories";
import { fetchKitsWithItems } from "@/lib/load-product-kits";
import { fetchListingFacets } from "@/lib/product-listing-facets";
import {
  kitIsAvailable,
  maxKitsAvailableFromItems,
  resolveKitSalePriceCents,
} from "@/lib/product-kits";
import { fetchPublishedBanners } from "@/lib/store-banners";
import { fetchBannerStoreCoupon, fetchStorefrontCouponDiscountPercentByProductId } from "@/lib/store-coupons";
import { fetchActiveWelcomeModal } from "@/lib/store-welcome-modal";
import {
  createStorefrontAnonClient,
  getStorefrontTenant,
} from "@/lib/storefront-tenant";
import { withStorefrontImage } from "@/lib/storefront-product-image";
import type { TenantRef } from "@/lib/tenant-context";
import { withStorefrontKitStock } from "@/lib/storefront-branch-inventory";

const STORE_CACHE_REVALIDATE_SEC = 300;

function publicSupabase(tenantSlug: string): SupabaseClient {
  return createStorefrontAnonClient(tenantSlug);
}

function storeCacheTags(base: string, slug: string): string[] {
  return [base, `${base}:${slug}`];
}

export async function getCachedStoreCategoriesWithCounts() {
  const tenant = await getStorefrontTenant();
  return unstable_cache(
    async () =>
      fetchStoreCategoriesWithCounts(
        publicSupabase(tenant.slug),
        tenant.id,
      ),
    ["store-categories-with-counts", tenant.id],
    {
      revalidate: STORE_CACHE_REVALIDATE_SEC,
      tags: storeCacheTags("store-categories", tenant.slug),
    },
  )();
}

export async function getCachedAllCategoryRows() {
  const tenant = await getStorefrontTenant();
  return unstable_cache(
    async () => {
      const { data } = await publicSupabase(tenant.slug)
        .from("categories")
        .select("id,name,sort_order")
        .eq("tenant_id", tenant.id)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      return data ?? [];
    },
    ["store-all-category-rows", tenant.id],
    {
      revalidate: STORE_CACHE_REVALIDATE_SEC,
      tags: storeCacheTags("store-categories", tenant.slug),
    },
  )();
}

export async function getCachedListingFacets(
  categoryIds: string[] | null,
): Promise<Awaited<ReturnType<typeof fetchListingFacets>>> {
  const tenant = await getStorefrontTenant();
  const key =
    categoryIds?.length ?
      `store-listing-facets:${tenant.id}:${[...categoryIds].sort().join(",")}`
    : `store-listing-facets:${tenant.id}:all`;
  return unstable_cache(
    async () =>
      fetchListingFacets(publicSupabase(tenant.slug), {
        categoryIds,
        tenantId: tenant.id,
      }),
    [key],
    {
      revalidate: STORE_CACHE_REVALIDATE_SEC,
      tags: storeCacheTags("store-products", tenant.slug),
    },
  )();
}

export async function getCachedCatalogBrowseSections(
  allCategoryRows: { id: string; name: string; sort_order: number }[],
) {
  const tenant = await getStorefrontTenant();
  const key = `store-catalog-sections:${tenant.id}:${allCategoryRows.map((c) => c.id).join(",")}`;
  return unstable_cache(
    async () =>
      fetchCatalogBrowseSections(
        publicSupabase(tenant.slug),
        allCategoryRows,
        tenant.id,
      ),
    [key],
    {
      revalidate: STORE_CACHE_REVALIDATE_SEC,
      tags: storeCacheTags("store-products", tenant.slug),
    },
  )();
}

export async function getCachedPublishedBanners(
  placement: "hero" | "products",
) {
  const tenant = await getStorefrontTenant();
  return unstable_cache(
    async () =>
      fetchPublishedBanners(publicSupabase(tenant.slug), placement, tenant.id),
    [`store-published-banners:${tenant.id}:${placement}`],
    {
      revalidate: STORE_CACHE_REVALIDATE_SEC,
      tags: storeCacheTags("store-banners", tenant.slug),
    },
  )();
}

export async function getCachedBannerStoreCoupon() {
  const tenant = await getStorefrontTenant();
  return unstable_cache(
    async () => fetchBannerStoreCoupon(publicSupabase(tenant.slug), tenant.id),
    ["store-banner-coupon", tenant.id],
    {
      revalidate: STORE_CACHE_REVALIDATE_SEC,
      tags: storeCacheTags("store-coupons", tenant.slug),
    },
  )();
}

export async function getCachedActiveWelcomeModal() {
  const tenant = await getStorefrontTenant();
  return unstable_cache(
    async () => fetchActiveWelcomeModal(publicSupabase(tenant.slug), tenant.id),
    ["store-welcome-modal", tenant.id],
    {
      revalidate: STORE_CACHE_REVALIDATE_SEC,
      tags: storeCacheTags("store-welcome-modal", tenant.slug),
    },
  )();
}

export async function getCachedStorefrontCouponDiscounts() {
  const tenant = await getStorefrontTenant();
  return unstable_cache(
    async () =>
      fetchStorefrontCouponDiscountPercentByProductId(
        publicSupabase(tenant.slug),
        tenant.slug,
      ),
    ["storefront-coupon-discounts", tenant.id],
    {
      revalidate: STORE_CACHE_REVALIDATE_SEC,
      tags: storeCacheTags("store-coupons", tenant.slug),
    },
  )();
}

const HOME_PRODUCTS_LIMIT = 8;

export type HomeFeaturedProduct = {
  id: string;
  name: string;
  brand: string | null;
  description: string | null;
  price_cents: number;
  has_vat: boolean | null;
  image_path: string | null;
  stock_quantity: number;
  fragrance_options: string[] | null;
  created_at: string;
};

async function loadHomeFeaturedProducts(
  tenant: TenantRef,
): Promise<HomeFeaturedProduct[]> {
  const { data } = await withStorefrontImage(
    publicSupabase(tenant.slug)
      .from("products")
      .select(
        "id,name,brand,description,price_cents,has_vat,image_path,stock_quantity,fragrance_options,created_at",
      )
      .eq("is_published", true)
      .eq("tenant_id", tenant.id),
  )
    .order("created_at", { ascending: false })
    .limit(HOME_PRODUCTS_LIMIT);
  return (data ?? []) as HomeFeaturedProduct[];
}

export async function getCachedHomeFeaturedProducts() {
  const tenant = await getStorefrontTenant();
  return unstable_cache(
    async () => loadHomeFeaturedProducts(tenant),
    ["store-home-featured-products", tenant.id],
    {
      revalidate: STORE_CACHE_REVALIDATE_SEC,
      tags: storeCacheTags("store-products", tenant.slug),
    },
  )();
}

const HOME_KITS_LIMIT = 8;

export type HomeFeaturedKit = {
  id: string;
  name: string;
  description: string;
  image_path: string | null;
  price_cents: number;
  max_stock: number;
  item_count: number;
};

async function loadAvailableStorefrontKits(
  tenant: TenantRef,
): Promise<HomeFeaturedKit[]> {
  const supabase = publicSupabase(tenant.slug);
  const rawKits = await fetchKitsWithItems(supabase, {
    publishedOnly: true,
    tenantId: tenant.id,
  });
  const kits = await withStorefrontKitStock(
    supabase,
    tenant.id,
    rawKits,
  );
  return kits
    .filter((k) => kitIsAvailable(k, "storefront"))
    .map((k) => {
      const items = k.items ?? [];
      return {
        id: k.id as string,
        name: k.name,
        description: k.description ?? "",
        image_path: k.image_path,
        price_cents: resolveKitSalePriceCents(k, items, "storefront"),
        max_stock: maxKitsAvailableFromItems(items, "storefront"),
        item_count: items.length,
      };
    });
}

export async function getCachedHomeFeaturedKits() {
  const tenant = await getStorefrontTenant();
  return unstable_cache(
    async (): Promise<HomeFeaturedKit[]> => {
      const kits = await loadAvailableStorefrontKits(tenant);
      return kits.slice(0, HOME_KITS_LIMIT);
    },
    ["store-home-featured-kits", tenant.id],
    {
      revalidate: STORE_CACHE_REVALIDATE_SEC,
      tags: storeCacheTags("store-kits", tenant.slug),
    },
  )();
}

/** Todos los kits disponibles para la sección del catálogo. */
export async function getCachedCatalogKits() {
  const tenant = await getStorefrontTenant();
  return unstable_cache(
    async (): Promise<HomeFeaturedKit[]> => loadAvailableStorefrontKits(tenant),
    ["store-catalog-kits", tenant.id],
    {
      revalidate: STORE_CACHE_REVALIDATE_SEC,
      tags: storeCacheTags("store-kits", tenant.slug),
    },
  )();
}

export type CatalogGridProduct = {
  id: string;
  name: string;
  brand: string;
  price_cents: number;
  has_vat: boolean | null;
  image_path: string | null;
  stock_quantity: number;
  size_options: unknown;
  size_value: number | null;
  size_unit: string | null;
  fragrance_options: string[] | null;
};

/** Catálogo completo (scroll): todos los productos publicados. */
export async function getCachedAllCatalogProducts() {
  const tenant = await getStorefrontTenant();
  return unstable_cache(
    async (): Promise<CatalogGridProduct[]> => {
      const { data } = await publicSupabase(tenant.slug)
          .from("products")
          .select(
            "id,name,brand,price_cents,has_vat,image_path,stock_quantity,size_options,size_value,size_unit,fragrance_options",
          )
          .eq("is_published", true)
          .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false })
        .limit(1000);
      return (data ?? []) as CatalogGridProduct[];
    },
    ["store-all-catalog-products", tenant.id],
    {
      revalidate: STORE_CACHE_REVALIDATE_SEC,
      tags: storeCacheTags("store-products", tenant.slug),
    },
  )();
}
