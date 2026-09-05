/**
 * Berea Productos — multi-tenant host convention.
 *
 * Platform (SaaS entry):  productos.bereahouse.com
 * Tenant storefront/admin: {slug}.productos.bereahouse.com
 * Custom domains:          mapped via tenants.custom_domains (and LEGACY map below)
 *
 * Until business tables carry tenant_id, every deploy still holds one store’s data;
 * host resolution prepares routing / headers without isolating rows yet.
 */

export const PLATFORM_ROOT_DOMAIN = "bereahouse.com" as const;
export const PLATFORM_PRODUCT_HOST = "productos.bereahouse.com" as const;
export const DEFAULT_TENANT_SLUG = "aleya" as const;

/** Request header set by middleware (slug only; safe to log). */
export const TENANT_SLUG_HEADER = "x-berea-tenant-slug" as const;

/** Request header: platform | tenant | unknown */
export const TENANT_KIND_HEADER = "x-berea-tenant-kind" as const;

export type TenantHostKind = "platform" | "tenant" | "legacy" | "local" | "unknown";

export type ResolvedTenantHost = {
  kind: TenantHostKind;
  /** Tenant slug when known; null on bare platform host. */
  slug: string | null;
  host: string;
};

/**
 * Legacy / production hosts that already serve Aleya — must keep working.
 * (DB custom_domains is source of truth after migration; this is the offline fallback.)
 */
const LEGACY_HOST_TO_SLUG: Record<string, string> = {
  "aleyashop.net": DEFAULT_TENANT_SLUG,
  "www.aleyashop.net": DEFAULT_TENANT_SLUG,
  "milagrosguacari.com": DEFAULT_TENANT_SLUG,
  "www.milagrosguacari.com": DEFAULT_TENANT_SLUG,
};

function normalizeHost(raw: string): string {
  return raw.trim().toLowerCase().replace(/\.$/, "").split(":")[0] ?? "";
}

/**
 * Parse Host header into platform vs tenant slug.
 * Does not hit the database.
 */
export function resolveTenantFromHost(hostHeader: string | null | undefined): ResolvedTenantHost {
  const host = normalizeHost(hostHeader ?? "");
  if (!host) {
    return { kind: "unknown", slug: null, host: "" };
  }

  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".localhost") ||
    host.endsWith(".vercel.app")
  ) {
    const fromEnv = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG?.trim();
    return {
      kind: "local",
      slug: fromEnv || DEFAULT_TENANT_SLUG,
      host,
    };
  }

  if (host === PLATFORM_PRODUCT_HOST || host === `www.${PLATFORM_PRODUCT_HOST}`) {
    return { kind: "platform", slug: null, host: PLATFORM_PRODUCT_HOST };
  }

  const suffix = `.${PLATFORM_PRODUCT_HOST}`;
  if (host.endsWith(suffix)) {
    const slug = host.slice(0, -suffix.length);
    if (slug && !slug.includes(".") && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return { kind: "tenant", slug, host };
    }
    return { kind: "unknown", slug: null, host };
  }

  const legacy = LEGACY_HOST_TO_SLUG[host];
  if (legacy) {
    return { kind: "legacy", slug: legacy, host };
  }

  return { kind: "unknown", slug: null, host };
}

/** Host canónico de la plataforma SaaS (entrada a onboarding). */
export function isPlatformProductHost(
  hostHeader: string | null | undefined,
): boolean {
  return resolveTenantFromHost(hostHeader).kind === "platform";
}

/** Build the canonical tenant hostname for a slug. */
export function tenantProductHost(slug: string): string {
  return `${slug}.${PLATFORM_PRODUCT_HOST}`;
}
