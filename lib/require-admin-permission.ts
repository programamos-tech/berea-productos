import {
  jobRoleSkipsCashRegister,
  type PermissionKey,
} from "@/lib/admin-permissions";
import {
  fetchStaffCashSessionForToday,
  todayBusinessDayYmd,
} from "@/lib/cash-register";
import {
  loadAdminPermissions,
  type AdminActingSession,
} from "@/lib/load-admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/** Redirección cuando una acción o página requiere un permiso que el usuario no tiene. */
export const ADMIN_FORBIDDEN_REDIRECT = "/admin/cuenta?notice=forbidden";

export async function requireAdminSession(): Promise<AdminActingSession> {
  const perm = await loadAdminPermissions();
  if (!perm) redirect("/admin/login");
  if (!perm.branchContext) {
    redirect(perm.isPlatformOperator ? "/admin/cuentas" : "/admin/login");
  }
  return { ...perm, branchContext: perm.branchContext };
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
 * Venta: no puede operar ventas/egresos sin caja abierta del día.
 * Propietario y administrador no están bloqueados. Si el día ya cerró, también bloquea altas.
 */
export async function assertCashRegisterOpenForStaff(): Promise<void> {
  const perm = await requireAdminSession();
  if (jobRoleSkipsCashRegister(perm.jobRole)) return;
  if (!perm.permissions.caja_gestionar) return;

  const supabase = await createSupabaseServerClient();
  const today = todayBusinessDayYmd();
  const todaySession = await fetchStaffCashSessionForToday(
    supabase,
    perm.userId,
    today,
  );
  if (todaySession?.status === "open") return;
  redirect(
    todaySession?.status === "closed"
      ? "/admin/caja?error=day_closed"
      : "/admin/caja?error=need_open",
  );
}
