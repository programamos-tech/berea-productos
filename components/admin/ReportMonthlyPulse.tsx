import Link from "next/link";
import { formatCop, formatCopCompact } from "@/lib/money";
import type { MonthlyPulsePoint } from "@/lib/admin-report-monthly-pulse";
import { REPORT_CHART } from "@/components/admin/ReportSalesWeekTrendChart";

function netaClass(n: number): string {
  if (n > 0) return "text-emerald-600 dark:text-emerald-400";
  if (n < 0) return "text-red-600 dark:text-red-400";
  return "text-zinc-500";
}

function formatNetaCompact(n: number): string {
  if (n < 0) return `−${formatCopCompact(-n)}`;
  return formatCopCompact(n);
}

function monthAbbrev(shortLabel: string): string {
  return shortLabel.slice(0, 3);
}

export function ReportMonthlyPulse({
  months,
  insight,
  highlightYearMonth,
  mini = false,
}: {
  months: MonthlyPulsePoint[];
  insight: string;
  highlightYearMonth?: string | null;
  compact?: boolean;
  flat?: boolean;
  mini?: boolean;
}) {
  if (months.length === 0) return null;

  const current = months.find((m) => m.isCurrent) ?? months[months.length - 1];
  const maxAbs = Math.max(...months.map((m) => Math.abs(m.gananciaNeta)), 1);

  return (
    <div className="reports-chart-reveal flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Pulso mensual
          </h2>
          <p className="mt-0.5 truncate text-xs text-zinc-500">
            {current.shortLabel}
            {current.isPartial ? " · ahora" : ""}
            {!mini && insight ? ` · ${insight}` : ""}
          </p>
        </div>
        <p
          className={`font-semibold tabular-nums ${mini ? "text-sm" : "text-base"} ${netaClass(current.gananciaNeta)}`}
        >
          {mini ? formatNetaCompact(current.gananciaNeta) : formatCop(current.gananciaNeta)}
        </p>
      </div>

      <div className={`relative min-h-0 flex-1 ${mini ? "pt-1" : "pt-2"}`}>
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-zinc-200 dark:bg-zinc-800"
          aria-hidden
        />
        <ul className="flex h-full items-stretch gap-0.5 sm:gap-1">
          {months.map((m) => {
            const up = m.gananciaNeta >= 0;
            const halfPct = (Math.abs(m.gananciaNeta) / maxAbs) * (mini ? 42 : 46);
            const selected = highlightYearMonth === m.yearMonth;
            const href = `/admin?from=${encodeURIComponent(m.from)}&to=${encodeURIComponent(m.to)}`;
            const barH = Math.max(halfPct, m.gananciaNeta === 0 ? 0 : 6);
            const color =
              m.gananciaNeta === 0
                ? undefined
                : up
                  ? REPORT_CHART.positive
                  : REPORT_CHART.negative;

            return (
              <li key={m.yearMonth} className="min-w-0 flex-1">
                <Link
                  href={href}
                  className="group flex h-full flex-col items-center outline-none"
                  aria-current={selected ? "page" : undefined}
                >
                  <div className="relative min-h-0 w-full flex-1">
                    <span
                      className={`absolute left-1/2 w-[45%] max-w-2.5 -translate-x-1/2 rounded-full ${
                        m.gananciaNeta === 0
                          ? "bg-zinc-400 dark:bg-zinc-600"
                          : ""
                      } ${m.isCurrent ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}
                      style={{
                        height: `${barH}%`,
                        ...(up ? { bottom: "50%" } : { top: "50%" }),
                        ...(color ? { backgroundColor: color } : {}),
                      }}
                    />
                  </div>
                  <span
                    className={`mt-1 text-[8px] font-semibold uppercase tracking-wide sm:text-[9px] ${
                      selected || m.isCurrent
                        ? "text-zinc-800 dark:text-zinc-200"
                        : "text-zinc-500"
                    }`}
                  >
                    {monthAbbrev(m.shortLabel)}
                  </span>
                  {!mini ? (
                    <span className={`mt-0.5 text-[10px] tabular-nums ${netaClass(m.gananciaNeta)}`}>
                      {formatNetaCompact(m.gananciaNeta)}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
