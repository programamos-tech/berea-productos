import { createStorefrontAnonClient, storefrontTenantSlugFromHeaders } from "@/lib/storefront-tenant";
import { NextResponse } from "next/server";
import { withStorefrontImage } from "@/lib/storefront-product-image";

const SEARCH_CACHE_CONTROL = "public, s-maxage=60, stale-while-revalidate=30";

/** Evita metacaracteres en ILIKE. */
function sanitizeIlikeQuery(q: string) {
  return q.replace(/[%_\\]/g, "").slice(0, 80);
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

  const slug = storefrontTenantSlugFromHeaders(request.headers);
  let supabase;
  try {
    supabase = createStorefrontAnonClient(slug);
  } catch {
    return NextResponse.json(
      { error: "Missing Supabase env" },
      { status: 500 },
    );
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  let query = withStorefrontImage(
    supabase
      .from("products")
      .select("id,name,price_cents,has_vat,image_path")
      .eq("is_published", true),
  );
  if (tenant?.id) query = query.eq("tenant_id", tenant.id);

  const { data, error } = await query
    .ilike("name", `%${q}%`)
    .order("name")
    .limit(12);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { products: data ?? [] },
    { headers: { "Cache-Control": SEARCH_CACHE_CONTROL } },
  );
}
