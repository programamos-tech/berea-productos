import {
  jobRoleSkipsCashRegister,
  type CollaboratorJobRole,
  type PermissionMap,
} from "@/lib/admin-permissions";
import type { CashRegisterSessionRow } from "@/lib/cash-register";

/**
 * Venta con permiso de caja: deben abrir caja al empezar el día
 * antes de operar el panel. Propietario y administrador no están bloqueados.
 */
export function staffMustOpenCashRegister(args: {
  jobRole: CollaboratorJobRole;
  permissions: PermissionMap;
  todaySession: Pick<CashRegisterSessionRow, "status"> | null;
}): boolean {
  if (jobRoleSkipsCashRegister(args.jobRole)) return false;
  if (!args.permissions.caja_gestionar) return false;
  if (args.todaySession?.status === "open") return false;
  if (args.todaySession?.status === "closed") return false;
  return true;
}

/** Rutas permitidas mientras falta abrir la caja del día. */
export const CASH_GATE_ALLOWED_PREFIXES = [
  "/admin/caja",
  "/admin/cuenta",
] as const;

export function pathAllowedDuringCashGate(pathname: string): boolean {
  return CASH_GATE_ALLOWED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function navHrefsForCashGate(allowedNavHrefs: string[]): string[] {
  const keep = new Set<string>(["/admin/caja", "/admin/cuenta", "/"]);
  return allowedNavHrefs.filter((h) => keep.has(h));
}
