import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_TENANT_SLUG,
  publicHostname,
  resolveTenantFromHost,
  TENANT_SLUG_HEADER,
} from "@/lib/tenancy";
import { getRequestTenant, type TenantRef } from "@/lib/tenant-context";

export function storefrontTenantSlugFromHeaders(
  headerList: Headers,
): string {
  return (
    headerList.get(TENANT_SLUG_HEADER)?.trim() ||
    resolveTenantFromHost(publicHostname(headerList)).slug ||
    DEFAULT_TENANT_SLUG
  );
}

/** Anon PostgREST client that forwards the tenant slug for RLS. */
export function createStorefrontAnonClient(tenantSlug: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient(url, key, {
    global: {
      headers: { [TENANT_SLUG_HEADER]: tenantSlug },
    },
  });
}

export async function getStorefrontTenant(): Promise<TenantRef> {
  return getRequestTenant();
}
