import Link from "next/link";
import { TrendingDown, TrendingUp } from "lucide-react";
import { formatCop, formatCopCompact } from "@/lib/money";
import type { MonthlyPulsePoint } from "@/lib/admin-report-monthly-pulse";
import { REPORT_CHART } from "@/components/admin/ReportSalesWeekTrendChart";

function monthHref(yearMonth: string, isCurrent: boolean): string {
  if (isCurrent) return "/admin";
  return `/admin?mes=${encodeURIComponent(yearMonth)}`;
}

function monthAbbrev(shortLabel: string): string {
  return shortLabel.slice(0, 3);
}

function smoothLine(pts: Array<{ x: number; y: number }>): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function pctChange(current: number, prior: number): number | null {
  if (prior <= 0) return null;
  return Math.round(((current - prior) / prior) * 1000) / 10;
}

/**
 * Ingresos vs egresos por mes: responde “¿la tienda vende más o gasta más?”
 * (no repite la ganancia/pérdida de las métricas de arriba).
 */
export function ReportMonthlyResultChart({
  months,
  highlightYearMonth,
}: {
  months: MonthlyPulsePoint[];
  highlightYearMonth?: string | null;
}) {
  if (months.length === 0) {
    return (
      <div className="flex min-h-[12rem] w-full flex-col justify-center">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Ingresos vs egresos
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Cuando haya ventas, verás si cada mes entra más de lo que sale.
        </p>
      </div>
    );
  }

  const latest = months.find((m) => m.isCurrent) ?? months[months.length - 1];
  const latestIdx = months.findIndex((m) => m.yearMonth === latest.yearMonth);
  const prior = latestIdx > 0 ? months[latestIdx - 1] : null;
  const ingresosMom = prior
    ? pctChange(latest.ingresosConIva, prior.ingresosConIva)
    : null;
  const egresosShare =
    latest.ingresosConIva > 0
      ? Math.round((latest.egresos / latest.ingresosConIva) * 1000) / 10
      : null;
  const gap = latest.ingresosConIva - latest.egresos;

  const maxVal = Math.max(
    ...months.map((m) => Math.max(m.ingresosConIva, m.egresos)),
    1,
  );
  const yMax = maxVal * 1.08;

  const chartW = 1000;
  const chartH = 260;
  const padL = 52;
  const padR = 16;
  const padT = 14;
  const padB = 36;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const xAt = (i: number) => {
    if (months.length === 1) return padL + plotW / 2;
    return padL + (i / Math.max(1, months.length - 1)) * plotW;
  };
  const yAt = (v: number) => padT + plotH - (Math.max(0, v) / yMax) * plotH;

  const ingresosPts = months.map((m, i) => ({
    x: xAt(i),
    y: yAt(m.ingresosConIva),
  }));
  const egresosPts = months.map((m, i) => ({
    x: xAt(i),
    y: yAt(m.egresos),
  }));
  const ingresosPath = smoothLine(ingresosPts);
  const egresosPath = smoothLine(egresosPts);
  const areaPath =
    ingresosPts.length > 0
      ? `${ingresosPath} L ${ingresosPts[ingresosPts.length - 1].x} ${padT + plotH} L ${ingresosPts[0].x} ${padT + plotH} Z`
      : "";

  const gridSteps = 4;
  const yTicks: number[] = [];
  for (let s = 0; s <= gridSteps; s += 1) yTicks.push((yMax * s) / gridSteps);

  const fillId = "reportsIncomeExpenseFill";
  const momUp = ingresosMom != null && ingresosMom > 0;
  const momDown = ingresosMom != null && ingresosMom < 0;

  return (
    <div className="flex w-full min-w-0 flex-col">
      <div className="mb-2 flex shrink-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Ingresos vs egresos
          </h2>
          <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">
            Lo que entra a la caja de ventas vs lo que sale en gastos
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
          <div className="text-left sm:text-right">
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Brecha · {latest.shortLabel}
              {latest.isPartial ? " · ahora" : ""}
            </p>
            <p
              className={`text-base font-semibold tabular-nums sm:text-lg ${
                gap >= 0
                  ? "text-zinc-900 dark:text-zinc-50"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {gap < 0 ? "−" : ""}
              {formatCop(Math.abs(gap))}
            </p>
          </div>
          {ingresosMom != null ? (
            <div
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                momUp
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : momDown
                    ? "bg-red-500/15 text-red-700 dark:text-red-300"
                    : "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300"
              }`}
              title="Cambio de ingresos vs el mes anterior"
            >
              {momUp ? (
                <TrendingUp className="size-3" strokeWidth={2} aria-hidden />
              ) : momDown ? (
                <TrendingDown className="size-3" strokeWidth={2} aria-hidden />
              ) : null}
              Ingresos {momUp || momDown ? `${ingresosMom > 0 ? "+" : ""}${ingresosMom}%` : "igual"}
            </div>
          ) : null}
          {egresosShare != null ? (
            <p className="text-[11px] tabular-nums text-zinc-500">
              Egresos ={" "}
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {egresosShare}%
              </span>{" "}
              de ingresos
            </p>
          ) : null}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        className="block w-full shrink-0"
        style={{ aspectRatio: `${chartW} / ${chartH}` }}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Ingresos y egresos por mes"
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={REPORT_CHART.primary} stopOpacity="0.2" />
            <stop offset="100%" stopColor={REPORT_CHART.primary} stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((tick, idx) => {
          const y = yAt(tick);
          return (
            <g key={`g-${idx}`}>
              {idx > 0 ? (
                <line
                  x1={padL}
                  y1={y}
                  x2={padL + plotW}
                  y2={y}
                  stroke="currentColor"
                  className="text-zinc-200 dark:text-zinc-800"
                  strokeWidth={1}
                />
              ) : null}
              <text
                x={padL - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-zinc-500"
                style={{ fontSize: "10px" }}
              >
                {tick === 0 ? "$0" : formatCopCompact(Math.round(tick))}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill={`url(#${fillId})`} />
        <path
          d={egresosPath}
          fill="none"
          stroke={REPORT_CHART.secondary}
          strokeWidth={1.75}
          strokeDasharray="5 5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={ingresosPath}
          fill="none"
          stroke={REPORT_CHART.primary}
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="dark:[stroke:#f87171]"
        />

        {months.map((m, i) => {
          const selected = highlightYearMonth === m.yearMonth;
          const spendsMore = m.egresos > m.ingresosConIva && m.ingresosConIva > 0;
          return (
            <g key={m.yearMonth}>
              <a
                href={monthHref(m.yearMonth, m.isCurrent)}
                aria-label={`${m.label}: ingresos ${formatCop(m.ingresosConIva)}, egresos ${formatCop(m.egresos)}`}
              >
                {selected ? (
                  <circle
                    cx={xAt(i)}
                    cy={yAt(m.ingresosConIva)}
                    r={10}
                    fill={REPORT_CHART.primary}
                    fillOpacity={0.12}
                    className="dark:[fill:#f87171] dark:[fill-opacity:0.18]"
                  />
                ) : null}
                <circle
                  cx={xAt(i)}
                  cy={yAt(m.ingresosConIva)}
                  r={selected ? 4.5 : 3.5}
                  fill="#09090b"
                  stroke={REPORT_CHART.primary}
                  strokeWidth={1.75}
                  className="dark:fill-zinc-950 dark:[stroke:#f87171]"
                />
                <circle
                  cx={xAt(i)}
                  cy={yAt(m.egresos)}
                  r={2.75}
                  fill="#09090b"
                  stroke={
                    spendsMore ? REPORT_CHART.negative : REPORT_CHART.secondary
                  }
                  strokeWidth={1.5}
                  className="dark:fill-zinc-950"
                />
                <title>
                  {`${m.label}\nIngresos ${formatCop(m.ingresosConIva)}\nEgresos ${formatCop(m.egresos)}`}
                </title>
              </a>
              <text
                x={xAt(i)}
                y={chartH - 8}
                textAnchor="middle"
                className={
                  selected || m.isCurrent
                    ? "fill-zinc-800 dark:fill-zinc-200"
                    : "fill-zinc-500"
                }
                style={{
                  fontSize: "10px",
                  fontWeight: selected || m.isCurrent ? 600 : 400,
                }}
              >
                {monthAbbrev(m.shortLabel)}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-1 flex shrink-0 flex-wrap items-center justify-center gap-4 text-[11px] text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-0.5 w-4 rounded-full"
            style={{ backgroundColor: REPORT_CHART.primary }}
            aria-hidden
          />
          Ingresos
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-0 w-4 border-t border-dashed"
            style={{ borderColor: REPORT_CHART.secondary }}
            aria-hidden
          />
          Egresos
        </span>
      </div>

      <nav className="sr-only" aria-label="Abrir un mes">
        {months.map((m) => (
          <Link key={m.yearMonth} href={monthHref(m.yearMonth, m.isCurrent)}>
            {m.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
