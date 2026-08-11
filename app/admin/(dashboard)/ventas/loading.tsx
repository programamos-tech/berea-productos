import { adminPanelClass } from "@/lib/admin-ui";

/** Loading de ruta: evita pantalla negra al navegar a Ventas. */
export default function AdminVentasLoading() {
  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="h-8 w-40 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-zinc-200/80 dark:bg-zinc-800/80" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-10 w-36 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>

      <div className={`${adminPanelClass} overflow-hidden`}>
        <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Cargando ventas…
          </p>
        </div>
        <div className="space-y-0 divide-y divide-zinc-100 dark:divide-zinc-800">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex animate-pulse items-center gap-4 px-4 py-4 motion-reduce:animate-none sm:px-5"
            >
              <div className="h-4 w-24 rounded bg-zinc-200/80 dark:bg-zinc-700" />
              <div className="h-4 max-w-xs flex-1 rounded bg-zinc-200/60 dark:bg-zinc-700/80" />
              <div className="h-4 w-20 rounded bg-zinc-200/80 dark:bg-zinc-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
