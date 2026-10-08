import {
  isAccountModuleEnabled,
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
  { href: "/admin", keys: ["inicio_reportes"] },
  { href: "/admin/ventas", keys: ["ventas_ver"] },
  { href: "/admin/creditos", keys: ["creditos_ver"] },
  { href: "/admin/caja", keys: ["caja_ver"] },
  { href: "/admin/egresos", keys: ["egresos_ver"] },
  { href: "/admin/products", keys: ["inventario_ver"] },
  {
    href: "/admin/traslados",
    keys: ["stock_transferir", "inventario_ver"],
    module: "traslados",
  },
  { href: "/admin/kits", keys: ["kits_ver"] },
  { href: "/admin/customers", keys: ["clientes_ver"] },
  { href: "/admin/usuarios", keys: ["roles_ver"] },
  { href: "/admin/sucursales", keys: ["sucursales_ver"] },
  { href: "/admin/actividades", keys: ["actividades_ver"] },
  { href: "/admin/banners", keys: ["marketing_ver"] },
  { href: "/admin/coupons", keys: ["marketing_ver"] },
  { href: "/admin/envios", keys: ["ajustes_tienda_ver"] },
  { href: "/admin/settings", keys: ["ajustes_tienda_ver"] },
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
