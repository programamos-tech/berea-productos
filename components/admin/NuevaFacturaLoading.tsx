/** Skeleton mientras carga el formulario de nueva factura (POS). */
export function NuevaFacturaLoading() {
  return (
    <div
      className="flex flex-col gap-4 pb-8"
      role="status"
      aria-live="polite"
      aria-label="Cargando formulario de factura"
    >
      <span className="sr-only">Cargando formulario de factura…</span>
      <div className="space-y-2">
        <div className="h-3 w-40 animate-pulse rounded bg-zinc-200/70 dark:bg-zinc-800/80 motion-reduce:animate-none" />
        <div className="h-8 w-56 max-w-[70%] animate-pulse rounded-lg bg-zinc-200/80 dark:bg-zinc-800/90 motion-reduce:animate-none" />
        <div className="h-4 w-full max-w-md animate-pulse rounded-md bg-zinc-200/55 dark:bg-zinc-800/70 motion-reduce:animate-none" />
      </div>
      <div className="grid gap-6 border-t border-zinc-200/70 pt-4 dark:border-zinc-800 xl:grid-cols-[minmax(0,1fr)_minmax(28rem,32rem)] xl:gap-10">
        <div className="space-y-4">
          <div className="h-11 animate-pulse rounded-lg bg-zinc-100/80 dark:bg-zinc-900/50 motion-reduce:animate-none" />
          <div className="h-11 animate-pulse rounded-lg bg-zinc-100/80 dark:bg-zinc-900/50 motion-reduce:animate-none" />
          <div className="h-40 animate-pulse rounded-lg bg-zinc-100/50 dark:bg-zinc-900/40 motion-reduce:animate-none" />
        </div>
        <div className="space-y-4 border-t border-zinc-200/70 pt-4 dark:border-zinc-800 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0">
          <div className="h-24 animate-pulse rounded-lg bg-zinc-100/60 dark:bg-zinc-900/40 motion-reduce:animate-none" />
          <div className="h-20 animate-pulse rounded-lg bg-zinc-100/50 dark:bg-zinc-900/35 motion-reduce:animate-none" />
          <div className="h-28 animate-pulse rounded-lg bg-zinc-100/50 dark:bg-zinc-900/35 motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
}
