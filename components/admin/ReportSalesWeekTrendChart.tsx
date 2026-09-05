import { TrendingDown, TrendingUp } from "lucide-react";
import { formatCop, formatCopCompact } from "@/lib/money";
import type { TicketTrendPoint } from "@/lib/customer-ticket-trend";
import type { ReportSalesTrendComparison } from "@/lib/admin-reports-data";

/** Shared report chart palette — zinc primary; emerald/red for pos/neg. */
export const REPORT_CHART = {
  primary: "#52525b",
  primaryDark: "#a1a1aa",
  secondary: "#a1a1aa",
  secondaryDark: "#71717a",
  grid: "#27272a",
  gridLight: "#f4f4f5",
  positive: "#10b981",
  negative: "#ef4444",
} as const;

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
  mini = false,
}: {
  points: TicketTrendPoint[];
  comparison: ReportSalesTrendComparison;
  fillGradientId?: string;
  compact?: boolean;
  /** Ultra-compact for the reports sidebar strip */
  mini?: boolean;
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
  const chartH = mini ? 120 : compact ? 180 : 280;
  const padL = mini ? 36 : compact ? 44 : 56;
  const padR = 12;
  const padT = mini ? 8 : 12;
  const padB = mini ? 24 : compact ? 32 : 44;
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

  const gridSteps = mini ? 2 : 4;
  const yTicks: number[] = [];
  for (let s = 0; s <= gridSteps; s += 1) yTicks.push((yMax * s) / gridSteps);

  const { changePercent, currentTotalCents, priorTotalCents } = comparison;
  const improving = changePercent != null && changePercent > 0;
  const declining = changePercent != null && changePercent < 0;
  const flat = changePercent === 0;

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col">
      {!mini ? (
        <div className="mb-1 flex shrink-0 flex-wrap items-end justify-between gap-2">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Este periodo
              </p>
              <p className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50 sm:text-base">
                {formatCop(currentTotalCents)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Anterior
              </p>
              <p className="text-sm tabular-nums text-zinc-500 sm:text-base">
                {formatCop(priorTotalCents)}
              </p>
            </div>
          </div>
          {changePercent != null ? (
            <div
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                improving
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : declining
                    ? "bg-red-500/15 text-red-700 dark:text-red-300"
                    : "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300"
              }`}
            >
              {improving ? (
                <TrendingUp className="size-3" strokeWidth={2} aria-hidden />
              ) : declining ? (
                <TrendingDown className="size-3" strokeWidth={2} aria-hidden />
              ) : null}
              {flat ? "0%" : `${changePercent > 0 ? "+" : ""}${changePercent}%`}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mb-1 flex shrink-0 items-center justify-between gap-2">
          <p className="text-xs tabular-nums text-zinc-500">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {formatCopCompact(currentTotalCents)}
            </span>
            <span className="mx-1.5 text-zinc-600">/</span>
            {formatCopCompact(priorTotalCents)}
          </p>
          {changePercent != null ? (
            <span
              className={`text-[11px] font-semibold tabular-nums ${
                improving
                  ? "text-emerald-600 dark:text-emerald-400"
                  : declining
                    ? "text-red-600 dark:text-red-400"
                    : "text-zinc-500"
              }`}
            >
              {flat ? "0%" : `${changePercent > 0 ? "+" : ""}${changePercent}%`}
            </span>
          ) : null}
        </div>
      )}

      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        className="block min-h-0 w-full flex-1"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Ventas este periodo vs anterior"
      >
        <defs>
          <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
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
              {!mini ? (
                <text
                  x={padL - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-zinc-500"
                  style={{ fontSize: "10px" }}
                >
                  {formatCopCompact(Math.round(tick))}
                </text>
              ) : null}
            </g>
          );
        })}

        <path d={areaPath} fill={`url(#${fillGradientId})`} />
        <path
          d={priorPath}
          fill="none"
          stroke={REPORT_CHART.secondary}
          strokeWidth={1.75}
          strokeDasharray="5 5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={currentPath}
          fill="none"
          stroke={REPORT_CHART.primary}
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="dark:[stroke:#f87171]"
        />

        {trend.map((t, i) => (
          <g key={t.key}>
            <circle
              cx={xAt(i)}
              cy={yAt(t.currentValue)}
              r={mini ? 2.5 : 3.5}
              fill="#09090b"
              stroke={REPORT_CHART.primary}
              strokeWidth={1.5}
              className="dark:fill-zinc-950 dark:[stroke:#f87171]"
            />
          </g>
        ))}

        {trend.map((t, i) =>
          mini && i !== 0 && i !== trend.length - 1 && i % 2 === 1 ? null : (
            <text
              key={`x-${t.key}`}
              x={xAt(i)}
              y={chartH - 6}
              textAnchor="middle"
              className="fill-zinc-500"
              style={{ fontSize: mini ? "9px" : "10px" }}
            >
              {xLabelForPoint(t)}
            </text>
          ),
        )}
      </svg>
    </div>
  );
}
