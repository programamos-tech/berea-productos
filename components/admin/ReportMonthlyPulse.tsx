import Link from "next/link";
import { formatCop, formatCopCompact } from "@/lib/money";
import { adminPanelLgClass } from "@/lib/admin-ui";
import type { MonthlyPulsePoint } from "@/lib/admin-report-monthly-pulse";

function netaClass(n: number): string {
  if (n > 0) return "text-emerald-700 dark:text-emerald-400";
  if (n < 0) return "text-red-700 dark:text-red-400";
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
}: {
  months: MonthlyPulsePoint[];
  insight: string;
  highlightYearMonth?: string | null;
}) {
  if (months.length === 0) return null;

  const current = months.find((m) => m.isCurrent) ?? months[months.length - 1];
  const maxAbs = Math.max(...months.map((m) => Math.abs(m.gananciaNeta)), 1);

  return (
    <section
      className={`reports-chart-reveal ${adminPanelLgClass} mt-6 overflow-hidden`}
      style={{ ["--reports-chart-delay" as string]: "280ms" }}
    >
      <div className="flex flex-wrap items-end justify-between gap-4 px-6 pt-4 sm:px-8 sm:pt-5">
        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600 dark:text-zinc-400">
            Pulso mensual
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {current.shortLabel}
            {current.isPartial ? " · ahora" : ""}
            {insight ? ` · ${insight}` : ""}
          </p>
        </div>
        <p className={`text-xl font-normal tabular-nums ${netaClass(current.gananciaNeta)}`}>
          {formatCop(current.gananciaNeta)}
        </p>
      </div>

      <div className="relative mt-4 px-4 pb-5 sm:px-6">
        <div
          className="pointer-events-none absolute inset-x-6 top-[3.5rem] h-px bg-zinc-100 dark:bg-zinc-800 sm:inset-x-8"
          aria-hidden
        />
        <ul className="flex items-start gap-1 overflow-x-auto sm:gap-2">
          {months.map((m) => {
            const up = m.gananciaNeta >= 0;
            const halfPct = (Math.abs(m.gananciaNeta) / maxAbs) * 50;
            const selected = highlightYearMonth === m.yearMonth;
            const href = `/admin?from=${encodeURIComponent(m.from)}&to=${encodeURIComponent(m.to)}`;

            return (
              <li key={m.yearMonth} className="min-w-[3.15rem] flex-1">
                <Link
                  href={href}
                  className="group flex flex-col items-center outline-none"
                  aria-current={selected ? "page" : undefined}
                >
                  <div className="relative h-28 w-full">
                    {up ? (
                      <span
                        className={`absolute bottom-1/2 left-1/2 -translate-x-1/2 rounded-sm ${
                          m.isCurrent ? "w-3 sm:w-3.5" : "w-2 sm:w-2.5"
                        } ${
                          m.gananciaNeta === 0
                            ? "bg-zinc-300 dark:bg-zinc-600"
                            : "bg-emerald-600/50 dark:bg-emerald-500/45"
                        }`}
                        style={{ height: `${Math.max(halfPct, m.gananciaNeta === 0 ? 0 : 4)}%` }}
                      />
                    ) : (
                      <span
                        className={`absolute top-1/2 left-1/2 -translate-x-1/2 rounded-sm bg-red-500/65 dark:bg-red-400/60 ${
                          m.isCurrent ? "w-3 sm:w-3.5" : "w-2 sm:w-2.5"
                        }`}
                        style={{ height: `${Math.max(halfPct, 4)}%` }}
                      />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                      selected || m.isCurrent
                        ? "text-zinc-800 dark:text-zinc-200"
                        : "text-zinc-400 dark:text-zinc-500"
                    }`}
                  >
                    {monthAbbrev(m.shortLabel)}
                  </span>
                  <span className={`mt-0.5 text-[11px] tabular-nums ${netaClass(m.gananciaNeta)}`}>
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
