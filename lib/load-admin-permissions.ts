import { cache } from "react";
import { withTimeout } from "@/lib/async-timeout";
import {
  mergePermissionsWithDefaults,
  normalizeCollaboratorJobRole,
  type CollaboratorJobRole,
  type PermissionMap,
} from "@/lib/admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ADMIN_AUTH_TIMEOUT_MS = 12_000;

async function loadAdminPermissionsUncached(): Promise<{
  userId: string;
  permissions: PermissionMap;
  jobRole: CollaboratorJobRole;
  tenantId: string;
  tenantSlug: string;
  displayName: string;
  email: string;
} | null> {
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
        "permissions, job_role, tenant_id, display_name, tenants!inner(slug)",
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

  const tenantId = row.tenant_id as string | null;
  if (!tenantId) {
    console.error("[admin] profiles: missing tenant_id");
    return null;
  }

  const tenantsJoin = row.tenants as { slug?: string } | { slug?: string }[] | null;
  const tenantSlug = Array.isArray(tenantsJoin)
    ? tenantsJoin[0]?.slug
    : tenantsJoin?.slug;
  if (!tenantSlug) {
    console.error("[admin] profiles: missing tenant slug");
    return null;
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
    displayName,
    email,
  };
}

/** Una sola lectura de perfil por request (layout + página + permisos de sección). */
export const loadAdminPermissions = cache(loadAdminPermissionsUncached);
