import Link from "next/link";
import { formatCop } from "@/lib/money";
import type {
  ReportTopClient,
  ReportTopProduct,
} from "@/lib/admin-report-tops";

const labelClass =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-500";

function RankBadge({ n }: { n: number }) {
  return (
    <span
      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold tabular-nums ${
        n === 1
          ? "bg-[var(--admin-coral)] text-white"
          : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
      }`}
    >
      {n}
    </span>
  );
}

export function ReportTopsCards({
  clients,
  products,
  periodHint,
}: {
  clients: ReportTopClient[];
  products: ReportTopProduct[];
  periodHint: string;
}) {
  return (
    <div className="grid min-h-0 grid-cols-1 gap-3 sm:grid-cols-2">
      <section className="reports-chart-reveal flex min-h-0 flex-col">
        <div className="shrink-0">
          <h2 className={labelClass}>Clientes top</h2>
          <p className="mt-0.5 text-[11px] text-zinc-500">{periodHint}</p>
        </div>
        {clients.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">Sin ventas en este periodo.</p>
        ) : (
          <ol className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {clients.map((c, i) => {
              const body = (
                <>
                  <RankBadge n={i + 1} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {c.name}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-zinc-500">
                      <span className="tabular-nums">{c.orderCount}</span> venta
                      {c.orderCount === 1 ? "" : "s"}
                      {" · "}
                      <span className="tabular-nums font-medium text-zinc-700 dark:text-zinc-300">
                        {formatCop(c.totalCents)}
                      </span>
                    </span>
                  </span>
                </>
              );
              return (
                <li key={c.key}>
                  {c.customerId ? (
                    <Link
                      href={`/admin/customers/${c.customerId}`}
                      className="flex items-start gap-2.5 rounded-xl px-1 py-1.5 transition hover:bg-zinc-100/80 dark:hover:bg-zinc-900/60"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="flex items-start gap-2.5 px-1 py-1.5">{body}</div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="reports-chart-reveal flex min-h-0 flex-col">
        <div className="shrink-0">
          <h2 className={labelClass}>Productos top</h2>
          <p className="mt-0.5 text-[11px] text-zinc-500">{periodHint}</p>
        </div>
        {products.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">Sin productos vendidos aún.</p>
        ) : (
          <ol className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {products.map((p, i) => {
              const body = (
                <>
                  <RankBadge n={i + 1} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {p.name}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-zinc-500">
                      <span className="tabular-nums">{p.quantity}</span> u.
                      {" · "}
                      <span className="tabular-nums font-medium text-zinc-700 dark:text-zinc-300">
                        {formatCop(p.totalCents)}
                      </span>
                    </span>
                  </span>
                </>
              );
              return (
                <li key={p.key}>
                  {p.productId ? (
                    <Link
                      href={`/admin/products/${p.productId}`}
                      className="flex items-start gap-2.5 rounded-xl px-1 py-1.5 transition hover:bg-zinc-100/80 dark:hover:bg-zinc-900/60"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="flex items-start gap-2.5 px-1 py-1.5">{body}</div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

export function ReportTopsCardsSkeleton() {
  return (
    <div className="grid min-h-0 grid-cols-1 gap-3 sm:grid-cols-2" role="status">
      <div className="h-40 animate-pulse rounded-xl bg-zinc-100/40 dark:bg-zinc-900/40" />
      <div className="h-40 animate-pulse rounded-xl bg-zinc-100/40 dark:bg-zinc-900/40" />
      <span className="sr-only">Cargando tops…</span>
    </div>
  );
}
