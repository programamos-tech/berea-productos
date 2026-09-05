import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? undefined;

  if (perm.jobRole === "owner" || isPlatformAdminEmail(email)) {
    return { ok: true, userId: perm.userId, email };
  }

  return { ok: false, error: "forbidden" };
}
