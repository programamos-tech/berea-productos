"use client";

import { useEffect, useId, useState } from "react";
import { Info, X } from "lucide-react";
import { StaticCopCents } from "@/components/admin/ReportsAnimatedFigures";
import { formatCop } from "@/lib/money";
import { prettyReportDayShortLabel } from "@/lib/admin-report-range";
import type { ReportExpenseDetailLine } from "@/components/admin/ReportLiquidityMetricCards";
import Link from "next/link";

export function ReportEgresosPanel({
  periodLabel,
  egresosPeriod,
  cantidad,
  lines,
  saldoNetoCaja,
  showSaldo,
}: {
  periodLabel: string;
  egresosPeriod: number;
  cantidad: number;
  lines: ReportExpenseDetailLine[];
  saldoNetoCaja?: number;
  showSaldo?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 dark:bg-black/60"
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative flex max-h-[min(88dvh,28rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
          >
            <header className="flex items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <div>
                <h2 id={titleId} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Egresos del periodo
                </h2>
                <p className="text-[11px] text-zinc-400">{periodLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="Cerrar"
              >
                <X className="size-4" />
              </button>
            </header>
            <ul className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
              {lines.length === 0 ? (
                <li className="py-8 text-center text-xs text-zinc-400">Sin egresos</li>
              ) : (
                lines.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-baseline justify-between gap-3 border-b border-zinc-100 py-2.5 last:border-0 dark:border-zinc-800"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-zinc-800 dark:text-zinc-200">
                        {row.concept || "Sin concepto"}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {prettyReportDayShortLabel(row.expense_date)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm tabular-nums text-red-600 dark:text-red-400">
                      −{formatCop(row.amount_cents)}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}

      <section className="flex h-full min-h-0 flex-col justify-between rounded-2xl border border-rose-200/45 bg-white p-4 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900">
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
              Gastos del periodo
            </p>
            {lines.length > 0 ? (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="rounded-sm text-zinc-400 transition hover:text-zinc-700 dark:hover:text-zinc-200"
                aria-label="Ver egresos"
              >
                <Info className="size-3.5" />
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
            <StaticCopCents cents={egresosPeriod} />
          </p>
          <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
            {cantidad} movimiento{cantidad === 1 ? "" : "s"}
          </p>
          {showSaldo && saldoNetoCaja != null ? (
            <p className="mt-3 border-t border-zinc-100 pt-3 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              Saldo neto en caja{" "}
              <span
                className={`font-semibold tabular-nums ${
                  saldoNetoCaja < 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-zinc-800 dark:text-zinc-200"
                }`}
              >
                {formatCop(saldoNetoCaja)}
              </span>
            </p>
          ) : null}
        </div>
        <Link
          href="/admin/egresos/nuevo"
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-rose-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-900 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
        >
          + Egreso
        </Link>
      </section>
    </>
  );
}
