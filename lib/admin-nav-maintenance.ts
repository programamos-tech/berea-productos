/**
 * Secciones del admin temporalmente no disponibles:
 * visibles en el menú (difuminadas) pero sin acceso.
 */
export const ADMIN_NAV_MAINTENANCE_HREFS = [
  "/admin/banners",
  "/admin/coupons",
  "/admin/envios",
  "/admin/settings",
] as const;

export type AdminNavMaintenanceHref =
  (typeof ADMIN_NAV_MAINTENANCE_HREFS)[number];

export function isAdminNavHrefInMaintenance(href: string): boolean {
  const pathOnly = href.split("?")[0] ?? href;
  return (ADMIN_NAV_MAINTENANCE_HREFS as readonly string[]).includes(pathOnly);
}

export function isAdminPathInMaintenance(pathname: string): boolean {
  return ADMIN_NAV_MAINTENANCE_HREFS.some(
    (href) => pathname === href || pathname.startsWith(`${href}/`),
  );
}

export const ADMIN_NAV_UNAVAILABLE_HINT = "En mantenimiento · no disponible por ahora";

export const ADMIN_NAV_UNAVAILABLE_BADGE = "Mantenimiento";
