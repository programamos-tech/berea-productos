import Link from "next/link";
import { Eye } from "lucide-react";
import { StaticCopCents } from "@/components/admin/ReportsAnimatedFigures";
import { orderCreditPendingToneClass } from "@/lib/order-credit";
import { supplierInvoiceStatusBadge, type SupplierInvoiceUiStatus } from "@/lib/supplier-invoices";

const thClass =
  "pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";

export type SupplierDebtRow = {
  id: string;
  supplierId: string;
  folio: string;
  supplierName: string;
  issueDate: string;
  totalCents: number;
  paidCents: number;
  pendingCents: number;
  uiStatus: SupplierInvoiceUiStatus;
};

function formatIssueDate(ymd: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return "—";
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

export function ProveedoresTable({ rows }: { rows: SupplierDebtRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-sm text-zinc-500 dark:text-zinc-400">
        No hay deudas que coincidan con los filtros.
      </p>
    );
  }

  return (
    <>
      <ul role="list" className="divide-y divide-zinc-100 xl:hidden dark:divide-zinc-800">
        {rows.map((row) => {
          const badge = supplierInvoiceStatusBadge(row.uiStatus);
          return (
            <li key={row.id} className="min-w-0">
              <Link
                href={`/admin/proveedores/${row.supplierId}/facturas/${row.id}`}
                prefetch={false}
                className="flex items-start justify-between gap-3 py-3 no-underline transition hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40"
                aria-label={`Ver deuda ${row.folio}, ${row.supplierName}`}
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {row.folio}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-zinc-800 dark:text-zinc-200">
                    {row.supplierName}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-500">{formatIssueDate(row.issueDate)}</p>
                  <p className="mt-1.5 text-xs">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                    <span className="mx-1.5 text-zinc-400">·</span>
                    <span className={`tabular-nums ${orderCreditPendingToneClass(row.uiStatus)}`}>
                      Pendiente <StaticCopCents cents={row.pendingCents} />
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
              <th className={thClass}>Folio</th>
              <th className={thClass}>Proveedor</th>
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
              const badge = supplierInvoiceStatusBadge(row.uiStatus);
              return (
                <tr key={row.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="py-3 pr-4 font-mono text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {row.folio}
                  </td>
                  <td className="max-w-[16rem] truncate py-3 pr-4 text-zinc-800 dark:text-zinc-200">
                    {row.supplierName}
                  </td>
                  <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-300">
                    {formatIssueDate(row.issueDate)}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-zinc-900 dark:text-zinc-50">
                    <StaticCopCents cents={row.totalCents} />
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                    <StaticCopCents cents={row.paidCents} />
                  </td>
                  <td
                    className={`py-3 pr-4 text-right tabular-nums ${orderCreditPendingToneClass(row.uiStatus)}`}
                  >
                    <StaticCopCents cents={row.pendingCents} />
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/admin/proveedores/${row.supplierId}/facturas/${row.id}`}
                      prefetch={false}
                      className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                      aria-label={`Ver deuda ${row.folio}`}
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
