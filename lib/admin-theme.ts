/**
 * Tema del backoffice — acento Berea House (#0197b2), chrome en neutros.
 *
 * Brand teal:  #0197b2
 * Sidebar: charcoal near-black (Liaco-style dark rail + light content)
 * Active nav: horizontal brand-blue gradient
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
 * Fondo del sidebar (`--admin-sidebar-bg`): charcoal / near-black.
 * Siempre oscuro (rail tipo Liaco); el contenido principal sigue en blanco.
 */
export const ADMIN_SIDEBAR_BG = "#141416" as const;

/** Sidebar en modo oscuro admin: zinc-950, alineado al canvas Berea House. */
export const ADMIN_SIDEBAR_BG_DARK = "#09090b" as const;

/** Gradiente horizontal del ítem activo del nav (marca Berea blue). */
export const ADMIN_SIDEBAR_NAV_ACTIVE_FROM = ADMIN_CORAL;
export const ADMIN_SIDEBAR_NAV_ACTIVE_TO = ADMIN_CORAL_DEEP;

/** Texto / iconos inactivos del sidebar. */
export const ADMIN_SIDEBAR_NAV_MUTED = "#9ca3af" as const;

/** Etiquetas de sección (small caps). */
export const ADMIN_SIDEBAR_SECTION = "#6b7280" as const;

/** Bordes sutiles sobre charcoal. */
export const ADMIN_SIDEBAR_BORDER = "rgba(255, 255, 255, 0.08)" as const;

/** Paneles elevados dentro del sidebar (cuenta, soporte). */
export const ADMIN_SIDEBAR_ELEVATED = "rgba(255, 255, 255, 0.06)" as const;

/** Paneles suaves (cuenta, direcciones) — blanco, alineado al canvas. */
export const STORE_CHROME_BG = "#ffffff" as const;

/**
 * Logo Berea House (teal, fondo transparente) — legible en sidebar oscuro.
 */
export const ADMIN_BRAND_LOGO_ON_SIDEBAR_CLASS = "";

/**
 * Firma Berea sobre sidebar oscuro (logo teal / transparente, sin invert).
 */
export const ADMIN_BEREA_SIGNATURE_ON_SIDEBAR_CLASS = "";

/** Tamaño del wordmark Berea House. */
export const ADMIN_BEREA_MARK_IMG_CLASS =
  "block h-8 w-auto max-w-[9.5rem] object-contain object-center sm:h-9 sm:max-w-[10.5rem]";

/** Logo producto Berea House en cabecera del sidebar. */
export const ADMIN_SIDEBAR_PRODUCT_LOGO_CLASS =
  "block h-auto w-full max-w-[6.75rem] object-contain object-center sm:max-w-[7.25rem]";
