import { formatCop } from "@/lib/money";
import { REPORT_CHART } from "@/components/admin/ReportSalesWeekTrendChart";

export function ReportPaymentDonut({
  efectivoCents,
  transferenciaCents,
  flat = false,
  mini = false,
}: {
  efectivoCents: number;
  transferenciaCents: number;
  flat?: boolean;
  mini?: boolean;
}) {
  const efectivo = Math.max(0, efectivoCents);
  const transferencia = Math.max(0, transferenciaCents);
  const total = efectivo + transferencia;

  const slices = [
    { label: "Transferencia", cents: transferencia, color: REPORT_CHART.positive },
    { label: "Efectivo", cents: efectivo, color: REPORT_CHART.primary },
  ].filter((s) => s.cents > 0);

  const dominant = slices[0] ?? { label: "Sin cobros", cents: 0, color: REPORT_CHART.secondary };
  const dominantPct =
    total > 0 ? Math.round((dominant.cents / total) * 1000) / 10 : 0;

  const size = mini ? 88 : flat ? 132 : 160;
  const stroke = mini ? 14 : 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Formas de pago
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">Mix del periodo</p>
      </div>

      <div
        className={`flex min-h-0 flex-1 items-center gap-4 ${
          mini ? "flex-row pt-2" : "flex-col justify-center pt-2 sm:flex-row"
        }`}
      >
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              className="stroke-zinc-200 dark:stroke-zinc-800"
              strokeWidth={stroke}
            />
            {total > 0
              ? slices.map((s) => {
                  const len = (s.cents / total) * c;
                  const el = (
                    <circle
                      key={s.label}
                      cx={size / 2}
                      cy={size / 2}
                      r={r}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={stroke}
                      strokeDasharray={`${len} ${c - len}`}
                      strokeDashoffset={-offset}
                    />
                  );
                  offset += len;
                  return el;
                })
              : null}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className={`font-semibold tabular-nums text-zinc-900 dark:text-zinc-50 ${mini ? "text-sm" : "text-lg"}`}>
              {dominantPct}%
            </p>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-1.5">
          {[
            { label: "Transferencia", cents: transferencia, color: REPORT_CHART.positive },
            { label: "Efectivo", cents: efectivo, color: REPORT_CHART.primary },
          ].map((row) => {
            const pct = total > 0 ? Math.round((row.cents / total) * 1000) / 10 : 0;
            return (
              <li key={row.label} className="flex items-center justify-between gap-2 text-xs">
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className="truncate text-zinc-700 dark:text-zinc-300">{row.label}</span>
                </span>
                <span className="shrink-0 tabular-nums text-zinc-500">
                  {pct}%
                  {!mini ? (
                    <span className="ml-1.5 text-zinc-600">· {formatCop(row.cents)}</span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
