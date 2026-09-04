import Link from "next/link";
import { formatCop, formatCopCompact } from "@/lib/money";
import type { MonthlyPulsePoint } from "@/lib/admin-report-monthly-pulse";

function netaClass(n: number): string {
  if (n > 0) return "text-emerald-700 dark:text-emerald-400";
  if (n < 0) return "text-red-600 dark:text-red-400";
  return "text-zinc-500 dark:text-zinc-400";
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
  compact = false,
}: {
  months: MonthlyPulsePoint[];
  insight: string;
  highlightYearMonth?: string | null;
  compact?: boolean;
}) {
  if (months.length === 0) return null;

  const current = months.find((m) => m.isCurrent) ?? months[months.length - 1];
  const maxAbs = Math.max(...months.map((m) => Math.abs(m.gananciaNeta)), 1);

  return (
    <section
      className={`reports-chart-reveal flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-rose-200/45 bg-white shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900 ${
        compact ? "" : "mt-6"
      }`}
      style={{ ["--reports-chart-delay" as string]: "200ms" }}
    >
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-2 px-4 pt-3.5 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
            Pulso mensual
          </h2>
          <p className="mt-0.5 truncate text-xs text-zinc-400 dark:text-zinc-500">
            {current.shortLabel}
            {current.isPartial ? " · ahora" : ""}
            {insight ? ` · ${insight}` : ""}
          </p>
        </div>
        <p className={`text-lg font-semibold tabular-nums ${netaClass(current.gananciaNeta)}`}>
          {formatCop(current.gananciaNeta)}
        </p>
      </div>

      <div className="relative min-h-0 flex-1 px-3 pb-3 sm:px-4">
        <div
          className="pointer-events-none absolute inset-x-5 top-1/2 h-px -translate-y-1/2 bg-zinc-100 dark:bg-zinc-800"
          aria-hidden
        />
        <ul className="flex h-full items-stretch gap-1 sm:gap-1.5">
          {months.map((m) => {
            const up = m.gananciaNeta >= 0;
            const halfPct = (Math.abs(m.gananciaNeta) / maxAbs) * 46;
            const selected = highlightYearMonth === m.yearMonth;
            const href = `/admin?from=${encodeURIComponent(m.from)}&to=${encodeURIComponent(m.to)}`;
            const barH = Math.max(halfPct, m.gananciaNeta === 0 ? 0 : 8);

            return (
              <li key={m.yearMonth} className="min-w-0 flex-1">
                <Link
                  href={href}
                  className="group flex h-full flex-col items-center outline-none"
                  aria-current={selected ? "page" : undefined}
                >
                  <div className="relative min-h-0 w-full flex-1">
                    {up ? (
                      <span
                        className={`absolute bottom-1/2 left-1/2 w-[55%] max-w-3 -translate-x-1/2 rounded-full ${
                          m.gananciaNeta === 0
                            ? "bg-zinc-300 dark:bg-zinc-600"
                            : "bg-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.25)] dark:bg-emerald-400/75"
                        } ${m.isCurrent ? "opacity-100" : "opacity-80 group-hover:opacity-100"}`}
                        style={{ height: `${barH}%` }}
                      />
                    ) : (
                      <span
                        className={`absolute top-1/2 left-1/2 w-[55%] max-w-3 -translate-x-1/2 rounded-full bg-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.22)] dark:bg-red-400/70 ${
                          m.isCurrent ? "opacity-100" : "opacity-80 group-hover:opacity-100"
                        }`}
                        style={{ height: `${barH}%` }}
                      />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-[9px] font-semibold uppercase tracking-[0.1em] sm:text-[10px] ${
                      selected || m.isCurrent
                        ? "text-zinc-800 dark:text-zinc-200"
                        : "text-zinc-400 dark:text-zinc-500"
                    }`}
                  >
                    {monthAbbrev(m.shortLabel)}
                  </span>
                  <span className={`mt-0.5 text-[10px] tabular-nums sm:text-[11px] ${netaClass(m.gananciaNeta)}`}>
                    {formatNetaCompact(m.gananciaNeta)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
