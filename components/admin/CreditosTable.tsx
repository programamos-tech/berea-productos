import Link from "next/link";
import { Eye } from "lucide-react";
import { StaticCopCents } from "@/components/admin/ReportsAnimatedFigures";
import type { CreditListRow } from "@/lib/admin-order-credits";
import {
  orderCreditPendingToneClass,
  orderCreditUiStatusBadge,
} from "@/lib/order-credit";
import { formatVentaFecha, ventaNumeroReferencia } from "@/lib/ventas-sales";

const thClass =
  "pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";

export function CreditosTable({ rows }: { rows: CreditListRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-sm text-zinc-500 dark:text-zinc-400">
        No hay créditos que coincidan con los filtros.
      </p>
    );
  }

  return (
    <>
      <ul
        role="list"
        className="divide-y divide-zinc-100 xl:hidden dark:divide-zinc-800"
      >
        {rows.map((row) => {
          const ref = ventaNumeroReferencia(row.id);
          const badge = orderCreditUiStatusBadge(row.uiStatus);
          return (
            <li key={row.id} className="min-w-0">
              <Link
                href={`/admin/creditos/${row.id}`}
                className="flex items-start justify-between gap-3 py-3 no-underline transition hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40"
                aria-label={`Ver crédito ${ref}, ${row.customerName}`}
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {ref}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-zinc-800 dark:text-zinc-200">
                    {row.customerName}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {formatVentaFecha(row.createdAt)}
                  </p>
                  <p className="mt-1.5 text-xs">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                    <span className="mx-1.5 text-zinc-400">·</span>
                    <span className={`tabular-nums ${orderCreditPendingToneClass(row.uiStatus)}`}>
                      Pendiente{" "}
                      <StaticCopCents cents={row.pendingCents} />
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <p className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                    <StaticCopCents cents={row.totalCents} />
                  </p>
                  <span
                    className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400"
                    aria-hidden
                  >
                    <Eye className="size-4" strokeWidth={2} />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="hidden min-w-0 overflow-x-auto xl:block">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr>
              <th className={thClass}>Factura</th>
              <th className={thClass}>Cliente</th>
              <th className={thClass}>Fecha</th>
              <th className={`${thClass} text-right`}>Total</th>
              <th className={`${thClass} text-right`}>Pagado</th>
              <th className={`${thClass} text-right`}>Pendiente</th>
              <th className={thClass}>Estado</th>
              <th className={`${thClass} pr-0 text-right`}> </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const ref = ventaNumeroReferencia(row.id);
              const badge = orderCreditUiStatusBadge(row.uiStatus);
              return (
                <tr
                  key={row.id}
                  className="border-t border-zinc-100 dark:border-zinc-800"
                >
                  <td className="py-2.5 pr-4 font-mono text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {ref}
                  </td>
                  <td className="py-2.5 pr-4 text-zinc-800 dark:text-zinc-200">
                    {row.customerName}
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-4 text-zinc-600 dark:text-zinc-300">
                    {formatVentaFecha(row.createdAt)}
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-zinc-900 dark:text-zinc-100">
                    <StaticCopCents cents={row.totalCents} />
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-zinc-600 dark:text-zinc-300">
                    <StaticCopCents cents={row.paidCents} />
                  </td>
                  <td
                    className={`py-2.5 pr-4 text-right ${orderCreditPendingToneClass(row.uiStatus)}`}
                  >
                    <StaticCopCents cents={row.pendingCents} />
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="py-2.5 pr-0 text-right">
                    <Link
                      href={`/admin/creditos/${row.id}`}
                      className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                      aria-label={`Ver crédito ${ref}`}
                    >
                      <Eye className="size-4" strokeWidth={2} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
