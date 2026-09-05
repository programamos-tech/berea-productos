/** Texto negativo de caja (faltante / contado bajo): coral de marca, no red-* genérico. */
export const adminCashNegativeTextClass =
  "text-[var(--admin-coral-deep)] dark:text-[var(--admin-coral)]";

/** Texto OK / positivo: verde suave, no neón. */
export const adminCashOkTextClass =
  "text-[#5a7a62] dark:text-emerald-400/90";

/** Paneles del backoffice: borde zinc neutro. */
export const adminPanelClass =
  "rounded-xl border border-zinc-200 bg-white shadow-sm ring-1 ring-zinc-950/[0.04] dark:border-zinc-700/80 dark:bg-zinc-900 dark:ring-white/[0.06]";

/** Variante más redondeada (detalle cliente, ficha producto). */
export const adminPanelLgClass =
  "rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900";

/** Contenedor de tabla con borde (listas densas). */
export const adminTableWrapClass =
  "overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] dark:border-zinc-700/80 dark:bg-zinc-900 dark:shadow-[0_1px_0_0_rgb(0_0_0/0.35)]";

/** Tarjeta responsive (p. ej. listado de productos en vista móvil/tablet). */
export const adminProductCardClass =
  "flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-4 shadow-sm ring-1 ring-zinc-950/[0.04] transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-700/90 dark:bg-zinc-900 dark:ring-white/[0.06] dark:hover:border-zinc-600 dark:hover:shadow-lg";

/** Cancelar / secundario en modales y barras. */
export const adminButtonCancelClass =
  "rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:shadow-none dark:hover:bg-zinc-700";

/** Acción secundaria ancha (p. ej. Imprimir, Actualizar lista). */
export const adminButtonToolbarOutlineClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:shadow-none dark:hover:border-zinc-600 dark:hover:bg-zinc-800 sm:w-auto";

/** Título de páginas de listado admin (Reportes, Caja, Ventas, etc.). */
export const adminPageTitleClass =
  "text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100";

/** Subtítulo bajo el título de listado. */
export const adminPageSubtitleClass =
  "mt-1 text-sm leading-normal text-zinc-500";

/** Label de filtros de listados (misma escala que headers densos). */
export const adminFilterLabelClass =
  "mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";

/**
 * Input/select de filtros — misma altura que botones de toolbar y selector de tienda (~40px).
 */
export const adminFilterInputClass =
  "box-border h-10 w-full min-w-0 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300/50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-600/40";

/** Base de botones de cabecera de listados (Ventas, Productos, etc.). */
export const adminToolbarBtnBaseClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition";

export const adminToolbarBtnPrimaryClass =
  "border-[var(--admin-coral)] bg-[var(--admin-coral)] text-white hover:border-[var(--admin-coral-hover)] hover:bg-[var(--admin-coral-hover)]";

/** Segmented / vista activa — zinc, no pastilla coral. */
export const adminToolbarBtnActiveClass =
  "border-zinc-900 bg-zinc-900 text-white hover:border-zinc-800 hover:bg-zinc-800 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:border-white dark:hover:bg-white";

export const adminToolbarBtnIdleClass =
  "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800";

/** Botón ícono (refresh) — mismo alto que inputs y CTA. */
export const adminToolbarIconBtnClass =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800";
