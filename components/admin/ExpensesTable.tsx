"use client";

import Link from "next/link";
import {
  ArrowLeftRight,
  Banknote,
  CreditCard,
  Eye,
  Layers,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ExpenseCancelButton } from "@/components/admin/ExpenseCancelButton";
import { StaticCopCents } from "@/components/admin/ReportsAnimatedFigures";
import {
  expenseKindLabel,
  expensePaymentMethodLabel,
  expenseScopeLabel,
  type ExpenseKind,
  type ExpenseScope,
} from "@/lib/expenses-constants";
import { formatStoreVentaFecha } from "@/lib/store-datetime-format";
import { ventaNumeroReferencia } from "@/lib/ventas-sales";

export type ExpenseTableRow = {
  id: string;
  concept: string;
  amount_cents: number;
  payment_method: string | null;
  notes: string | null;
  expense_date: string | null;
  created_at: string | null;
  is_cancelled: boolean;
  expense_kind: ExpenseKind;
  expense_scope: ExpenseScope;
  supplierLink: {
    supplierId: string;
    invoiceId: string;
    folio: string | null;
  } | null;
};

const thClass =
  "pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";

function expensePagoTone(raw: string | null | undefined): {
  label: string;
  className: string;
  Icon: LucideIcon;
} {
  const key = String(raw ?? "").trim().toLowerCase();
  const label = expensePaymentMethodLabel(raw);
  switch (key) {
    case "efectivo":
    case "cash":
      return {
        label,
        className: "font-semibold text-amber-700 dark:text-amber-300",
        Icon: Banknote,
      };
    case "efectivo_acumulado":
      return {
        label,
        className: "font-semibold text-amber-700 dark:text-amber-300",
        Icon: Wallet,
      };
    case "transferencia":
      return {
        label,
        className: "font-semibold text-sky-700 dark:text-sky-300",
        Icon: ArrowLeftRight,
      };
    case "tarjeta":
      return {
        label,
        className: "font-semibold text-violet-700 dark:text-violet-300",
        Icon: CreditCard,
      };
    case "otro":
      return {
        label,
        className: "font-semibold text-zinc-700 dark:text-zinc-300",
        Icon: Layers,
      };
    default:
      return {
        label,
        className: "font-semibold text-zinc-700 dark:text-zinc-300",
        Icon: Layers,
      };
  }
}

function scopeToneClass(scope: ExpenseScope): string {
  return scope === "mensual"
    ? "font-semibold text-violet-700 dark:text-violet-300"
    : "font-semibold text-emerald-700 dark:text-emerald-400";
}

function kindToneClass(kind: ExpenseKind): string {
  return kind === "egreso"
    ? "text-amber-700 dark:text-amber-300"
    : "text-sky-700 dark:text-sky-300";
}

function expenseFecha(row: ExpenseTableRow): string {
  if (row.created_at) return formatStoreVentaFecha(row.created_at);
  if (row.expense_date) {
    // Solo día calendario (sin hora).
    const iso = /^\d{4}-\d{2}-\d{2}$/.test(row.expense_date.trim())
      ? `${row.expense_date.trim()}T12:00:00`
      : row.expense_date;
    return formatStoreVentaFecha(iso);
  }
  return "—";
}

export function ExpensesTable({
  rows,
  canCancel,
  emptyMessage = "No hay registros que coincidan con los filtros.",
}: {
  rows: ExpenseTableRow[];
  canCancel: boolean;
  emptyMessage?: string;
}) {
  const router = useRouter();

  if (rows.length === 0) {
    return (
      <p className="py-8 text-sm text-zinc-500 dark:text-zinc-400">
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      {/* Móvil */}
      <ul
        role="list"
        className="divide-y divide-zinc-100 xl:hidden dark:divide-zinc-800"
      >
        {rows.map((row) => {
          const ref = ventaNumeroReferencia(row.id);
          const href = `/admin/egresos/${row.id}`;
          const pago = expensePagoTone(row.payment_method);
          const PagoIcon = pago.Icon;
          return (
            <li
              key={row.id}
              className={`flex min-w-0 items-start gap-2 ${
                row.is_cancelled ? "opacity-70" : ""
              }`}
            >
              <Link
                href={href}
                className="min-w-0 flex-1 py-3 no-underline transition hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <PagoIcon
                        className="size-4 shrink-0 text-zinc-400 dark:text-zinc-500"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                      <span className="font-mono text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                        {ref}
                      </span>
                    </div>
                    <p
                      className={`mt-0.5 truncate text-sm text-zinc-800 dark:text-zinc-200 ${
                        row.is_cancelled
                          ? "line-through decoration-zinc-400"
                          : ""
                      }`}
                    >
                      {row.concept || "Gasto"}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      {expenseFecha(row)}
                      <span className="mx-1.5 text-zinc-400">·</span>
                      <span className={scopeToneClass(row.expense_scope)}>
                        {expenseScopeLabel(row.expense_scope)}
                      </span>
                      <span className="mx-1.5 text-zinc-400">·</span>
                      <span className={kindToneClass(row.expense_kind)}>
                        {expenseKindLabel(row.expense_kind)}
                      </span>
                    </p>
                    {row.notes?.trim() ? (
                      <p className="mt-1 line-clamp-1 text-[11px] text-zinc-500">
                        {row.notes.trim()}
                      </p>
                    ) : null}
                  </div>
                  <p
                    className={`shrink-0 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50 ${
                      row.is_cancelled ? "line-through decoration-zinc-400" : ""
                    }`}
                  >
                    <StaticCopCents cents={row.amount_cents} />
                  </p>
                </div>
              </Link>
              <div className="flex shrink-0 items-center gap-0.5 py-2.5">
                <Link
                  href={href}
                  className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  aria-label={`Ver detalle ${ref}`}
                  title="Ver"
                >
                  <Eye className="size-4" strokeWidth={2} aria-hidden />
                </Link>
                {canCancel && !row.is_cancelled ? (
                  <ExpenseCancelButton
                    expenseId={row.id}
                    conceptLabel={row.concept || "Gasto"}
                    isCancelled={row.is_cancelled}
                    canCancel={canCancel}
                    variant="icon"
                  />
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Desktop */}
      <div className="hidden min-w-0 overflow-x-auto xl:block">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200/70 dark:border-zinc-800">
              <th className={thClass}>ID</th>
              <th className={`${thClass} text-right`}>Monto</th>
              <th className={thClass}>Concepto</th>
              <th className={thClass}>Pago</th>
              <th className={thClass}>Tipo</th>
              <th className={thClass}>Nota</th>
              <th className={thClass}>Fecha</th>
              <th className={`${thClass} w-20 pr-0 text-right`} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const ref = ventaNumeroReferencia(row.id);
              const href = `/admin/egresos/${row.id}`;
              const pago = expensePagoTone(row.payment_method);
              const PagoIcon = pago.Icon;
              return (
                <tr
                  key={row.id}
                  tabIndex={0}
                  aria-label={`Ver gasto ${ref}, ${row.concept}`}
                  className={`cursor-pointer border-b border-zinc-100/80 last:border-0 transition hover:bg-zinc-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:border-zinc-800/80 dark:hover:bg-zinc-900/40 ${
                    row.is_cancelled ? "opacity-70" : ""
                  }`}
                  onClick={() => router.push(href)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(href);
                    }
                  }}
                >
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <PagoIcon
                        className="size-4 shrink-0 text-zinc-400 dark:text-zinc-500"
                        strokeWidth={2.25}
                        aria-label={pago.label}
                      />
                      <span className="font-mono text-xs font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                        {ref}
                      </span>
                    </div>
                  </td>
                  <td
                    className={`whitespace-nowrap py-2.5 pr-4 text-right tabular-nums font-medium text-zinc-900 dark:text-zinc-50 ${
                      row.is_cancelled ? "line-through decoration-zinc-400" : ""
                    }`}
                  >
                    <StaticCopCents cents={row.amount_cents} />
                  </td>
                  <td className="max-w-[14rem] py-2.5 pr-4">
                    <p
                      className={`truncate text-zinc-900 dark:text-zinc-100 ${
                        row.is_cancelled
                          ? "line-through decoration-zinc-400"
                          : ""
                      }`}
                    >
                      {row.concept || "Gasto"}
                    </p>
                    {row.supplierLink ? (
                      <Link
                        href={`/admin/proveedores/${row.supplierLink.supplierId}/facturas/${row.supplierLink.invoiceId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5 block truncate text-[11px] font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-300"
                      >
                        Proveedor
                        {row.supplierLink.folio
                          ? ` · ${row.supplierLink.folio}`
                          : ""}
                      </Link>
                    ) : null}
                    {row.is_cancelled ? (
                      <span className="mt-0.5 block text-[11px] font-medium text-red-600 dark:text-red-400">
                        Anulado
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs ${pago.className}`}
                    >
                      <PagoIcon
                        className="size-3.5 shrink-0 text-zinc-400 dark:text-zinc-500"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                      {pago.label}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-xs">
                    <span className={scopeToneClass(row.expense_scope)}>
                      {expenseScopeLabel(row.expense_scope)}
                    </span>
                    <span className="mx-1 text-zinc-300 dark:text-zinc-600">
                      ·
                    </span>
                    <span className={kindToneClass(row.expense_kind)}>
                      {expenseKindLabel(row.expense_kind)}
                    </span>
                  </td>
                  <td className="max-w-[12rem] truncate py-2.5 pr-4 text-xs text-zinc-500 dark:text-zinc-400">
                    {row.notes?.trim() || "—"}
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-4 text-zinc-600 dark:text-zinc-400">
                    {expenseFecha(row)}
                  </td>
                  <td className="py-2.5 text-right">
                    <div
                      className="flex justify-end gap-0.5"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <Link
                        href={href}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                        aria-label={`Ver detalle ${ref}`}
                        title="Ver"
                      >
                        <Eye className="size-4" strokeWidth={2} aria-hidden />
                      </Link>
                      {canCancel && !row.is_cancelled ? (
                        <ExpenseCancelButton
                          expenseId={row.id}
                          conceptLabel={row.concept || "Gasto"}
                          isCancelled={row.is_cancelled}
                          canCancel={canCancel}
                          variant="icon"
                        />
                      ) : null}
                    </div>
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
