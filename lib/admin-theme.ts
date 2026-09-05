/**
 * Tema del backoffice — acento Berea House (#0197b2), chrome en neutros.
 *
 * Brand teal:  #0197b2
 * Sidebar light: zinc-50
 * Sidebar dark:  warm near-black
 */
export const ADMIN_CORAL = "#0197b2" as const;
export const ADMIN_CORAL_HOVER = "#01829a" as const;
export const ADMIN_CORAL_DEEP = "#015a6e" as const;
export const ADMIN_CORAL_SOFT = "#7ecfe0" as const;
export const ADMIN_CORAL_MIST = "#e6f6fa" as const;

/** Ganancia / OK — verde fresco alineado al teal de marca. */
export const ADMIN_PROFIT = "#2a9a7c" as const;
export const ADMIN_PROFIT_DARK = "#5dceb0" as const;

/** Pérdida / negativo — rojo suave que convive con el teal (no neón). */
export const ADMIN_LOSS = "#c4565c" as const;
export const ADMIN_LOSS_DARK = "#e8959a" as const;

/**
 * Fondo del sidebar (`--admin-sidebar-bg`): neutro claro.
 * En oscuro se sobreescribe vía CSS (`ADMIN_SIDEBAR_BG_DARK`).
 */
export const ADMIN_SIDEBAR_BG = "#FAFAFA" as const;

/** Sidebar en modo oscuro: cálido, bajo contraste con el canvas zinc-950. */
export const ADMIN_SIDEBAR_BG_DARK = "#1A1413" as const;

/** Paneles suaves (cuenta, direcciones) — blanco, alineado al canvas. */
export const STORE_CHROME_BG = "#ffffff" as const;

/**
 * Logo Berea House (teal, fondo transparente) — legible en sidebar claro y oscuro.
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

/** Logo producto Berea House en cabecera del sidebar. */
export const ADMIN_SIDEBAR_PRODUCT_LOGO_CLASS =
  "block h-auto w-full max-w-[6.75rem] object-contain object-center sm:max-w-[7.25rem]";
