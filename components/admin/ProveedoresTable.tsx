import Link from "next/link";
import { Eye } from "lucide-react";
import { StaticCopCents } from "@/components/admin/ReportsAnimatedFigures";
import { ventaCreditoToneClass } from "@/lib/ventas-sales";

const thClass =
  "pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";

export type SupplierDirectoryRow = {
  id: string;
  name: string;
  documentId: string | null;
  phone: string | null;
  orderCount: number;
  pendingCents: number;
};

export function ProveedoresTable({ rows }: { rows: SupplierDirectoryRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-sm text-zinc-500 dark:text-zinc-400">
        No hay proveedores que coincidan con los filtros.
      </p>
    );
  }

  return (
    <>
      <ul role="list" className="divide-y divide-zinc-100 xl:hidden dark:divide-zinc-800">
        {rows.map((row) => (
          <li key={row.id} className="min-w-0">
            <Link
              href={`/admin/proveedores/${row.id}`}
              prefetch={false}
              className="flex items-start justify-between gap-3 py-3 no-underline transition hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40"
              aria-label={`Ver proveedor ${row.name}`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {row.name}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {row.documentId ? `NIT ${row.documentId}` : "Sin NIT"}
                  {row.phone ? ` · ${row.phone}` : ""}
                </p>
                <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                  {row.orderCount === 0
                    ? "Sin órdenes"
                    : `${row.orderCount} ${row.orderCount === 1 ? "orden" : "órdenes"}`}
                  <span className="mx-1.5 text-zinc-400">·</span>
                  <span className={`tabular-nums ${row.pendingCents > 0 ? ventaCreditoToneClass : ""}`}>
                    Por pagar <StaticCopCents cents={row.pendingCents} />
                  </span>
                </p>
              </div>
              <span
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400"
                aria-hidden
              >
                <Eye className="size-4" strokeWidth={2} />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden min-w-0 overflow-x-auto xl:block">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr>
              <th className={thClass}>Proveedor</th>
              <th className={thClass}>NIT</th>
              <th className={thClass}>Teléfono</th>
              <th className={`${thClass} text-right`}>Órdenes</th>
              <th className={`${thClass} text-right`}>Por pagar</th>
              <th className={`${thClass} pr-0 text-right`}> </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="max-w-[18rem] truncate py-3 pr-4 font-medium text-zinc-900 dark:text-zinc-100">
                  {row.name}
                </td>
                <td className="py-3 pr-4 tabular-nums text-zinc-600 dark:text-zinc-300">
                  {row.documentId || "—"}
                </td>
                <td className="py-3 pr-4 tabular-nums text-zinc-600 dark:text-zinc-300">
                  {row.phone || "—"}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                  {row.orderCount}
                </td>
                <td
                  className={`py-3 pr-4 text-right tabular-nums ${
                    row.pendingCents > 0 ? ventaCreditoToneClass : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <StaticCopCents cents={row.pendingCents} />
                </td>
                <td className="py-3 text-right">
                  <Link
                    href={`/admin/proveedores/${row.id}`}
                    prefetch={false}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    aria-label={`Ver proveedor ${row.name}`}
                  >
                    <Eye className="size-4" strokeWidth={2} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
