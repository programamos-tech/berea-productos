import type { PermissionKey } from "@/lib/admin-permissions";
import {
  fetchCashSessionForBusinessDay,
  todayBusinessDayYmd,
} from "@/lib/cash-register";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/** Redirección cuando una acción o página requiere un permiso que el usuario no tiene. */
export const ADMIN_FORBIDDEN_REDIRECT = "/admin/cuenta?notice=forbidden";

export async function requireAdminSession() {
  const perm = await loadAdminPermissions();
  if (!perm) redirect("/admin/login");
  return perm;
}

/** Exige un permiso concreto (AND implícito de un solo elemento). */
export async function requireAdminPermission(key: PermissionKey) {
  const perm = await requireAdminSession();
  if (!perm.permissions[key]) redirect(ADMIN_FORBIDDEN_REDIRECT);
  return perm;
}

/** Exige al menos uno de los permisos listados. */
export async function requireAdminAnyPermission(keys: PermissionKey[]) {
  const perm = await requireAdminSession();
  if (!keys.length || !keys.some((k) => perm.permissions[k])) {
    redirect(ADMIN_FORBIDDEN_REDIRECT);
  }
  return perm;
}

/** Para server actions: misma regla que las páginas (redirect). */
export async function assertActionPermission(key: PermissionKey): Promise<void> {
  await requireAdminPermission(key);
}

/**
 * Vendedora: no puede operar ventas/egresos sin caja abierta del día.
 * Dueña no está bloqueada. Si el día ya cerró, también bloquea altas.
 */
export async function assertCashRegisterOpenForStaff(): Promise<void> {
  const perm = await requireAdminSession();
  if (perm.jobRole === "owner") return;
  if (!perm.permissions.caja_gestionar) return;

  const supabase = await createSupabaseServerClient();
  const today = todayBusinessDayYmd();
  const todaySession = await fetchCashSessionForBusinessDay(supabase, today);
  if (todaySession?.status === "open") return;
  redirect(
    todaySession?.status === "closed"
      ? "/admin/caja?error=day_closed"
      : "/admin/caja?error=need_open",
  );
}
