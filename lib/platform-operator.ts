/** Cookie + PostgREST header: tenant the Berea operator is currently operating. */
export const ACTING_TENANT_COOKIE = "berea_acting_tenant" as const;
export const ACTING_TENANT_HEADER = "x-berea-acting-tenant-id" as const;

export const PLATFORM_TENANT_SLUG = "berea" as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isActingTenantId(raw: string | null | undefined): raw is string {
  return Boolean(raw && UUID_RE.test(raw.trim()));
}

export function accountHolderLabel(name: string | null | undefined): string {
  const n = String(name ?? "").trim();
  return n.length > 0 ? n : "Sin titular";
}
