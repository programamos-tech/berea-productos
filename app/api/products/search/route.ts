import { NextResponse } from "next/server";
import {
  storefrontProductsSearchNameBrandOrIlikeFilter,
  storefrontProductsSearchOrIlikeFilter,
} from "@/lib/admin-product-search-filter";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStorefrontTenant } from "@/lib/storefront-tenant";

const SEARCH_CACHE_CONTROL = "public, s-maxage=60, stale-while-revalidate=30";

/** Evita metacaracteres en ILIKE. */
function sanitizeIlikeQuery(q: string) {
  return q.replace(/[%_\\,]/g, "").slice(0, 80);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("q")?.trim() ?? "";
  if (raw.length < 2) {
    return NextResponse.json({ products: [] });
  }

  const q = sanitizeIlikeQuery(raw);
  if (q.length < 2) {
    return NextResponse.json({ products: [] });
  }

  const supabase = await createSupabaseServerClient();
  const tenant = await getStorefrontTenant();

  const base = () =>
    supabase
      .from("products")
      .select("id,name,price_cents,has_vat,image_path")
      .eq("is_published", true)
      .eq("tenant_id", tenant.id);

  let { data, error } = await base()
    .or(storefrontProductsSearchOrIlikeFilter(q))
    .order("name")
    .limit(12);

  if (error && /reference/i.test(error.message)) {
    const retry = await base()
      .or(storefrontProductsSearchNameBrandOrIlikeFilter(q))
      .order("name")
      .limit(12);
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { products: data ?? [] },
    { headers: { "Cache-Control": SEARCH_CACHE_CONTROL } },
  );
}
