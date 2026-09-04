/** Mini sparkline for KPI cards. */
export function ReportSparkline({
  values,
  tone = "rose",
  className = "",
}: {
  values: number[];
  tone?: "rose" | "emerald" | "red" | "amber";
  className?: string;
}) {
  const clean = values.map((v) => Math.max(0, Number(v) || 0));
  if (clean.length < 2) return null;

  const w = 88;
  const h = 28;
  const max = Math.max(...clean, 1);
  const min = Math.min(...clean);
  const span = Math.max(max - min, 1);
  const pts = clean.map((v, i) => {
    const x = (i / (clean.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return { x, y };
  });

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

  const stroke =
    tone === "emerald"
      ? "stroke-emerald-500 dark:stroke-emerald-400"
      : tone === "red"
        ? "stroke-red-500 dark:stroke-red-400"
        : tone === "amber"
          ? "stroke-amber-600 dark:stroke-amber-400"
          : "stroke-rose-800 dark:stroke-rose-300";

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={`h-7 w-[5.5rem] overflow-visible ${className}`}
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        className={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ReportDeltaBadge({
  percent,
}: {
  percent: number | null | undefined;
}) {
  if (percent == null || !Number.isFinite(percent)) return null;
  const up = percent > 0;
  const down = percent < 0;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums ${
        up
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
          : down
            ? "bg-red-50 text-red-700 dark:bg-red-950/45 dark:text-red-300"
            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
      }`}
    >
      {up ? "▴ " : down ? "▾ " : ""}
      {up ? "+" : ""}
      {percent}%
    </span>
  );
}
