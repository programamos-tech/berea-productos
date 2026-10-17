import {
  accountModuleById,
  isAccountModuleEnabled,
  modulePreviewHref,
  type AccountModuleId,
} from "@/lib/admin-account-modules";
import type {
  CollaboratorJobRole,
  PermissionKey,
  PermissionMap,
} from "@/lib/admin-permissions";

/** Rutas del sidebar que requieren permiso (las demás se consideran siempre visibles). */
const NAV_HREFS_WITH_PERMISSION: {
  href: string;
  keys: PermissionKey[];
  module?: AccountModuleId;
}[] = [
  { href: "/admin", keys: ["inicio_reportes"], module: "reportes" },
  { href: "/admin/ventas", keys: ["ventas_ver"], module: "ventas" },
  { href: "/admin/creditos", keys: ["creditos_ver"], module: "creditos" },
  { href: "/admin/proveedores", keys: ["proveedores_ver"], module: "proveedores" },
  { href: "/admin/caja", keys: ["caja_ver"], module: "caja" },
  { href: "/admin/egresos", keys: ["egresos_ver"], module: "egresos" },
  { href: "/admin/products", keys: ["inventario_ver"], module: "inventario" },
  {
    href: "/admin/traslados",
    keys: ["stock_transferir", "inventario_ver"],
    module: "traslados",
  },
  { href: "/admin/kits", keys: ["kits_ver"], module: "kits" },
  { href: "/admin/customers", keys: ["clientes_ver"], module: "clientes" },
  { href: "/admin/usuarios", keys: ["roles_ver"], module: "equipo" },
  { href: "/admin/sucursales", keys: ["sucursales_ver"], module: "sucursales" },
  { href: "/admin/actividades", keys: ["actividades_ver"], module: "registros" },
  { href: "/admin/banners", keys: ["marketing_ver"], module: "marketing" },
  { href: "/admin/coupons", keys: ["marketing_ver"], module: "marketing" },
  { href: "/admin/envios", keys: ["ajustes_tienda_ver"], module: "tienda" },
  { href: "/admin/settings", keys: ["ajustes_tienda_ver"], module: "tienda" },
];

/** Onboarding multi-tenant: solo propietarios. */
export const TENANT_ONBOARDING_HREF = "/admin/tenants/nuevo";

/** Lista de hrefs visibles (para serializar al cliente). */
export function adminNavAllowedHrefList(
  p: PermissionMap,
  opts?: {
    jobRole?: CollaboratorJobRole;
    canOnboard?: boolean;
    disabledModules?: readonly AccountModuleId[];
  },
): string[] {
  const disabled = opts?.disabledModules ?? [];
  const out = new Set<string>(["/admin/cuenta", "/admin/configuracion", "/"]);
  for (const { href, keys, module } of NAV_HREFS_WITH_PERMISSION) {
    if (module && !isAccountModuleEnabled(disabled, module)) continue;
    if (keys.some((k) => Boolean(p[k]))) out.add(href);
  }
  if (opts?.canOnboard || opts?.jobRole === "owner") {
    out.add(TENANT_ONBOARDING_HREF);
  }
  return [...out];
}

/**
 * Módulos apagados en la cuenta que igual se muestran en el menú,
 * como vista para adquirirlos. El propietario y el administrador ven el catálogo;
 * el resto, solo los que su rol ya incluiría.
 */
export function adminNavLockedHrefList(
  rolePermissions: PermissionMap,
  opts?: {
    jobRole?: CollaboratorJobRole;
    disabledModules?: readonly AccountModuleId[];
  },
): string[] {
  const disabled = opts?.disabledModules ?? [];
  const decisionMaker = opts?.jobRole === "owner" || opts?.jobRole === "admin";
  const out: string[] = [];
  for (const { href, keys, module } of NAV_HREFS_WITH_PERMISSION) {
    if (!module || isAccountModuleEnabled(disabled, module)) continue;
    const roleCan = keys.some((key) => Boolean(rolePermissions[key]));
    if (!decisionMaker && !roleCan) continue;
    if (!out.includes(href)) out.push(href);
  }
  return out;
}

export function lockedNavItemMeta(href: string): {
  href: string;
  pitch: string;
} | null {
  const row = NAV_HREFS_WITH_PERMISSION.find((item) => item.href === href);
  if (!row?.module) return null;
  const mod = accountModuleById(row.module);
  if (!mod) return null;
  return {
    href: modulePreviewHref(row.module),
    pitch: mod.pitch,
  };
}
