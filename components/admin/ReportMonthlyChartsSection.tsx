import { ReportMonthlyResultChart } from "@/components/admin/ReportMonthlyResultChart";
import { ReportTopsCards } from "@/components/admin/ReportTopsCards";
import {
  fetchAdminReportMonthlyPulse,
  pulseHighlightYearMonth,
} from "@/lib/admin-report-monthly-pulse";
import { fetchAdminReportTops } from "@/lib/admin-report-tops";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function ReportMonthlyChartsSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3" role="status">
      <div className="min-h-[12rem] flex-1 animate-pulse rounded-2xl bg-zinc-100/40 dark:bg-zinc-900/40" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="h-40 animate-pulse rounded-xl bg-zinc-100/40 dark:bg-zinc-900/40" />
        <div className="h-40 animate-pulse rounded-xl bg-zinc-100/40 dark:bg-zinc-900/40" />
      </div>
      <span className="sr-only">Cargando gráficas…</span>
    </div>
  );
}

export async function ReportMonthlyChartsSection({
  todayKey,
  rangeFrom,
  rangeTo,
  periodLabel,
}: {
  todayKey: string;
  rangeFrom: string;
  rangeTo: string;
  periodLabel: string;
}) {
  try {
    const supabase = await createSupabaseServerClient();
    const [pulse, tops] = await Promise.all([
      fetchAdminReportMonthlyPulse(supabase, { todayYmd: todayKey }),
      fetchAdminReportTops(supabase, rangeFrom, rangeTo, 5),
    ]);

    const periodHint =
      rangeFrom === rangeTo ? periodLabel : `En ${periodLabel}`;

    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div
          className="reports-chart-reveal min-h-0 flex-[1.2]"
          style={{ ["--reports-chart-delay" as string]: "100ms" }}
        >
          <ReportMonthlyResultChart
            months={pulse.months}
            highlightYearMonth={pulseHighlightYearMonth(
              rangeFrom,
              rangeTo,
              todayKey,
            )}
          />
        </div>
        <div
          className="reports-chart-reveal min-h-0 shrink-0"
          style={{ ["--reports-chart-delay" as string]: "160ms" }}
        >
          <ReportTopsCards
            clients={tops.clients}
            products={tops.products}
            periodHint={periodHint}
          />
        </div>
      </div>
    );
  } catch (err) {
    console.error("[admin reportes] monthly charts:", err);
    return (
      <p className="text-sm text-amber-700 dark:text-amber-300">
        No se pudieron cargar las gráficas del periodo.
      </p>
    );
  }
}
