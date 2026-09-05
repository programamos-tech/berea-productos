import Link from "next/link";
import { formatCop, formatCopCompact } from "@/lib/money";
import type { MonthlyPulsePoint } from "@/lib/admin-report-monthly-pulse";
import { REPORT_CHART } from "@/components/admin/ReportSalesWeekTrendChart";

function netaClass(n: number): string {
  if (n > 0) return "text-emerald-600 dark:text-emerald-400";
  if (n < 0) return "text-red-600 dark:text-red-400";
  return "text-zinc-500";
}

function formatNeta(n: number): string {
  const abs = Math.abs(n);
  const body = formatCop(abs);
  if (n < 0) return `−${body}`;
  return body;
}

function formatNetaAxis(n: number): string {
  if (n === 0) return "$0";
  const sign = n < 0 ? "−" : "";
  return `${sign}${formatCopCompact(Math.abs(n))}`;
}

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
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Resultado por mes
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Cuando haya ventas, verás aquí en qué meses ganaste o perdiste.
        </p>
      </div>
    );
  }

  const values = months.map((m) => m.gananciaNeta);
  const brutas = months.map((m) => m.gananciaBruta);
  const maxAbs = Math.max(
    ...values.map((v) => Math.abs(v)),
    ...brutas.map((v) => Math.abs(v)),
    1,
  );
  const yMax = maxAbs * 1.12;
  const latest = months.find((m) => m.isCurrent) ?? months[months.length - 1];
  const wins = months.filter((m) => m.gananciaNeta > 0).length;
  const losses = months.filter((m) => m.gananciaNeta < 0).length;

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
  /** Escala simétrica: 0 en el centro. */
  const yAt = (v: number) => padT + plotH / 2 - (v / yMax) * (plotH / 2);
  const yZero = yAt(0);

  const netaPts = months.map((m, i) => ({ x: xAt(i), y: yAt(m.gananciaNeta) }));
  const brutaPts = months.map((m, i) => ({ x: xAt(i), y: yAt(m.gananciaBruta) }));
  const netaPath = smoothLine(netaPts);
  const brutaPath = smoothLine(brutaPts);
  const areaPath =
    netaPts.length > 0
      ? `${netaPath} L ${netaPts[netaPts.length - 1].x} ${yZero} L ${netaPts[0].x} ${yZero} Z`
      : "";

  const gridSteps = 4;
  const yTicks: number[] = [];
  for (let s = -gridSteps; s <= gridSteps; s += 1) {
    yTicks.push((yMax * s) / gridSteps);
  }

  const fillId = "reportsMonthlyResultFill";

  return (
    <div className="reports-chart-reveal flex h-full min-h-0 w-full min-w-0 flex-col">
      <div className="mb-2 flex shrink-0 flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Resultado por mes
          </h2>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {wins} en ganancia · {losses} en pérdida
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            {latest.shortLabel}
            {latest.isPartial ? " · ahora" : ""}
          </p>
          <p
            className={`text-base font-semibold tabular-nums sm:text-lg ${netaClass(latest.gananciaNeta)}`}
          >
            {formatNeta(latest.gananciaNeta)}
          </p>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        className="block min-h-0 w-full flex-1"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Ganancia neta por mes"
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={REPORT_CHART.primary} stopOpacity="0.18" />
            <stop offset="50%" stopColor={REPORT_CHART.primary} stopOpacity="0.06" />
            <stop offset="100%" stopColor={REPORT_CHART.primary} stopOpacity="0.18" />
          </linearGradient>
        </defs>

        {yTicks.map((tick, idx) => {
          const y = yAt(tick);
          const isZero = tick === 0;
          return (
            <g key={`g-${idx}`}>
              <line
                x1={padL}
                y1={y}
                x2={padL + plotW}
                y2={y}
                stroke="currentColor"
                className={
                  isZero
                    ? "text-zinc-400 dark:text-zinc-600"
                    : "text-zinc-200 dark:text-zinc-800"
                }
                strokeWidth={isZero ? 1.25 : 1}
              />
              <text
                x={padL - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-zinc-500"
                style={{ fontSize: "10px" }}
              >
                {formatNetaAxis(Math.round(tick))}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill={`url(#${fillId})`} />
        <path
          d={brutaPath}
          fill="none"
          stroke={REPORT_CHART.secondary}
          strokeWidth={1.75}
          strokeDasharray="5 5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={netaPath}
          fill="none"
          stroke={REPORT_CHART.primary}
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="dark:[stroke:#fda4af]"
        />

        {months.map((m, i) => {
          const selected = highlightYearMonth === m.yearMonth;
          const up = m.gananciaNeta > 0;
          const down = m.gananciaNeta < 0;
          const dotStroke = up
            ? REPORT_CHART.positive
            : down
              ? REPORT_CHART.negative
              : REPORT_CHART.primary;
          return (
            <g key={m.yearMonth}>
              <a
                href={monthHref(m.yearMonth, m.isCurrent)}
                aria-label={`${m.label}: ${formatNeta(m.gananciaNeta)}`}
              >
                {selected ? (
                  <circle
                    cx={xAt(i)}
                    cy={yAt(m.gananciaNeta)}
                    r={10}
                    fill={REPORT_CHART.primary}
                    fillOpacity={0.12}
                    className="dark:[fill:#fda4af] dark:[fill-opacity:0.18]"
                  />
                ) : null}
                <circle
                  cx={xAt(i)}
                  cy={yAt(m.gananciaNeta)}
                  r={selected ? 4.5 : 3.5}
                  fill="#09090b"
                  stroke={dotStroke}
                  strokeWidth={1.75}
                  className="dark:fill-zinc-950"
                />
                <title>{`${m.label}: ${formatNeta(m.gananciaNeta)}`}</title>
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
                style={{ fontSize: "10px", fontWeight: selected || m.isCurrent ? 600 : 400 }}
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
          Resultado neto
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-0 w-4 border-t border-dashed"
            style={{ borderColor: REPORT_CHART.secondary }}
            aria-hidden
          />
          Ganancia bruta
        </span>
      </div>

      {/* Acceso táctil / teclado a cada mes (complementa los puntos del SVG). */}
      <nav
        className="sr-only"
        aria-label="Abrir resultado de un mes"
      >
        {months.map((m) => (
          <Link key={m.yearMonth} href={monthHref(m.yearMonth, m.isCurrent)}>
            {m.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
