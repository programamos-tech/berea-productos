import { cache } from "react";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  DEFAULT_TENANT_SLUG,
  resolveTenantFromHost,
  TENANT_SLUG_HEADER,
} from "@/lib/tenancy";
import {
  parseTenantBrand,
  tenantBrandToInvoiceFields,
  type InvoiceBrandFields,
} from "@/lib/tenant-brand";

export type TenantRef = {
  id: string;
  slug: string;
  name: string;
};

/**
 * Resolve the active tenant for this request (host header → tenants row).
 * Falls back to Aleya so legacy domains / local keep working.
 */
export async function getRequestTenant(): Promise<TenantRef> {
  const h = await headers();
  const fromMiddleware = h.get(TENANT_SLUG_HEADER)?.trim();
  const fromHost = resolveTenantFromHost(h.get("host")).slug;
  const slug = fromMiddleware || fromHost || DEFAULT_TENANT_SLUG;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id, slug, name")
    .eq("slug", slug)
    .in("status", ["active", "trial"])
    .maybeSingle();

  if (error) {
    console.error("[tenancy] getRequestTenant:", error.message);
  }

  if (data?.id) {
    return { id: data.id, slug: data.slug, name: data.name };
  }

  // Hard fallback: Aleya (production dataset)
  const { data: aleya } = await supabase
    .from("tenants")
    .select("id, slug, name")
    .eq("slug", DEFAULT_TENANT_SLUG)
    .maybeSingle();

  if (!aleya?.id) {
    throw new Error(
      `Tenant "${slug}" not found and default "${DEFAULT_TENANT_SLUG}" missing`,
    );
  }

  return { id: aleya.id, slug: aleya.slug, name: aleya.name };
}

async function getTenantBrandForRequestUncached(): Promise<InvoiceBrandFields> {
  const tenant = await getRequestTenant();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("brand")
    .eq("id", tenant.id)
    .maybeSingle();

  if (error) {
    console.error("[tenancy] getTenantBrandForRequest:", error.message);
  }

  return tenantBrandToInvoiceFields(parseTenantBrand(data?.brand));
}

/**
 * Invoice / tirilla brand for the current host’s tenant.
 * Empty `tenants.brand` → env defaults from `lib/brand.ts` (Aleya unchanged).
 */
export const getTenantBrandForRequest = cache(getTenantBrandForRequestUncached);
