import { StaticCopCents } from "@/components/admin/ReportsAnimatedFigures";
import {
  ReportDeltaBadge,
  ReportSparkline,
} from "@/components/admin/ReportSparkline";

const cardClass =
  "reports-metric-card flex min-w-0 flex-col justify-between rounded-2xl border border-rose-200/45 bg-white p-3.5 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900 sm:p-4";

const labelClass =
  "text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400";

export function ReportKpiCard({
  label,
  cents,
  hint,
  sparkline,
  sparkTone = "rose",
  deltaPercent,
  staggerMs = 0,
  valueClassName,
}: {
  label: string;
  cents: number;
  hint?: string;
  sparkline?: number[];
  sparkTone?: "rose" | "emerald" | "red" | "amber";
  deltaPercent?: number | null;
  staggerMs?: number;
  valueClassName?: string;
}) {
  return (
    <div className={cardClass} style={{ ["--reports-stagger" as string]: `${staggerMs}ms` }}>
      <div className="flex items-start justify-between gap-2">
        <p className={labelClass}>{label}</p>
        <ReportDeltaBadge percent={deltaPercent} />
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p
            className={`text-xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl ${valueClassName ?? ""}`}
          >
            <StaticCopCents cents={cents} />
          </p>
          {hint ? (
            <p className="mt-1 truncate text-[11px] leading-snug text-zinc-400 dark:text-zinc-500">
              {hint}
            </p>
          ) : null}
        </div>
        {sparkline && sparkline.length > 1 ? (
          <ReportSparkline values={sparkline} tone={sparkTone} className="mb-0.5 shrink-0" />
        ) : null}
      </div>
    </div>
  );
}
