"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import type { AdminActivityLogRow } from "@/lib/admin-activity-log";
import { actionTypeLabel } from "@/lib/admin-activity-log";
import { getActivityDetailRows } from "@/lib/activity-log-details";

function entityLink(row: AdminActivityLogRow): { href: string; label: string } | null {
  if (!row.entity_id) return null;
  const id = row.entity_id;
  switch (row.entity_type) {
    case "customer":
      return { href: `/admin/customers/${id}`, label: "Cliente" };
    case "product":
      return { href: `/admin/products/${id}/edit`, label: "Producto" };
    case "order":
      return { href: `/admin/orders/${id}`, label: "Factura" };
    case "cash_session":
      return { href: `/admin/caja/${id}`, label: "Caja" };
    default:
      return null;
  }
}

const thClass =
  "pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";

export type RegistrosTableRow = {
  row: AdminActivityLogRow;
  actorDisplay: string;
  whenLabel: string;
};

export function RegistrosActivityTable({ rows }: { rows: RegistrosTableRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-sm text-zinc-500 dark:text-zinc-400">
        Todavía no hay registros.
      </p>
    );
  }

  return (
    <>
      <ul
        role="list"
        className="divide-y divide-zinc-100 xl:hidden dark:divide-zinc-800"
      >
        {rows.map(({ row, actorDisplay, whenLabel }) => {
          const link = entityLink(row);
          const details = getActivityDetailRows(row.action_type, row.metadata);
          const detailLine =
            details.length > 0
              ? details.map((d) => `${d.label}: ${d.value}`).join(" · ")
              : null;

          const body = (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  {actionTypeLabel(row.action_type)}
                </p>
                <p className="mt-0.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {row.summary}
                </p>
                {detailLine ? (
                  <p className="mt-1 line-clamp-2 text-[11px] text-zinc-500">
                    {detailLine}
                  </p>
                ) : null}
                <p className="mt-1.5 text-xs text-zinc-500">
                  {whenLabel}
                  <span className="mx-1.5 text-zinc-300">·</span>
                  {actorDisplay}
                </p>
              </div>
              {link ? (
                <span
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-500"
                  aria-hidden
                >
                  <Eye className="size-4" strokeWidth={2} />
                </span>
              ) : null}
            </>
          );

          return (
            <li key={row.id} className="min-w-0">
              {link ? (
                <Link
                  href={link.href}
                  className="flex items-start justify-between gap-3 py-3 no-underline transition hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40"
                  aria-label={`${link.label}: ${row.summary}`}
                >
                  {body}
                </Link>
              ) : (
                <div className="flex items-start justify-between gap-3 py-3">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="hidden min-w-0 overflow-x-auto xl:block">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200/70 dark:border-zinc-800">
              <th className={thClass}>Fecha</th>
              <th className={thClass}>Acción</th>
              <th className={thClass}>Detalle</th>
              <th className={thClass}>Quién</th>
              <th className={`${thClass} w-10 pr-0`} />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ row, actorDisplay, whenLabel }) => {
              const link = entityLink(row);
              const details = getActivityDetailRows(row.action_type, row.metadata);
              const detailLine =
                details.length > 0
                  ? details.map((d) => `${d.label}: ${d.value}`).join(" · ")
                  : null;

              return (
                <tr
                  key={row.id}
                  className="border-b border-zinc-100/80 last:border-0 dark:border-zinc-800/80"
                >
                  <td className="whitespace-nowrap py-2.5 pr-4 tabular-nums text-zinc-600 dark:text-zinc-400">
                    {whenLabel}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      {actionTypeLabel(row.action_type)}
                    </span>
                  </td>
                  <td className="max-w-[22rem] py-2.5 pr-4">
                    <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                      {row.summary}
                    </p>
                    {detailLine ? (
                      <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                        {detailLine}
                      </p>
                    ) : null}
                  </td>
                  <td className="max-w-[10rem] truncate py-2.5 pr-4 text-zinc-700 dark:text-zinc-300">
                    {actorDisplay}
                  </td>
                  <td className="py-2.5 text-right">
                    {link ? (
                      <Link
                        href={link.href}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                        aria-label={`Abrir ${link.label}`}
                        title={link.label}
                      >
                        <Eye className="size-4" strokeWidth={2} />
                      </Link>
                    ) : (
                      <span className="inline-block size-8" aria-hidden />
                    )}
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
