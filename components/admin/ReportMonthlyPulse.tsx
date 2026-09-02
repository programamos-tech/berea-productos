import Link from "next/link";
import { formatCop, formatCopCompact } from "@/lib/money";
import type { MonthlyPulsePoint } from "@/lib/admin-report-monthly-pulse";

function netaToneClassLight(neta: number): string {
  if (neta > 0) return "text-emerald-700 dark:text-emerald-300";
  if (neta < 0) return "text-red-700 dark:text-red-300";
  return "text-stone-600 dark:text-zinc-300";
}

function formatNetaCompact(n: number): string {
  if (n < 0) return `−${formatCopCompact(-n)}`;
  return formatCopCompact(n);
}

function coverFillPct(n: number, maxAbs: number): number {
  return Math.max(12, Math.round((Math.abs(n) / Math.max(maxAbs, 1)) * 100));
}

function MonthSparkline({ months }: { months: MonthlyPulsePoint[] }) {
  if (months.length < 2) return null;
  const w = 1000;
  const h = 56;
  const padX = 8;
  const padY = 8;
  const plotW = w - padX * 2;
  const plotH = h - padY * 2;
  const maxAbs = Math.max(...months.map((m) => Math.abs(m.gananciaNeta)), 1);
  const midY = padY + plotH / 2;
  const xAt = (i: number) =>
    padX + (months.length === 1 ? plotW / 2 : (i / (months.length - 1)) * plotW);
  const yAt = (v: number) => midY - (v / maxAbs) * (plotH / 2);

  const d = months
    .map((m, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(m.gananciaNeta).toFixed(1)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-12 w-full text-zinc-500"
      role="img"
      aria-label="Ganancia neta mes a mes"
    >
      <line
        x1={padX}
        x2={w - padX}
        y1={midY}
        y2={midY}
        stroke="currentColor"
        strokeOpacity={0.25}
        strokeWidth={1}
      />
      <path d={d} fill="none" stroke="currentColor" strokeWidth={2} />
      {months.map((m, i) => (
        <circle
          key={m.yearMonth}
          cx={xAt(i)}
          cy={yAt(m.gananciaNeta)}
          r={m.isCurrent ? 5 : 3.5}
          className={
            m.gananciaNeta > 0
              ? "fill-emerald-500 dark:fill-emerald-400"
              : m.gananciaNeta < 0
                ? "fill-red-500 dark:fill-red-400"
                : "fill-zinc-400"
          }
        />
      ))}
    </svg>
  );
}

function FeaturedMonth({
  month,
  insight,
  active,
  maxAbs,
}: {
  month: MonthlyPulsePoint;
  insight: string;
  active: boolean;
  maxAbs: number;
}) {
  const href = `/admin?from=${encodeURIComponent(month.from)}&to=${encodeURIComponent(month.to)}`;
  const positive = month.gananciaNeta >= 0;
  const brutaShare = Math.max(month.gananciaBruta, month.egresos, 1);

  return (
    <Link
      href={href}
      className={[
        "relative flex min-h-[220px] w-full shrink-0 flex-col justify-between overflow-hidden rounded-2xl p-5 sm:min-h-[240px] sm:w-[min(100%,20rem)]",
        positive ? "bg-emerald-950" : "bg-red-950",
        active ? "ring-2 ring-white/25" : "",
      ].join(" ")}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 ${
          positive ? "bg-emerald-500/40" : "bg-red-500/40"
        }`}
        style={{ height: `${coverFillPct(month.gananciaNeta, maxAbs)}%` }}
        aria-hidden
      />
      <div className="relative">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
          Ahora
        </p>
        <p className="mt-1 text-lg font-medium tracking-tight text-white">
          {month.shortLabel}
        </p>
        {insight ? (
          <p className="mt-1 text-sm text-white/75">{insight}</p>
        ) : null}
      </div>
      <div className="relative">
        <p className="text-3xl font-normal tabular-nums tracking-tight text-white">
          {formatCop(month.gananciaNeta)}
        </p>
        <div className="mt-3 space-y-1.5" aria-hidden>
          <div className="h-1 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full bg-white/80"
              style={{
                width: `${Math.min(100, (month.gananciaBruta / brutaShare) * 100)}%`,
              }}
            />
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full bg-black/35 dark:bg-black/40"
              style={{
                width: `${Math.min(100, (month.egresos / brutaShare) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

function HistoryTile({
  month,
  maxAbs,
  active,
}: {
  month: MonthlyPulsePoint;
  maxAbs: number;
  active: boolean;
}) {
  const href = `/admin?from=${encodeURIComponent(month.from)}&to=${encodeURIComponent(month.to)}`;
  const positive = month.gananciaNeta >= 0;
  const fill = coverFillPct(month.gananciaNeta, maxAbs);

  return (
    <li className="snap-start">
      <Link
        href={href}
        className={[
          "group flex w-[9.5rem] flex-col",
          active ? "opacity-100" : "opacity-95",
        ].join(" ")}
      >
        <div
          className={[
            "relative h-[9.5rem] w-[9.5rem] overflow-hidden rounded-xl",
            positive ? "bg-emerald-950" : "bg-red-950",
            active ? "ring-2 ring-rose-400/70 dark:ring-rose-300/40" : "",
          ].join(" ")}
        >
          <div
            className={`absolute inset-x-0 bottom-0 ${
              positive ? "bg-emerald-500/70" : "bg-red-500/70"
            }`}
            style={{ height: `${fill}%` }}
            aria-hidden
          />
        </div>
        <p className="mt-2 truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-900/55 dark:text-zinc-500">
          {month.shortLabel}
        </p>
        <p className={`text-sm tabular-nums ${netaToneClassLight(month.gananciaNeta)}`}>
          {formatNetaCompact(month.gananciaNeta)}
        </p>
      </Link>
    </li>
  );
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
  const history = months
    .filter((m) => m.yearMonth !== current.yearMonth)
    .slice()
    .reverse();
  const maxAbs = Math.max(...months.map((m) => Math.abs(m.gananciaNeta)), 1);

  return (
    <section className="reports-chart-reveal mt-8 border-t border-rose-200/55 pt-8 dark:border-zinc-800">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600 dark:text-zinc-400">
        Pulso mensual
      </h2>

      <div className="mt-3">
        <MonthSparkline months={months} />
      </div>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end">
        <FeaturedMonth
          month={current}
          insight={insight}
          maxAbs={maxAbs}
          active={highlightYearMonth === current.yearMonth}
        />

        {history.length > 0 ? (
          <ul className="reports-month-playlist flex min-w-0 flex-1 snap-x items-end gap-3 overflow-x-auto pb-2">
            {history.map((m) => (
              <HistoryTile
                key={m.yearMonth}
                month={m}
                maxAbs={maxAbs}
                active={highlightYearMonth === m.yearMonth}
              />
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
