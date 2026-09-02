import Link from "next/link";
import { formatCop, formatCopCompact } from "@/lib/money";
import type { MonthlyPulsePoint } from "@/lib/admin-report-monthly-pulse";

const sectionTitleClass =
  "text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600 dark:text-zinc-400";

function netaToneClass(neta: number): string {
  if (neta > 0) return "text-emerald-700 dark:text-emerald-400";
  if (neta < 0) return "text-red-700 dark:text-red-400";
  return "text-stone-600 dark:text-zinc-400";
}

function barFillClass(neta: number): string {
  if (neta > 0) return "bg-emerald-500/70 dark:bg-emerald-500/55";
  if (neta < 0) return "bg-red-400/75 dark:bg-red-500/55";
  return "bg-stone-300 dark:bg-zinc-600";
}

function statusPill(m: MonthlyPulsePoint) {
  if (m.gananciaNeta > 0) {
    return {
      label: m.isPartial ? "Va en verde" : "Cerró en verde",
      className:
        "bg-emerald-50 text-emerald-800 ring-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/60",
    };
  }
  if (m.gananciaNeta < 0) {
    return {
      label: m.isPartial ? "Va en rojo" : "Cerró en rojo",
      className:
        "bg-red-50 text-red-800 ring-red-200/80 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900/60",
    };
  }
  return {
    label: m.isPartial ? "En cero" : "Cerró en cero",
    className:
      "bg-stone-100 text-stone-600 ring-stone-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
  };
}

export function ReportMonthlyPulse({
  months,
  insight,
  highlightYearMonth,
}: {
  months: MonthlyPulsePoint[];
  insight: string;
  /** Mes del filtro actual, si aplica. */
  highlightYearMonth?: string | null;
}) {
  if (months.length === 0) return null;

  const maxAbs = Math.max(...months.map((m) => Math.abs(m.gananciaNeta)), 1);

  return (
    <section className="reports-chart-reveal mt-8 border-t border-rose-200/55 pt-8 dark:border-zinc-800">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 className={sectionTitleClass}>Pulso mensual</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Ganancia neta de los últimos meses (margen − egresos). Independiente del filtro del
            resumen; tocá un mes para verlo arriba.
          </p>
        </div>
      </div>

      {insight ? (
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-stone-700 dark:text-zinc-300">
          {insight}
        </p>
      ) : null}

      <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {months.map((m) => {
          const pill = statusPill(m);
          const heightPct = Math.max(8, Math.round((Math.abs(m.gananciaNeta) / maxAbs) * 100));
          const active = highlightYearMonth === m.yearMonth;
          const href = `/admin?from=${encodeURIComponent(m.from)}&to=${encodeURIComponent(m.to)}`;

          return (
            <li key={m.yearMonth}>
              <Link
                href={href}
                className={[
                  "group flex h-full flex-col rounded-xl border px-4 py-3.5 transition",
                  active
                    ? "border-rose-300/80 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/20"
                    : "border-stone-200/80 bg-white/60 hover:border-rose-200/70 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-zinc-700",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-900/45 dark:text-zinc-500">
                      {m.shortLabel}
                      {m.isPartial ? (
                        <span className="ml-1.5 font-medium normal-case tracking-normal text-stone-400 dark:text-zinc-500">
                          parcial
                        </span>
                      ) : null}
                    </p>
                    <p
                      className={`mt-1 text-xl font-normal tabular-nums ${netaToneClass(m.gananciaNeta)}`}
                    >
                      {formatCop(m.gananciaNeta)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${pill.className}`}
                  >
                    {pill.label}
                  </span>
                </div>

                <div
                  className="mt-3 flex h-10 items-end gap-1"
                  aria-hidden
                >
                  <div className="flex h-full w-2.5 items-end overflow-hidden rounded-sm bg-stone-100 dark:bg-zinc-800">
                    <div
                      className={`w-full rounded-sm ${barFillClass(m.gananciaNeta)}`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5 text-[11px] leading-snug text-stone-500 dark:text-zinc-400">
                    <p className="tabular-nums">
                      Ingresos {formatCopCompact(m.ingresosConIva)}
                    </p>
                    <p className="tabular-nums">
                      Bruta {formatCopCompact(m.gananciaBruta)} · Egresos{" "}
                      {formatCopCompact(m.egresos)}
                    </p>
                    <p>
                      {m.ventas} venta{m.ventas === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-[11px] text-rose-900/50 transition group-hover:text-rose-900/80 dark:text-zinc-500 dark:group-hover:text-zinc-300">
                  Ver resumen de {m.shortLabel.toLowerCase()} →
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
