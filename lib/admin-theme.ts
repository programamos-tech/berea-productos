/**
 * Tema del backoffice — acento Berea House (#0197b2), chrome en neutros.
 *
 * Brand teal:  #0197b2
 * Sidebar: navy / deep blue (se diferencia del canvas blanco)
 * Active nav: solid brand accent (sin gradiente Liaco)
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
 * Fondo del sidebar (`--admin-sidebar-bg`): azul oscuro / navy Berea.
 * Contrasta con el canvas blanco del panel.
 */
export const ADMIN_SIDEBAR_BG = "#0B3342" as const;

/** Sidebar en modo oscuro admin: navy más profundo. */
export const ADMIN_SIDEBAR_BG_DARK = "#072632" as const;

/** Ítem activo del nav — acento de marca sólido (sin gradiente). */
export const ADMIN_SIDEBAR_NAV_ACTIVE = ADMIN_CORAL;

/** Texto / iconos inactivos del sidebar. */
export const ADMIN_SIDEBAR_NAV_MUTED = "#9db8c4" as const;

/** Etiquetas de sección. */
export const ADMIN_SIDEBAR_SECTION = "#7a9aa8" as const;

/** Bordes sutiles sobre navy. */
export const ADMIN_SIDEBAR_BORDER = "rgba(255, 255, 255, 0.12)" as const;

/** Paneles elevados dentro del sidebar (cuenta, soporte). */
export const ADMIN_SIDEBAR_ELEVATED = "rgba(255, 255, 255, 0.08)" as const;

/** Paneles suaves (cuenta, direcciones) — blanco, alineado al canvas. */
export const STORE_CHROME_BG = "#ffffff" as const;

/**
 * Logo Berea House (teal, fondo transparente) — legible en sidebar navy.
 */
export const ADMIN_BRAND_LOGO_ON_SIDEBAR_CLASS = "";

/**
 * Firma Berea sobre sidebar navy (logo teal / transparente).
 */
export const ADMIN_BEREA_SIGNATURE_ON_SIDEBAR_CLASS = "";

/** Tamaño del wordmark Berea House. */
export const ADMIN_BEREA_MARK_IMG_CLASS =
  "block h-8 w-auto max-w-[9.5rem] object-contain object-center sm:h-9 sm:max-w-[10.5rem]";

/** Logo producto Berea House en cabecera del sidebar. */
export const ADMIN_SIDEBAR_PRODUCT_LOGO_CLASS =
  "block h-auto w-full max-w-[6.75rem] object-contain object-center sm:max-w-[7.25rem]";
