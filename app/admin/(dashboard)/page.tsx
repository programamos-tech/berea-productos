import { Suspense } from "react";
import { ReportsPeriodFilter } from "@/components/admin/ReportsPeriodFilter";
import { ReportsVistaFilter } from "@/components/admin/ReportsVistaFilter";
import { ReportsAleyaExportButton } from "@/components/admin/ReportsAleyaExportButton";
import { ReportsDashboardBody } from "@/components/admin/ReportsDashboardBody";
import { ReportsHeaderMeta } from "@/components/admin/ReportsHeaderMeta";
import { ReportsRefreshButton } from "@/components/admin/ReportsRefreshButton";
import {
  currentYearMonthInReportStore,
  parseReportRangeFromSearchParams,
  parseReportVistaFromSearchParams,
  prettyReportPeriodLabel,
  prettyYearMonthLabel,
  reportDataFetchYmdRange,
  reportMonthToDateRange,
  reportSalesTrendWeekRanges,
  todayYmdInReportStore,
} from "@/lib/admin-report-range";
import { adminLandingPath } from "@/lib/admin-landing";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** TopBar h-14/h-16 + main padding p-3/p-4/p-6 */
const reportsViewportClass =
  "flex h-[calc(100dvh-3.5rem-1.5rem)] flex-col gap-2.5 overflow-x-hidden overflow-y-auto sm:h-[calc(100dvh-4rem-2rem)] md:h-[calc(100dvh-4rem-3rem)] lg:overflow-hidden";

function ReportsDashboardSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4" role="status">
      <span className="sr-only">Cargando reportes…</span>
      <div className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg bg-zinc-100/50 dark:bg-zinc-900/50 motion-reduce:animate-none"
          />
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 border-t border-zinc-200/70 pt-4 dark:border-zinc-800 lg:grid-cols-12">
        <div className="min-h-[12rem] animate-pulse rounded-lg bg-zinc-100/40 dark:bg-zinc-900/40 motion-reduce:animate-none lg:col-span-5" />
        <div className="min-h-[12rem] animate-pulse rounded-lg bg-zinc-100/40 dark:bg-zinc-900/40 motion-reduce:animate-none lg:col-span-3" />
        <div className="min-h-[12rem] animate-pulse rounded-lg bg-zinc-100/40 dark:bg-zinc-900/40 motion-reduce:animate-none lg:col-span-4" />
      </div>
    </div>
  );
}

function ReportsFiltersSkeleton() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-zinc-200/80 dark:bg-zinc-800/90 motion-reduce:animate-none" />
      <div className="h-8 w-28 animate-pulse rounded-lg bg-zinc-200/80 dark:bg-zinc-800/90 motion-reduce:animate-none" />
    </div>
  );
}

export default async function AdminHomePage({ searchParams }: PageProps) {
  const perm = await loadAdminPermissions();
  if (!perm) redirect("/admin/login");
  if (!perm.permissions.inicio_reportes) {
    redirect(adminLandingPath(perm.permissions));
  }

  const sp = await searchParams;
  const todayKey = todayYmdInReportStore();
  const vista = parseReportVistaFromSearchParams(sp);
  const urlRange = parseReportRangeFromSearchParams(sp, todayKey);
  const { from: rangeFrom, to: rangeTo } =
    vista === "tienda" ? reportMonthToDateRange(todayKey) : urlRange;
  const periodLabel =
    vista === "tienda"
      ? prettyYearMonthLabel(rangeFrom.slice(0, 7))
      : prettyReportPeriodLabel(rangeFrom, rangeTo, todayKey);
  const headerMonthLabel =
    vista === "tienda"
      ? prettyYearMonthLabel(todayKey.slice(0, 7))
      : rangeFrom.slice(0, 7) === rangeTo.slice(0, 7)
        ? prettyYearMonthLabel(rangeFrom.slice(0, 7))
        : periodLabel;
  const {
    currentFrom: salesTrendCurrentFrom,
    currentTo: salesTrendCurrentTo,
    priorFrom: salesTrendPriorFrom,
    priorTo: salesTrendPriorTo,
    chartFrom,
    chartTo,
  } = reportSalesTrendWeekRanges(todayKey);
  const { fetchFrom, fetchTo } = reportDataFetchYmdRange(
    rangeFrom,
    rangeTo,
    chartFrom,
    chartTo,
  );

  return (
    <div className={reportsViewportClass}>
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 gap-y-2">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-rose-950 dark:text-zinc-100 sm:text-xl">
            Reportes
          </h1>
          <ReportsHeaderMeta monthLabel={headerMonthLabel} />
        </div>
        <Suspense fallback={<ReportsFiltersSkeleton />}>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ReportsVistaFilter vista={vista} />
            <ReportsAleyaExportButton
              defaultYearMonth={
                rangeFrom.slice(0, 7) === rangeTo.slice(0, 7)
                  ? rangeFrom.slice(0, 7)
                  : currentYearMonthInReportStore()
              }
            />
            {vista === "tienda" ? (
              <ReportsRefreshButton />
            ) : (
              <ReportsPeriodFilter
                rangeFrom={rangeFrom}
                rangeTo={rangeTo}
                todayKey={todayKey}
              />
            )}
          </div>
        </Suspense>
      </header>

      <Suspense
        key={`${vista}-${rangeFrom}-${rangeTo}`}
        fallback={<ReportsDashboardSkeleton />}
      >
        <ReportsDashboardBody
          rangeFrom={rangeFrom}
          rangeTo={rangeTo}
          chartFrom={chartFrom}
          chartTo={chartTo}
          salesTrendCurrentFrom={salesTrendCurrentFrom}
          salesTrendCurrentTo={salesTrendCurrentTo}
          salesTrendPriorFrom={salesTrendPriorFrom}
          salesTrendPriorTo={salesTrendPriorTo}
          fetchFrom={fetchFrom}
          fetchTo={fetchTo}
          periodLabel={periodLabel}
          todayKey={todayKey}
          vista={vista}
        />
      </Suspense>
    </div>
  );
}
