/**
 * Paleta Coral — base de marca (ya no rosa).
 * Mono: #ED7464 · #A65046 · #FFDEDA · #FFBDB5
 * Expuestos en `body` como `--store-accent`, `--store-brand`, etc. (ver `app/layout.tsx`).
 */
export const STORE_CORAL = "#ED7464" as const;
export const STORE_CORAL_DEEP = "#A65046" as const;
export const STORE_CORAL_SOFT = "#FFBDB5" as const;
export const STORE_CORAL_MIST = "#FFDEDA" as const;

export const STORE_BRAND = STORE_CORAL;
/** Hover un tono más profundo hacia terracota. */
export const STORE_BRAND_HOVER = "#D96558" as const;

export const STORE_ACCENT = STORE_BRAND;
export const STORE_ACCENT_HOVER = STORE_BRAND_HOVER;

export const STORE_HEADER_BG = STORE_BRAND;
export const STORE_HEADER_FG = "#ffffff" as const;

/** Contenedor ancho completo de la vitrina (sin max-width). */
export const storeShellClass = "w-full min-w-0 px-3 sm:px-4 md:px-5 lg:px-6";

/** Margen horizontal negativo para carruseles al borde del shell. */
export const storeShellBleedXClass = "-mx-3 sm:-mx-4 md:-mx-5 lg:-mx-6";

/** Franja superior de avisos (marquee). */
export const STORE_ANNOUNCEMENT_BG = STORE_CORAL_MIST;

/** Fondo del pozo de imagen en tarjetas (gris muy claro). */
export const STORE_IMAGE_WELL = "#ebebeb" as const;
/** Variante coral suave para columnas editoriales. */
export const STORE_IMAGE_WELL_TINT = STORE_CORAL_MIST;

/** Marco 4:5 compartido en tarjetas de producto (catálogo, destacados, sugeridos). */
export const storeProductImageFrameClass =
  "relative aspect-[4/5] w-full shrink-0 overflow-hidden";

/** Imagen dentro del marco: llena el 4:5 de borde a borde (sin bandas ni padding). */
export const storeProductImageMediaClass =
  "object-cover object-center";
