/** Loading de ruta: evita pantalla negra al navegar a Ventas. */
export default function AdminVentasLoading() {
  return (
    <div className="flex w-full min-w-0 max-w-none flex-col gap-4">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="h-7 w-28 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-2 h-3 w-40 max-w-full animate-pulse rounded bg-zinc-200/80 dark:bg-zinc-800/80" />
        </div>
        <div className="flex gap-2">
          <div className="size-8 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-8 w-28 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </header>

      <div className="h-16 animate-pulse rounded-lg bg-zinc-100/80 dark:bg-zinc-800/60" />

      <section className="border-t border-zinc-200/70 pt-4 dark:border-zinc-800">
        <p className="mb-3 text-sm text-zinc-500">Cargando ventas…</p>
        <div className="space-y-0 divide-y divide-zinc-100 dark:divide-zinc-800">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex animate-pulse items-center gap-4 py-3 motion-reduce:animate-none"
            >
              <div className="h-4 w-24 rounded bg-zinc-200/80 dark:bg-zinc-700" />
              <div className="h-4 max-w-xs flex-1 rounded bg-zinc-200/60 dark:bg-zinc-700/80" />
              <div className="h-4 w-20 rounded bg-zinc-200/80 dark:bg-zinc-700" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
