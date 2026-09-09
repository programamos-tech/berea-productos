import { ReportMonthlyResultChart } from "@/components/admin/ReportMonthlyResultChart";
import { ReportTopsCards } from "@/components/admin/ReportTopsCards";
import {
  fetchAdminReportMonthlyPulse,
  pulseHighlightYearMonth,
} from "@/lib/admin-report-monthly-pulse";
import { fetchAdminReportTops } from "@/lib/admin-report-tops";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cache, Suspense } from "react";

export function ReportMonthlyChartsSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4" role="status">
      <div
        className="w-full animate-pulse rounded-2xl bg-zinc-100/40 dark:bg-zinc-900/40"
        style={{ aspectRatio: "1000 / 260" }}
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
        <div className="h-40 animate-pulse rounded-xl bg-zinc-100/40 dark:bg-zinc-900/40" />
        <div className="h-40 animate-pulse rounded-xl bg-zinc-100/40 dark:bg-zinc-900/40" />
      </div>
      <span className="sr-only">Cargando gráficas…</span>
    </div>
  );
}

function ReportPulseChartSkeleton() {
  return (
    <div
      className="w-full animate-pulse rounded-2xl bg-zinc-100/40 dark:bg-zinc-900/40"
      style={{ aspectRatio: "1000 / 260" }}
      role="status"
    >
      <span className="sr-only">Cargando gráfica mensual…</span>
    </div>
  );
}

function ReportTopsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4" role="status">
      <div className="h-40 animate-pulse rounded-xl bg-zinc-100/40 dark:bg-zinc-900/40" />
      <div className="h-40 animate-pulse rounded-xl bg-zinc-100/40 dark:bg-zinc-900/40" />
      <span className="sr-only">Cargando tops…</span>
    </div>
  );
}

/** Deduplica el pulso si chart + otra sección lo piden en el mismo request. */
const getMonthlyPulse = cache(async (todayKey: string) => {
  const supabase = await createSupabaseServerClient();
  return fetchAdminReportMonthlyPulse(supabase, { todayYmd: todayKey });
});

async function ReportPulseChart({
  todayKey,
  rangeFrom,
  rangeTo,
}: {
  todayKey: string;
  rangeFrom: string;
  rangeTo: string;
}) {
  try {
    const pulse = await getMonthlyPulse(todayKey);
    return (
      <div className="reports-chart-reveal w-full min-w-0 shrink-0">
        <ReportMonthlyResultChart
          months={pulse.months}
          highlightYearMonth={pulseHighlightYearMonth(
            rangeFrom,
            rangeTo,
            todayKey,
          )}
        />
      </div>
    );
  } catch (err) {
    console.error("[admin reportes] monthly pulse:", err);
    return (
      <p className="text-sm text-amber-700 dark:text-amber-300">
        No se pudo cargar la gráfica mensual.
      </p>
    );
  }
}

async function ReportTopsSection({
  rangeFrom,
  rangeTo,
  periodLabel,
}: {
  rangeFrom: string;
  rangeTo: string;
  periodLabel: string;
}) {
  try {
    const supabase = await createSupabaseServerClient();
    const tops = await fetchAdminReportTops(supabase, rangeFrom, rangeTo, 5);
    const periodHint =
      rangeFrom === rangeTo ? periodLabel : `En ${periodLabel}`;
    return (
      <ReportTopsCards
        clients={tops.clients}
        products={tops.products}
        periodHint={periodHint}
      />
    );
  } catch (err) {
    console.error("[admin reportes] tops:", err);
    return null;
  }
}

/**
 * Gráfica mensual (RPC rápido) + tops en Suspense aparte.
 * No await aquí: el chart y los tops streamean por separado.
 */
export function ReportMonthlyChartsSection({
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
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <Suspense fallback={<ReportPulseChartSkeleton />}>
        <ReportPulseChart
          todayKey={todayKey}
          rangeFrom={rangeFrom}
          rangeTo={rangeTo}
        />
      </Suspense>
      <div className="w-full min-w-0 shrink-0">
        <Suspense
          key={`tops-${rangeFrom}-${rangeTo}`}
          fallback={<ReportTopsSkeleton />}
        >
          <ReportTopsSection
            rangeFrom={rangeFrom}
            rangeTo={rangeTo}
            periodLabel={periodLabel}
          />
        </Suspense>
      </div>
    </div>
  );
}
