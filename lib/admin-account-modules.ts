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
  "egresos",
  "inventario",
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
  permissionKeys: PermissionKey[];
  /** Si es false, no se lista en Cuentas (el id sigue valiendo al reactivar el menú). */
  listed?: boolean;
};

export const ACCOUNT_MODULES: AccountModuleDef[] = [
  {
    id: "reportes",
    label: "Reportes",
    permissionKeys: ["inicio_reportes", "reportes_tienda"],
  },
  {
    id: "caja",
    label: "Caja",
    permissionKeys: ["caja_ver", "caja_gestionar"],
  },
  {
    id: "ventas",
    label: "Ventas",
    permissionKeys: ["ventas_ver", "ventas_crear"],
  },
  {
    id: "creditos",
    label: "Créditos",
    hint: "Menú, abonos y vender a crédito",
    permissionKeys: ["creditos_ver", "creditos_abonar"],
  },
  {
    id: "egresos",
    label: "Gastos",
    permissionKeys: ["egresos_ver", "egresos_crear", "proveedores_ver"],
  },
  {
    id: "inventario",
    label: "Inventario",
    permissionKeys: [
      "inventario_ver",
      "productos_crear",
      "productos_editar",
      "categorias_gestionar",
      "stock_actualizar",
      "stock_transferir",
    ],
  },
  {
    id: "kits",
    label: "Kits",
    permissionKeys: ["kits_ver", "kits_gestionar"],
  },
  {
    id: "clientes",
    label: "Clientes",
    permissionKeys: ["clientes_ver", "clientes_crear", "clientes_editar"],
  },
  {
    id: "equipo",
    label: "Equipo",
    permissionKeys: ["roles_ver", "colaboradores_gestionar"],
  },
  {
    id: "sucursales",
    label: "Sucursales",
    permissionKeys: ["sucursales_ver", "sucursales_gestionar"],
  },
  {
    id: "registros",
    label: "Registros",
    permissionKeys: ["actividades_ver"],
  },
  {
    id: "marketing",
    label: "Marketing",
    hint: "Banners y cupones",
    permissionKeys: ["marketing_ver"],
    listed: false,
  },
  {
    id: "tienda",
    label: "Tienda",
    hint: "Ajustes de tienda y envíos",
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

export function listedAccountModules(): AccountModuleDef[] {
  return ACCOUNT_MODULES.filter((mod) => mod.listed !== false);
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
