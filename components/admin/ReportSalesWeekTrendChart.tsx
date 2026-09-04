import { TrendingDown, TrendingUp } from "lucide-react";
import { formatCop, formatCopCompact } from "@/lib/money";
import type { TicketTrendPoint } from "@/lib/customer-ticket-trend";
import type { ReportSalesTrendComparison } from "@/lib/admin-reports-data";

function xLabelForPoint(p: TicketTrendPoint) {
  if (p.labelX) return p.labelX;
  if (/^\d{4}-\d{2}-\d{2}$/.test(p.monthKey)) {
    return new Date(`${p.monthKey}T12:00:00`).toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
    });
  }
  return p.monthKey.slice(0, 8);
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

export function ReportSalesWeekTrendChart({
  points,
  comparison,
  fillGradientId = "reportsSalesWeekTrendFill",
  compact = false,
}: {
  points: TicketTrendPoint[];
  comparison: ReportSalesTrendComparison;
  fillGradientId?: string;
  compact?: boolean;
}) {
  if (points.length === 0) return null;

  const trend = points.map((p) => ({
    ...p,
    currentValue: p.avgCents,
    priorValue: Math.max(0, Math.floor(Number(p.priorWeekCents ?? 0))),
    key: p.monthKey,
  }));

  const maxIncome = Math.max(
    ...trend.map((t) => t.currentValue),
    ...trend.map((t) => t.priorValue),
    0,
  );
  const yMax = (maxIncome > 0 ? maxIncome : 1) * 1.08;

  const chartW = 1000;
  const chartH = compact ? 220 : 280;
  const padL = compact ? 48 : 56;
  const padR = 16;
  const padT = compact ? 12 : 18;
  const padB = compact ? 36 : 44;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const xAt = (i: number) => {
    if (trend.length === 1) return padL + plotW / 2;
    return padL + (i / Math.max(1, trend.length - 1)) * plotW;
  };
  const yAt = (v: number) => padT + plotH - (v / yMax) * plotH;

  const currentPts = trend.map((t, i) => ({ x: xAt(i), y: yAt(t.currentValue) }));
  const priorPts = trend.map((t, i) => ({ x: xAt(i), y: yAt(t.priorValue) }));
  const currentPath = smoothLine(currentPts);
  const priorPath = smoothLine(priorPts);

  const areaPath =
    currentPts.length > 0
      ? `${currentPath} L ${currentPts[currentPts.length - 1].x} ${padT + plotH} L ${currentPts[0].x} ${padT + plotH} Z`
      : "";

  const gridSteps = 4;
  const yTicks: number[] = [];
  for (let s = 0; s <= gridSteps; s += 1) yTicks.push((yMax * s) / gridSteps);

  const { changePercent, currentTotalCents, priorTotalCents } = comparison;
  const improving = changePercent != null && changePercent > 0;
  const declining = changePercent != null && changePercent < 0;
  const flat = changePercent === 0;

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col">
      <div
        className={`flex shrink-0 flex-wrap items-end justify-between gap-3 ${
          compact ? "px-4 pb-1 pt-1 sm:px-5" : "px-6 pb-2 sm:px-8"
        }`}
      >
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Este periodo
            </p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50 sm:text-xl">
              {formatCop(currentTotalCents)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Periodo anterior
            </p>
            <p className="mt-0.5 text-base tabular-nums text-zinc-400 dark:text-zinc-500 sm:text-lg">
              {formatCop(priorTotalCents)}
            </p>
          </div>
        </div>

        {changePercent != null ? (
          <div
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${
              improving
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                : declining
                  ? "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {improving ? (
              <TrendingUp className="size-3.5" strokeWidth={2} aria-hidden />
            ) : declining ? (
              <TrendingDown className="size-3.5" strokeWidth={2} aria-hidden />
            ) : null}
            {flat ? "0%" : `${changePercent > 0 ? "+" : ""}${changePercent}%`}
          </div>
        ) : null}
      </div>

      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        className="block min-h-0 w-full flex-1"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Ventas: este periodo vs anterior"
      >
        <defs>
          <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9f1239" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#9f1239" stopOpacity="0" />
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
                  className="stroke-zinc-100 dark:stroke-zinc-800"
                  strokeWidth={1}
                />
              ) : null}
              <text
                x={padL - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-zinc-400 dark:fill-zinc-500"
                style={{ fontSize: "11px" }}
              >
                {formatCopCompact(Math.round(tick))}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill={`url(#${fillGradientId})`} />
        <path
          d={priorPath}
          fill="none"
          stroke="#d6d3d1"
          strokeWidth={2.25}
          strokeDasharray="7 6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="dark:stroke-zinc-600"
        />
        <path
          d={currentPath}
          fill="none"
          stroke="#9f1239"
          strokeWidth={2.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="dark:stroke-rose-300"
        />

        {trend.map((t, i) => (
          <g key={t.key}>
            <title>
              {`${xLabelForPoint(t)}: ${formatCop(t.currentValue)} · ant. ${formatCop(t.priorValue)}`}
            </title>
            <circle
              cx={xAt(i)}
              cy={yAt(t.priorValue)}
              r={3}
              className="fill-white stroke-zinc-300 dark:fill-zinc-900 dark:stroke-zinc-500"
              strokeWidth={1.5}
            />
            <circle
              cx={xAt(i)}
              cy={yAt(t.currentValue)}
              r={4}
              className="fill-white stroke-rose-800 dark:fill-zinc-900 dark:stroke-rose-300"
              strokeWidth={2}
            />
          </g>
        ))}

        {trend.map((t, i) => (
          <text
            key={`x-${t.key}`}
            x={xAt(i)}
            y={chartH - 10}
            textAnchor="middle"
            className="fill-zinc-500 dark:fill-zinc-400"
            style={{ fontSize: "11px" }}
          >
            {xLabelForPoint(t)}
          </text>
        ))}
      </svg>
    </div>
  );
}
