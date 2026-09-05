/**
 * Tema del backoffice — coral + sidebar independiente (ERP).
 *
 * Coral base:  #ED7464
 * Sidebar light: mist coral (#FFDEDA)
 * Sidebar dark:  warm near-black with coral undertone
 * Soft:        #FFBDB5
 */
export const ADMIN_CORAL = "#ED7464" as const;
export const ADMIN_CORAL_HOVER = "#D96558" as const;
export const ADMIN_CORAL_DEEP = "#A65046" as const;
export const ADMIN_CORAL_SOFT = "#FFBDB5" as const;
export const ADMIN_CORAL_MIST = "#FFDEDA" as const;

/**
 * Fondo del sidebar (`--admin-sidebar-bg`): coral mist en claro.
 * En oscuro se sobreescribe vía CSS (`ADMIN_SIDEBAR_BG_DARK`).
 */
export const ADMIN_SIDEBAR_BG = ADMIN_CORAL_MIST;

/** Sidebar en modo oscuro: cálido, bajo contraste con el canvas zinc-950. */
export const ADMIN_SIDEBAR_BG_DARK = "#1A1413" as const;

/** Paneles suaves (cuenta, direcciones) — blanco, alineado al canvas. */
export const STORE_CHROME_BG = "#ffffff" as const;

/**
 * Logo Berea (coral, fondo transparente) — legible en sidebar mist y en oscuro.
 */
export const ADMIN_BRAND_LOGO_ON_SIDEBAR_CLASS = "";

/**
 * Firma Berea sobre sidebar claro (misma lógica que antes en fondo blanco).
 */
export const ADMIN_BEREA_SIGNATURE_ON_SIDEBAR_CLASS =
  "invert mix-blend-multiply";

/** Tamaño del wordmark Berea (firma) junto a “Experiencia por”. */
export const ADMIN_BEREA_MARK_IMG_CLASS =
  "block h-8 w-auto max-w-[9.5rem] object-contain object-center sm:h-9 sm:max-w-[10.5rem]";

/** Logo producto Berea en cabecera del sidebar — compacto, centrado. */
export const ADMIN_SIDEBAR_PRODUCT_LOGO_CLASS =
  "block h-auto w-full max-w-[6.75rem] object-contain object-center";
