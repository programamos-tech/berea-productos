/**
 * Fondo del sidebar (`--admin-sidebar-bg` en `app/layout.tsx`): blanco,
 * el rosa queda solo en acentos (bordes, botones, marca).
 */
export const ADMIN_SIDEBAR_BG = "#ffffff" as const;

/** Paneles suaves (cuenta, direcciones) — blanco, alineado al backoffice. */
export const STORE_CHROME_BG = "#ffffff" as const;

/**
 * Logo del panel (PNG blanco sobre transparente): silueta oscura en fondo claro;
 * en `data-admin-theme="dark"` sin filtro para ver el blanco sobre zinc.
 */
export const ADMIN_BRAND_LOGO_ON_SIDEBAR_CLASS =
  "[filter:brightness(0)_saturate(1)] dark:[filter:none]";

/**
 * `logo-berea12.png` va blanco sobre negro opaco (no igual al PNG de Milagros).
 * Para que en claro se lea como la silueta de Milagros (`brightness(0)` sobre transparente):
 * invertimos → el negro pasa a claro sobre el lienzo interno → `multiply` con el blanco del
 * sidebar hace que ese “fondo negro invertido” desaparezca y solo quede la marca en tinta oscura.
 * En oscuro, `screen` hace que el negro caiga contra el zinc y las letras queden claras, sin caja negra.
 */
export const ADMIN_BEREA_SIGNATURE_ON_SIDEBAR_CLASS =
  "invert mix-blend-multiply dark:invert-0 dark:mix-blend-screen";

/** Tamaño del wordmark Berea junto al de Milagros en el sidebar. */
export const ADMIN_BEREA_MARK_IMG_CLASS =
  "block h-8 w-auto max-w-[9.5rem] object-contain object-center sm:h-9 sm:max-w-[10.5rem]";
