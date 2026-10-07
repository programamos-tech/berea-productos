/**
 * Calidad del optimizador `next/image` en la vitrina.
 * Tiene que existir en `images.qualities` de next.config; si no, Next la baja a 75.
 */
export const STORE_IMAGE_QUALITY = 90;

/** PDP: más calidad — aquí el blur se nota (y hay zoom al hover). */
export const STORE_PRODUCT_DETAIL_IMAGE_QUALITY = 95;

/** Banners hero / catálogo. */
export const STORE_BANNER_IMAGE_QUALITY = 90;

/**
 * Tarjetas: 2 columnas hasta lg, 3 hasta xl, 4 en adelante.
 * El viewport tiene que coincidir con la columna real; si no, retina pide una foto chica y se ve blanda.
 */
export const STORE_PRODUCT_CARD_IMAGE_SIZES =
  "(max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw";

/**
 * PDP: mitad del layout en desktop (50vw), full en móvil.
 * Evita el tope fijo 720px que pedía demasiado poco en Full HD/retina.
 */
export const STORE_PRODUCT_DETAIL_IMAGE_SIZES =
  "(max-width: 1024px) 100vw, 50vw";

/** Hero home / banner catálogo. */
export const STORE_BANNER_IMAGE_SIZES =
  "(max-width: 768px) 100vw, (max-width: 1280px) 1400px, 1600px";

/** Primeras N cards con priority (LCP). */
export const STORE_CARD_PRIORITY_COUNT = 4;
