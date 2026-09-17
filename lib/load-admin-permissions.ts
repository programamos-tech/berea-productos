import { cache } from "react";
import { loadBranchContext } from "@/lib/branch-server";
import type { BranchContext } from "@/lib/branch-context";
import { withTimeout } from "@/lib/async-timeout";
import {
  mergePermissionsWithDefaults,
  normalizeCollaboratorJobRole,
  type CollaboratorJobRole,
  type PermissionMap,
} from "@/lib/admin-permissions";
import { resolveActingCustomerTenant } from "@/lib/platform-operator-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  adminAccountChrome,
  type AdminAccountChrome,
} from "@/lib/tenant-brand";

const ADMIN_AUTH_TIMEOUT_MS = 12_000;

export type AdminSession = {
  userId: string;
  permissions: PermissionMap;
  jobRole: CollaboratorJobRole;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  tenantLogoSrc: string;
  tenantLogoPlate: string;
  displayName: string;
  email: string;
  isPlatformOperator: boolean;
  /**
   * Sucursales del tenant en el que opera. Null en el picker de cuentas:
   * el tenant interno `platform` no tiene branches, y exigirlas redirige
   * /admin/cuentas → /admin/login → /admin/cuentas (ERR_TOO_MANY_REDIRECTS).
   */
  branchContext: BranchContext | null;
  actingAccount: {
    holderName: string;
    storeName: string;
  } | null;
};

export type AdminActingSession = AdminSession & {
  branchContext: BranchContext;
};

async function loadAdminPermissionsUncached(): Promise<AdminSession | null> {
  const supabase = await createSupabaseServerClient();
  const authResult = (await withTimeout(
    supabase.auth.getUser(),
    ADMIN_AUTH_TIMEOUT_MS,
  )) as Awaited<ReturnType<typeof supabase.auth.getUser>> | null;
  const user = authResult?.data.user ?? null;
  if (!user) return null;

  const profileResult = await withTimeout(
    supabase
      .from("profiles")
      .select(
        "permissions, job_role, tenant_id, display_name, is_platform_operator, tenants!inner(slug, name, brand)",
      )
      .eq("id", user.id)
      .maybeSingle(),
    ADMIN_AUTH_TIMEOUT_MS,
  );

  if (!profileResult || !("data" in profileResult)) {
    console.error("[admin] profiles: timeout");
    return null;
  }

  const { data: row, error: profileError } = profileResult;
  if (profileError) {
    console.error("[admin] profiles:", profileError.message);
    return null;
  }

  if (!row) return null;

  const homeTenantId = row.tenant_id as string | null;
  if (!homeTenantId) {
    console.error("[admin] profiles: missing tenant_id");
    return null;
  }

  const tenantsJoin = row.tenants as
    | { slug?: string; name?: string; brand?: unknown }
    | { slug?: string; name?: string; brand?: unknown }[]
    | null;
  const homeTenant = Array.isArray(tenantsJoin) ? tenantsJoin[0] : tenantsJoin;
  const homeSlug = homeTenant?.slug;
  const homeName = homeTenant?.name ?? "";
  if (!homeSlug) {
    console.error("[admin] profiles: missing tenant slug");
    return null;
  }

  const isPlatformOperator = row.is_platform_operator === true;
  const acting = isPlatformOperator
    ? await resolveActingCustomerTenant()
    : null;

  const tenantId = acting?.id ?? homeTenantId;
  const tenantSlug = acting?.slug ?? homeSlug;
  const chrome: AdminAccountChrome = acting
    ? acting.chrome
    : adminAccountChrome({
        slug: homeSlug,
        name: homeName,
        brand: homeTenant?.brand,
      });
  const tenantName = chrome.name;
  const branchContext = await loadBranchContext(tenantId);
  if (!branchContext) {
    // Operador en el picker: home es el tenant platform, sin sucursales.
    if (!(isPlatformOperator && !acting)) {
      console.error("[admin] branches: no accessible active branch");
      return null;
    }
  }

  const jobRole = normalizeCollaboratorJobRole(row.job_role as string | null);
  const permissions = mergePermissionsWithDefaults(
    row.permissions as PermissionMap | null,
    jobRole,
  );

  const email = (user.email ?? "").trim();
  const profileName =
    row.display_name != null ? String(row.display_name).trim() : "";
  const displayName =
    profileName ||
    email.split("@")[0]?.trim() ||
    "Administrador";

  return {
    userId: user.id,
    permissions,
    jobRole,
    tenantId,
    tenantSlug,
    tenantName,
    tenantLogoSrc: chrome.logoSrc,
    tenantLogoPlate: chrome.plateColor,
    displayName,
    email,
    isPlatformOperator,
    branchContext,
    actingAccount: acting
      ? { holderName: acting.accountHolderName, storeName: acting.name }
      : null,
  };
}

/** Una sola lectura de perfil por request (layout + página + permisos de sección). */
export const loadAdminPermissions = cache(loadAdminPermissionsUncached);
