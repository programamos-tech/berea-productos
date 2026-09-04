import { formatCop } from "@/lib/money";

type Slice = {
  label: string;
  cents: number;
  color: string;
};

export function ReportPaymentDonut({
  efectivoCents,
  transferenciaCents,
}: {
  efectivoCents: number;
  transferenciaCents: number;
}) {
  const efectivo = Math.max(0, efectivoCents);
  const transferencia = Math.max(0, transferenciaCents);
  const total = efectivo + transferencia;
  const slices: Slice[] = [
    {
      label: "Transferencia",
      cents: transferencia,
      color: "var(--donut-transfer, #0f766e)",
    },
    {
      label: "Efectivo",
      cents: efectivo,
      color: "var(--donut-cash, #881337)",
    },
  ].filter((s) => s.cents > 0);

  const dominant = slices[0] ?? {
    label: "Sin cobros",
    cents: 0,
    color: "#a1a1aa",
  };
  const dominantPct = total > 0 ? Math.round((dominant.cents / total) * 1000) / 10 : 0;

  const size = 160;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <section className="reports-chart-reveal flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-rose-200/45 bg-white shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900">
      <div className="flex shrink-0 items-start justify-between gap-2 px-4 pt-3.5 sm:px-5">
        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
            Formas de pago
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
            Mix del periodo
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4 pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div
          className="relative shrink-0 [--donut-cash:#881337] [--donut-transfer:#0f766e] dark:[--donut-cash:#fb7185] dark:[--donut-transfer:#2dd4bf]"
          style={{ width: size, height: size }}
        >
          <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              className="stroke-zinc-100 dark:stroke-zinc-800"
              strokeWidth={stroke}
            />
            {total > 0
              ? slices.map((s) => {
                  const len = (s.cents / total) * c;
                  const dash = `${len} ${c - len}`;
                  const el = (
                    <circle
                      key={s.label}
                      cx={size / 2}
                      cy={size / 2}
                      r={r}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={stroke}
                      strokeDasharray={dash}
                      strokeDashoffset={-offset}
                      strokeLinecap="butt"
                    />
                  );
                  offset += len;
                  return el;
                })
              : null}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
              {dominantPct}%
            </p>
            <p className="mt-0.5 max-w-[6.5rem] truncate text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
              {dominant.label}
            </p>
          </div>
        </div>

        <ul className="w-full min-w-0 space-y-2.5 sm:w-auto sm:min-w-[8.5rem]">
          {[
            {
              label: "Transferencia",
              cents: transferencia,
              swatch: "bg-teal-700 dark:bg-teal-400",
            },
            {
              label: "Efectivo",
              cents: efectivo,
              swatch: "bg-rose-900 dark:bg-rose-400",
            },
          ].map((row) => {
            const pct = total > 0 ? Math.round((row.cents / total) * 1000) / 10 : 0;
            return (
              <li key={row.label} className="flex items-start gap-2">
                <span className={`mt-1 size-2.5 shrink-0 rounded-full ${row.swatch}`} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    {row.label}
                  </p>
                  <p className="text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
                    {pct}% · {formatCop(row.cents)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
