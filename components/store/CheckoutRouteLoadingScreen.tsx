import { storeBrand } from "@/lib/brand";

/**
 * Pantalla a viewport completo (cubre navbar/footer) mientras carga /checkout.
 * Usar en loading.tsx y como fallback de Suspense.
 */
export function CheckoutRouteLoadingScreen({
  message = "Llevándote a finalizar tu compra…",
  footnote = "Estamos armando tu checkout; un segundo y listo.",
}: {
  message?: string;
  footnote?: string;
}) {
  return (
    <div
      data-checkout-loading
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#fff8fb] px-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative w-full max-w-sm text-center">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--store-accent)]/10 blur-2xl"
          aria-hidden
        />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--store-brand)]">
            {storeBrand}
          </p>
          <div className="mx-auto mt-8 flex size-14 items-center justify-center">
            <span
              className="size-11 animate-spin rounded-full border-[3px] border-[var(--store-accent)]/25 border-t-[var(--store-accent)]"
              aria-hidden
            />
          </div>
          <p className="mt-8 min-h-[3.25rem] text-base font-medium leading-snug text-stone-800">
            {message}
          </p>
          {footnote ? (
            <p className="mt-3 text-[12px] leading-relaxed text-stone-500">
              {footnote}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
