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

function MiniBar({
  positive,
  negative,
}: {
  positive: number;
  negative: number;
}) {
  const base = Math.max(positive, negative, 1);
  const posW = Math.max(0, (positive / base) * 100);
  const negW = Math.min(100, (negative / base) * 100);
  return (
    <div
      className="mt-2 flex h-1 w-full overflow-hidden rounded-full bg-stone-200/70 dark:bg-zinc-700/50"
      aria-hidden
    >
      {posW > 0 ? (
        <div className="h-full bg-emerald-500/55 dark:bg-emerald-500/45" style={{ width: `${posW}%` }} />
      ) : null}
      <div className="h-full bg-red-400/75 dark:bg-red-500/55" style={{ width: `${negW}%` }} />
    </div>
  );
}

function CompactBucket({
  label,
  value,
  hint,
  egresos,
  expenseCount,
  arrastreCents,
  showEgresos,
  onOpenEgresos,
  infoBtnClass,
  cardLabelClass,
}: {
  label: string;
  value: number;
  hint: string;
  egresos: number;
  expenseCount: number;
  arrastreCents?: number;
  showEgresos: boolean;
  onOpenEgresos: () => void;
  infoBtnClass: string;
  cardLabelClass: string;
}) {
  const hasEgresos = showEgresos && egresos > 0;
  const hasArrastre = typeof arrastreCents === "number" && arrastreCents > 0;

  return (
    <div className="reports-metric-card min-w-0 rounded-xl border border-rose-200/35 bg-white/80 px-3 py-2.5 dark:border-zinc-700/70 dark:bg-zinc-900/80">
      <dt className={`${cardLabelClass} flex items-center gap-1`}>
        <span className="truncate">{label}</span>
        {hasEgresos ? (
          <button
            type="button"
            className={infoBtnClass}
            onClick={onOpenEgresos}
            aria-label={`Ver egresos de ${label.toLowerCase()}`}
          >
            <Info className="size-3" strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-stone-900 dark:text-zinc-50 sm:text-xl">
        <StaticCopCents
          cents={value}
          className={value < 0 ? "text-red-600 dark:text-red-400" : undefined}
        />
      </dd>
      {hasArrastre ? (
        <p className="mt-0.5 text-[10px] tabular-nums text-stone-400 dark:text-zinc-500">
          + arrastre {formatCop(arrastreCents)}
        </p>
      ) : (
        <p className="mt-0.5 truncate text-[10px] text-stone-400 dark:text-zinc-500">{hint}</p>
      )}
      {hasEgresos ? (
        <button type="button" onClick={onOpenEgresos} className="w-full text-left">
          <MiniBar positive={Math.max(0, value + egresos)} negative={egresos} />
          <p className="mt-1 text-[10px] tabular-nums text-red-600/90 dark:text-red-400/85">
            −{formatCop(egresos)}
            {expenseCount > 1 ? ` · ${expenseCount}` : ""}
          </p>
        </button>
      ) : null}
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
    totalCobradoPedidos > 0
      ? `${Math.round((efectivo / totalCobradoPedidos) * 100)}% del cobrado`
      : "Sin cobros POS en efectivo";

  const transferHint =
    totalCobradoPedidos > 0
      ? `${Math.round((transferencia / totalCobradoPedidos) * 100)}% del cobrado`
      : "Sin cobros en transferencia";

  const infoBtnClass =
    "inline-flex shrink-0 rounded-sm text-rose-900/45 transition hover:text-rose-900/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50 dark:text-zinc-500 dark:hover:text-zinc-300";

  const modalTitle =
    open === "efectivo"
      ? "Egresos en efectivo"
      : open === "transferencia"
        ? "Egresos en transferencia y otros"
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
                <div className="flex flex-wrap items-baseline gap-x-2">
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

      <CompactBucket
        label="Efectivo"
        value={efectivoDisplay}
        hint={efectivoHint}
        egresos={egresosEfectivoCents}
        expenseCount={expensesEfectivo.length}
        arrastreCents={mode === "position" ? arrastreEfectivoCents : undefined}
        showEgresos={showEgresos}
        onOpenEgresos={() => setOpen("efectivo")}
        infoBtnClass={infoBtnClass}
        cardLabelClass={cardLabelClass}
      />
      <CompactBucket
        label="Transferencia"
        value={transferenciaDisplay}
        hint={transferHint}
        egresos={egresosTransferenciaBucketCents}
        expenseCount={expensesOtros.length}
        showEgresos={showEgresos}
        onOpenEgresos={() => setOpen("transferencia")}
        infoBtnClass={infoBtnClass}
        cardLabelClass={cardLabelClass}
      />
    </>
  );
}
