import {
  PERMISSION_MODULES,
  type PermissionKey,
  type PermissionMap,
  type PermissionModule,
} from "@/lib/admin-permissions";

/**
 * Módulos que se pueden apagar por cuenta (tenant).
 * Al sumar un módulo al panel: agrégalo aquí (id estable + permissionKeys).
 * Configuración y Mi cuenta no se apagan.
 */
export const ACCOUNT_MODULE_IDS = [
  "reportes",
  "caja",
  "ventas",
  "creditos",
  "proveedores",
  "egresos",
  "inventario",
  "traslados",
  "kits",
  "clientes",
  "equipo",
  "sucursales",
  "registros",
  "marketing",
  "tienda",
] as const;

export type AccountModuleId = (typeof ACCOUNT_MODULE_IDS)[number];

export type AccountModuleDef = {
  id: AccountModuleId;
  label: string;
  hint?: string;
  /** Qué puede hacer el cliente con el módulo, para el menú y el simulacro. */
  pitch: string;
  /** Ruta real cuando el módulo está habilitado. */
  href?: string;
  permissionKeys: PermissionKey[];
  /** Si es false, no se lista en Cuentas (el id sigue valiendo al reactivar el menú). */
  listed?: boolean;
};

export function modulePreviewHref(moduleId: AccountModuleId): string {
  return `/admin/modulos/${moduleId}`;
}

export const ACCOUNT_MODULES: AccountModuleDef[] = [
  {
    id: "reportes",
    label: "Reportes",
    href: "/admin",
    pitch: "Ventas del día, del mes y cómo va la tienda en un solo tablero.",
    permissionKeys: ["inicio_reportes", "reportes_tienda"],
  },
  {
    id: "caja",
    label: "Caja",
    href: "/admin/caja",
    pitch: "Apertura, cierre y el efectivo del día de cada sucursal.",
    permissionKeys: ["caja_ver", "caja_gestionar"],
  },
  {
    id: "ventas",
    label: "Ventas",
    href: "/admin/ventas",
    pitch: "Facturas, cotizaciones y el detalle de cada venta.",
    permissionKeys: ["ventas_ver", "ventas_crear"],
  },
  {
    id: "creditos",
    label: "Créditos",
    href: "/admin/creditos",
    hint: "Menú, abonos y vender a crédito",
    pitch: "Vendé a crédito, registrá abonos y mirá lo que falta por cobrar.",
    permissionKeys: ["creditos_ver", "creditos_abonar"],
  },
  {
    id: "proveedores",
    label: "Proveedores",
    href: "/admin/proveedores",
    hint: "Órdenes de compra y abonos",
    pitch: "Órdenes de compra, abonos y el ingreso de la mercancía al inventario.",
    permissionKeys: ["proveedores_ver"],
  },
  {
    id: "egresos",
    label: "Gastos",
    href: "/admin/egresos",
    pitch: "Gastos del negocio, con método de pago y comprobante.",
    permissionKeys: ["egresos_ver", "egresos_crear"],
  },
  {
    id: "inventario",
    label: "Inventario",
    href: "/admin/products",
    pitch: "Productos, precios, stock por sucursal y categorías.",
    permissionKeys: [
      "inventario_ver",
      "productos_crear",
      "productos_editar",
      "categorias_gestionar",
      "stock_actualizar",
    ],
  },
  {
    id: "traslados",
    label: "Traslados",
    href: "/admin/traslados",
    hint: "Movimientos de inventario entre sucursales",
    pitch: "Pasá unidades de una sucursal a otra sin perder el conteo.",
    permissionKeys: ["stock_transferir"],
  },
  {
    id: "kits",
    label: "Kits",
    href: "/admin/kits",
    pitch: "Armá combos con varios productos y vendelos como uno solo.",
    permissionKeys: ["kits_ver", "kits_gestionar"],
  },
  {
    id: "clientes",
    label: "Clientes",
    href: "/admin/customers",
    pitch: "Fichas de clientes, documentos y lo que te deben.",
    permissionKeys: ["clientes_ver", "clientes_crear", "clientes_editar"],
  },
  {
    id: "equipo",
    label: "Equipo",
    href: "/admin/usuarios",
    pitch: "Usuarios del panel y lo que cada uno puede ver.",
    permissionKeys: ["roles_ver", "colaboradores_gestionar"],
  },
  {
    id: "sucursales",
    label: "Sucursales",
    href: "/admin/sucursales",
    pitch: "Locales de la cuenta, con inventario y caja propios.",
    permissionKeys: ["sucursales_ver", "sucursales_gestionar"],
  },
  {
    id: "registros",
    label: "Registros",
    href: "/admin/actividades",
    pitch: "Quién hizo cada cambio: ventas, abonos y anulaciones.",
    permissionKeys: ["actividades_ver"],
  },
  {
    id: "marketing",
    label: "Marketing",
    hint: "Banners y cupones",
    pitch: "Banners y cupones de la tienda.",
    permissionKeys: ["marketing_ver"],
    listed: false,
  },
  {
    id: "tienda",
    label: "Tienda",
    hint: "Ajustes de tienda y envíos",
    pitch: "Ajustes de la tienda y de los envíos.",
    permissionKeys: ["ajustes_tienda_ver"],
    listed: false,
  },
];

const MODULE_BY_ID = new Map(
  ACCOUNT_MODULES.map((mod) => [mod.id, mod] as const),
);

export function isAccountModuleId(raw: string): raw is AccountModuleId {
  return MODULE_BY_ID.has(raw as AccountModuleId);
}

export function isAccountModuleEnabled(
  disabled: readonly AccountModuleId[],
  moduleId: AccountModuleId,
): boolean {
  return !disabled.includes(moduleId);
}

export function listedAccountModules(): AccountModuleDef[] {
  return ACCOUNT_MODULES.filter((mod) => mod.listed !== false);
}

export function accountModuleById(id: AccountModuleId): AccountModuleDef | undefined {
  return MODULE_BY_ID.get(id);
}

export function accountModuleIdForPermission(key: PermissionKey): AccountModuleId | null {
  for (const mod of ACCOUNT_MODULES) {
    if (mod.permissionKeys.includes(key)) return mod.id;
  }
  return null;
}

export function parseDisabledAccountModules(raw: unknown): AccountModuleId[] {
  if (!Array.isArray(raw)) return [];
  const out: AccountModuleId[] = [];
  const seen = new Set<AccountModuleId>();
  for (const item of raw) {
    const id = String(item ?? "").trim();
    if (!isAccountModuleId(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function disabledPermissionKeys(
  disabled: readonly AccountModuleId[],
): Set<PermissionKey> {
  const keys = new Set<PermissionKey>();
  for (const id of disabled) {
    const mod = MODULE_BY_ID.get(id);
    if (!mod) continue;
    for (const key of mod.permissionKeys) keys.add(key);
  }
  return keys;
}

/** Fuerza a false los permisos de módulos apagados en la cuenta. */
export function applyDisabledAccountModules(
  permissions: PermissionMap,
  disabled: readonly AccountModuleId[],
): PermissionMap {
  if (disabled.length === 0) return permissions;
  const keys = disabledPermissionKeys(disabled);
  if (keys.size === 0) return permissions;
  const out: PermissionMap = { ...permissions };
  for (const key of keys) out[key] = false;
  return out;
}

export function permissionModulesForAccount(
  disabled: readonly AccountModuleId[],
): PermissionModule[] {
  const keys = disabledPermissionKeys(disabled);
  if (keys.size === 0) return PERMISSION_MODULES;
  return PERMISSION_MODULES.map((mod) => ({
    ...mod,
    items: mod.items.filter((item) => !keys.has(item.key)),
  })).filter((mod) => mod.items.length > 0);
}

export function accountAllowsCredit(permissions: PermissionMap): boolean {
  return Boolean(permissions.creditos_ver || permissions.creditos_abonar);
}

export function accountAllowsKits(permissions: PermissionMap): boolean {
  return Boolean(permissions.kits_ver || permissions.kits_gestionar);
}

export function withModuleDisabled(
  current: readonly AccountModuleId[],
  moduleId: AccountModuleId,
  enabled: boolean,
): AccountModuleId[] {
  const set = new Set(current);
  if (enabled) set.delete(moduleId);
  else set.add(moduleId);
  return ACCOUNT_MODULE_IDS.filter((id) => set.has(id));
}
