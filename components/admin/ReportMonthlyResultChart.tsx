import Link from "next/link";
import { formatCop, formatCopCompact } from "@/lib/money";
import type { MonthlyPulsePoint } from "@/lib/admin-report-monthly-pulse";
import { REPORT_CHART } from "@/components/admin/ReportSalesWeekTrendChart";

function netaClass(n: number): string {
  if (n > 0) return "text-emerald-600 dark:text-emerald-400";
  if (n < 0) return "text-red-600 dark:text-red-400";
  return "text-zinc-500";
}

function formatNeta(n: number, compact: boolean): string {
  const abs = Math.abs(n);
  const body = compact ? formatCopCompact(abs) : formatCop(abs);
  if (n < 0) return `−${body}`;
  if (n > 0) return body;
  return body;
}

function monthHref(yearMonth: string, isCurrent: boolean): string {
  if (isCurrent) return "/admin";
  return `/admin?mes=${encodeURIComponent(yearMonth)}`;
}

function monthAbbrev(shortLabel: string): string {
  return shortLabel.slice(0, 3);
}

export function ReportMonthlyResultChart({
  months,
  highlightYearMonth,
}: {
  months: MonthlyPulsePoint[];
  highlightYearMonth?: string | null;
}) {
  if (months.length === 0) {
    return (
      <div className="flex h-full min-h-[12rem] flex-col justify-center">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Resultado por mes
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Cuando haya ventas, verás aquí en qué meses ganaste o perdiste.
        </p>
      </div>
    );
  }

  const maxAbs = Math.max(...months.map((m) => Math.abs(m.gananciaNeta)), 1);
  const wins = months.filter((m) => m.gananciaNeta > 0).length;
  const losses = months.filter((m) => m.gananciaNeta < 0).length;
  const latest = months.find((m) => m.isCurrent) ?? months[months.length - 1];

  return (
    <div className="reports-chart-reveal flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Resultado por mes
          </h2>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Ganancia neta (bruta − egresos)
            {wins + losses > 0 ? (
              <>
                {" "}
                ·{" "}
                <span className="text-emerald-600 dark:text-emerald-400">
                  {wins} en verde
                </span>
                {" · "}
                <span className="text-red-600 dark:text-red-400">
                  {losses} en rojo
                </span>
              </>
            ) : null}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            {latest.shortLabel}
            {latest.isPartial ? " · ahora" : ""}
          </p>
          <p
            className={`text-lg font-semibold tabular-nums tracking-tight sm:text-xl ${netaClass(latest.gananciaNeta)}`}
          >
            {formatNeta(latest.gananciaNeta, false)}
          </p>
        </div>
      </div>

      <div className="relative mt-3 min-h-0 flex-1 overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-100/80 to-transparent px-1 pb-1 pt-2 dark:from-zinc-900/50 dark:to-transparent">
        <div
          className="pointer-events-none absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-zinc-300/80 dark:bg-zinc-700/80"
          aria-hidden
        />
        <ul className="relative flex h-full min-h-[11rem] items-stretch gap-1 sm:gap-1.5 md:gap-2">
          {months.map((m) => {
            const up = m.gananciaNeta > 0;
            const flat = m.gananciaNeta === 0;
            const halfPct = (Math.abs(m.gananciaNeta) / maxAbs) * 44;
            const barH = flat ? 0 : Math.max(halfPct, 8);
            const selected = highlightYearMonth === m.yearMonth;
            const color = flat
              ? undefined
              : up
                ? REPORT_CHART.positive
                : REPORT_CHART.negative;

            return (
              <li key={m.yearMonth} className="min-w-0 flex-1">
                <Link
                  href={monthHref(m.yearMonth, m.isCurrent)}
                  title={`${m.label}: ${formatNeta(m.gananciaNeta, false)}`}
                  className={`group flex h-full flex-col items-center rounded-xl outline-none transition ${
                    selected
                      ? "bg-rose-500/10 ring-1 ring-rose-500/30 dark:bg-rose-400/10 dark:ring-rose-400/25"
                      : "hover:bg-zinc-900/[0.03] dark:hover:bg-white/[0.03]"
                  }`}
                  aria-current={selected ? "page" : undefined}
                >
                  <div className="relative min-h-0 w-full flex-1 px-0.5">
                    <span
                      className={`absolute left-1/2 w-[52%] max-w-3 -translate-x-1/2 rounded-full shadow-sm transition duration-300 group-hover:opacity-100 ${
                        flat
                          ? "bg-zinc-400 dark:bg-zinc-600"
                          : m.isCurrent
                            ? "opacity-100"
                            : "opacity-80"
                      }`}
                      style={{
                        height: flat ? "3px" : `${barH}%`,
                        ...(up || flat ? { bottom: "50%" } : { top: "50%" }),
                        ...(flat ? { transform: "translate(-50%, 50%)" } : {}),
                        ...(color ? { backgroundColor: color } : {}),
                      }}
                    />
                  </div>
                  <span
                    className={`mt-1 text-[9px] font-semibold uppercase tracking-wide sm:text-[10px] ${
                      selected || m.isCurrent
                        ? "text-zinc-800 dark:text-zinc-100"
                        : "text-zinc-500"
                    }`}
                  >
                    {monthAbbrev(m.shortLabel)}
                  </span>
                  <span
                    className={`mb-1 mt-0.5 text-[9px] tabular-nums sm:text-[10px] ${netaClass(m.gananciaNeta)}`}
                  >
                    {formatNeta(m.gananciaNeta, true)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
