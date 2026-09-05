import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import { isPlatformProductHost } from "@/lib/tenancy";
import { headers } from "next/headers";

function isPlatformAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const allow = (process.env.BEREA_PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.trim().toLowerCase());
}

/**
 * Who may open /admin/tenants/nuevo and call createTenantOnboarding (v1):
 * - `job_role === 'owner'` (Aleya owners act as Berea operators), OR
 * - session email in `BEREA_PLATFORM_ADMIN_EMAILS`.
 */
export async function canOnboardTenants(): Promise<boolean> {
  const gate = await assertCanOnboardTenants();
  return gate.ok;
}

export async function assertCanOnboardTenants(): Promise<
  | { ok: true; userId: string; email: string | undefined }
  | { ok: false; error: string }
> {
  const perm = await loadAdminPermissions();
  if (!perm) return { ok: false, error: "auth" };

  const email = perm.email || undefined;

  if (perm.jobRole === "owner" || isPlatformAdminEmail(email)) {
    return { ok: true, userId: perm.userId, email };
  }

  return { ok: false, error: "forbidden" };
}

/**
 * Alta de tienda: operadores autenticados, o self-serve en
 * `productos.bereahouse.com` (sin sesión previa).
 */
export async function assertCanCreateTenant(): Promise<
  | { ok: true; userId: string; email: string | undefined; selfServe: boolean }
  | { ok: false; error: string }
> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (isPlatformProductHost(host)) {
    return {
      ok: true,
      userId: "platform-self-serve",
      email: undefined,
      selfServe: true,
    };
  }

  const gate = await assertCanOnboardTenants();
  if (!gate.ok) return gate;
  return { ...gate, selfServe: false };
}
