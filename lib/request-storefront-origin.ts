import { headers } from "next/headers";
import { getPublicSiteUrl } from "@/lib/public-site-url";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { normalizeHost, publicHostname } from "@/lib/tenancy";

/** Primer dominio propio de la cuenta (sin `www.` si existe la variante corta). */
async function tenantCustomDomainOrigin(tenantId: string): Promise<string | null> {
  const { data } = await createSupabaseServiceClient()
    .from("tenants")
    .select("custom_domains")
    .eq("id", tenantId)
    .maybeSingle();
  const domains = Array.isArray(data?.custom_domains)
    ? (data.custom_domains as unknown[]).map((d) => normalizeHost(String(d ?? ""))).filter(Boolean)
    : [];
  const primary = domains.find((d) => !d.startsWith("www.")) ?? domains[0];
  return primary ? `https://${primary}` : null;
}

/**
 * Origen de la tienda: el dominio propio de la cuenta si lo tiene;
 * si no, el host de esta petición.
 */
export async function requestStorefrontOrigin(tenantId?: string | null): Promise<string> {
  if (tenantId) {
    const own = await tenantCustomDomainOrigin(tenantId);
    if (own) return own;
  }
  const headerList = await headers();
  const host = publicHostname(headerList);
  if (!host || host === "localhost" || host.endsWith(".local")) {
    return getPublicSiteUrl();
  }
  const forwarded = headerList.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto = forwarded === "http" || forwarded === "https" ? forwarded : "https";
  return `${proto}://${host}`;
}
