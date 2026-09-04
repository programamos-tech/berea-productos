"use client";

import { useEffect, useId, useState } from "react";
import { Info, X } from "lucide-react";
import { StaticCopCents } from "@/components/admin/ReportsAnimatedFigures";
import { formatCop } from "@/lib/money";
import { prettyReportDayShortLabel } from "@/lib/admin-report-range";

export type ReportExpenseDetailLine = {
  id: string;
  concept: string;
  amount_cents: number;
  expense_date: string;
  payment_method: string;
  category: string | null;
  created_at: string | null;
};

type Props = {
  cardLabelClass: string;
  periodLabel: string;
  /** `inflow` = solo cobros; `position` = arrastre + cobros − egresos */
  mode: "inflow" | "position";
  totalCobradoPedidos: number;
  efectivo: number;
  efectivoNetoCaja: number;
  egresosEfectivoCents: number;
  expensesEfectivo: ReportExpenseDetailLine[];
  transferencia: number;
  transferenciaNeta: number;
  egresosTransferenciaBucketCents: number;
  expensesOtros: ReportExpenseDetailLine[];
  /** Solo en modo posición: efectivo que venía de caja al inicio del rango */
  arrastreEfectivoCents?: number;
};

function ExpenseRows({ rows }: { rows: ReportExpenseDetailLine[] }) {
  if (rows.length === 0) {
    return (
      <li className="py-6 text-center text-xs text-stone-400 dark:text-zinc-500">
        Ninguno en este periodo.
      </li>
    );
  }
  return (
    <>
      {rows.map((row) => (
        <li
          key={row.id}
          className="flex items-baseline justify-between gap-3 border-b border-stone-100 py-2.5 last:border-0 dark:border-zinc-800"
        >
          <div className="min-w-0">
            <p className="truncate text-sm text-stone-800 dark:text-zinc-200">
              {row.concept || "Sin concepto"}
            </p>
            <p className="mt-0.5 text-[11px] text-stone-400 dark:text-zinc-500">
              {prettyReportDayShortLabel(row.expense_date)}
              {row.category ? ` · ${row.category}` : ""}
            </p>
          </div>
          <p className="shrink-0 text-sm tabular-nums text-red-600/90 dark:text-red-400/90">
            −{formatCop(row.amount_cents)}
          </p>
        </li>
      ))}
    </>
  );
}

function MiniEgresosBar({ cobrado, egresos }: { cobrado: number; egresos: number }) {
  const base = Math.max(cobrado, egresos, 1);
  const neto = cobrado - egresos;
  const netoW = Math.max(0, (neto / base) * 100);
  const egresoW = Math.min(100, (egresos / base) * 100);

  return (
    <div
      className="flex h-1 w-full overflow-hidden rounded-full bg-stone-200/60 dark:bg-zinc-700/50"
      aria-hidden
    >
      {netoW > 0 ? (
        <div
          className="h-full bg-emerald-500/55 dark:bg-emerald-600/45"
          style={{ width: `${netoW}%` }}
        />
      ) : null}
      <div
        className="h-full bg-red-400/70 dark:bg-red-500/55"
        style={{ width: `${egresoW}%` }}
      />
    </div>
  );
}

function LiquidityBucketCard({
  label,
  cobrado,
  neto,
  egresos,
  expenseCount,
  hint,
  staggerMs,
  cardLabelClass,
  infoBtnClass,
  onOpenEgresos,
  showEgresos,
  arrastreCents,
}: {
  label: string;
  cobrado: number;
  neto: number;
  egresos: number;
  expenseCount: number;
  hint: string;
  staggerMs: number;
  cardLabelClass: string;
  infoBtnClass: string;
  onOpenEgresos: () => void;
  showEgresos: boolean;
  arrastreCents?: number;
}) {
  const hasEgresos = showEgresos && egresos > 0;
  const hasArrastre = typeof arrastreCents === "number" && arrastreCents > 0;

  return (
    <div
      className="reports-metric-card min-w-0"
      style={{ ["--reports-stagger" as string]: `${staggerMs}ms` }}
    >
      <dt className={`${cardLabelClass} flex min-w-0 items-center gap-1`}>
        <span className="min-w-0 truncate">{label}</span>
        {hasEgresos ? (
          <button
            type="button"
            className={infoBtnClass}
            onClick={onOpenEgresos}
            aria-label={`Ver egresos de ${label.toLowerCase()}`}
          >
            <Info className="size-3.5" strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </dt>
      <dd className="mt-1 text-2xl font-normal tabular-nums text-stone-900 dark:text-zinc-100">
        <StaticCopCents
          cents={neto}
          className={neto < 0 ? "text-red-700 dark:text-red-300" : undefined}
        />
      </dd>

      {hasArrastre ? (
        <p className="mt-1.5 text-[11px] tabular-nums leading-snug text-stone-500 dark:text-zinc-400">
          Incluye arrastre de caja {formatCop(arrastreCents)}
        </p>
      ) : null}

      {hasEgresos ? (
        <button
          type="button"
          onClick={onOpenEgresos}
          className="group mt-2.5 w-full text-left"
        >
          <MiniEgresosBar
            cobrado={cobrado + (arrastreCents ?? 0)}
            egresos={egresos}
          />
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] leading-none text-stone-400 transition group-hover:text-stone-500 dark:text-zinc-500 dark:group-hover:text-zinc-400">
            <span className="size-1.5 shrink-0 rounded-full bg-red-500/80" aria-hidden />
            <span className="tabular-nums text-red-600/85 dark:text-red-400/85">
              −{formatCop(egresos)}
            </span>
            <span>egresos</span>
            {expenseCount > 1 ? (
              <span className="text-stone-300 dark:text-zinc-600">· {expenseCount}</span>
            ) : null}
          </p>
        </button>
      ) : (
        <p className="mt-1 text-xs text-stone-500 dark:text-zinc-400">{hint}</p>
      )}
    </div>
  );
}

export function ReportLiquidityMetricCards({
  cardLabelClass,
  periodLabel,
  mode,
  totalCobradoPedidos,
  efectivo,
  efectivoNetoCaja,
  egresosEfectivoCents,
  expensesEfectivo,
  transferencia,
  transferenciaNeta,
  egresosTransferenciaBucketCents,
  expensesOtros,
  arrastreEfectivoCents = 0,
}: Props) {
  const [open, setOpen] = useState<null | "efectivo" | "transferencia">(null);
  const titleId = useId();
  const showEgresos = mode === "position";

  useEffect(() => {
    if (open === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const efectivoDisplay = mode === "inflow" ? efectivo : efectivoNetoCaja;
  const transferenciaDisplay = mode === "inflow" ? transferencia : transferenciaNeta;

  const efectivoHint =
    mode === "inflow"
      ? totalCobradoPedidos > 0
        ? `${Math.round((efectivo / totalCobradoPedidos) * 100)}% cobrado en efectivo`
        : "Sin cobros POS en efectivo en el periodo"
      : totalCobradoPedidos > 0
        ? `${Math.round((efectivo / totalCobradoPedidos) * 100)}% cobrado en efectivo`
        : egresosEfectivoCents > 0
          ? "Solo egresos en efectivo en el periodo (sin ventas POS)"
          : "Sin cobros POS en efectivo en el periodo";

  const transferHint =
    mode === "inflow"
      ? totalCobradoPedidos > 0
        ? `${Math.round((transferencia / totalCobradoPedidos) * 100)}% del cobrado en este bucket`
        : "Sin cobros en este bucket en el periodo"
      : totalCobradoPedidos > 0
        ? `${Math.round((transferencia / totalCobradoPedidos) * 100)}% del cobrado en este bucket`
        : egresosTransferenciaBucketCents > 0
          ? "Solo egresos en el periodo (sin cobros en transferencia / web)"
          : "Sin cobros en este bucket en el periodo";

  const infoBtnClass =
    "inline-flex shrink-0 rounded-sm text-rose-900/50 transition hover:text-rose-900/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50 dark:text-zinc-500 dark:hover:text-zinc-300 dark:focus-visible:ring-zinc-500/40";

  const modalTitle =
    open === "efectivo"
      ? "Egresos en efectivo"
      : open === "transferencia"
        ? "Egresos en transferencia, tarjeta y otros"
        : "";

  const modalHelp =
    open === "efectivo"
      ? "Descontados del efectivo (arrastre + cobros del periodo)."
      : open === "transferencia"
        ? "Descontados del neto de Transferencia."
        : "";

  const modalTotalCents =
    open === "efectivo"
      ? egresosEfectivoCents
      : open === "transferencia"
        ? egresosTransferenciaBucketCents
        : 0;

  const modalRows =
    open === "efectivo"
      ? expensesEfectivo
      : open === "transferencia"
        ? expensesOtros
        : [];

  return (
    <>
      {open !== null ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 dark:bg-black/60"
            aria-label="Cerrar"
            onClick={() => setOpen(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative flex max-h-[min(88dvh,32rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
          >
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-stone-100 px-4 py-3.5 dark:border-zinc-800">
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <h2
                    id={titleId}
                    className="text-sm font-semibold text-stone-900 dark:text-zinc-100"
                  >
                    {modalTitle}
                  </h2>
                  {modalTotalCents > 0 ? (
                    <span className="text-sm tabular-nums text-red-600/90 dark:text-red-400/90">
                      −{formatCop(modalTotalCents)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-[11px] text-stone-400 dark:text-zinc-500">
                  {periodLabel}
                  {modalHelp ? ` · ${modalHelp}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="shrink-0 rounded-md p-1.5 text-stone-500 transition hover:bg-stone-100 dark:hover:bg-zinc-800"
                aria-label="Cerrar"
              >
                <X className="size-4" strokeWidth={2} aria-hidden />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 pt-1">
              <ul>
                <ExpenseRows rows={modalRows} />
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      <LiquidityBucketCard
        label="Efectivo"
        cobrado={efectivo}
        neto={efectivoDisplay}
        egresos={egresosEfectivoCents}
        expenseCount={expensesEfectivo.length}
        hint={efectivoHint}
        staggerMs={70}
        cardLabelClass={cardLabelClass}
        infoBtnClass={infoBtnClass}
        onOpenEgresos={() => setOpen("efectivo")}
        showEgresos={showEgresos}
        arrastreCents={mode === "position" ? arrastreEfectivoCents : undefined}
      />

      <LiquidityBucketCard
        label="Transferencia"
        cobrado={transferencia}
        neto={transferenciaDisplay}
        egresos={egresosTransferenciaBucketCents}
        expenseCount={expensesOtros.length}
        hint={transferHint}
        staggerMs={135}
        cardLabelClass={cardLabelClass}
        infoBtnClass={infoBtnClass}
        onOpenEgresos={() => setOpen("transferencia")}
        showEgresos={showEgresos}
      />
    </>
  );
}
