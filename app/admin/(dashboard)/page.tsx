import { Suspense } from "react";
import { ReportsPeriodFilter } from "@/components/admin/ReportsPeriodFilter";
import { ReportsMonthFilter } from "@/components/admin/ReportsMonthFilter";
import { ReportsVistaFilter } from "@/components/admin/ReportsVistaFilter";
import { ReportsAleyaExportButton } from "@/components/admin/ReportsAleyaExportButton";
import { ReportsDashboardBody } from "@/components/admin/ReportsDashboardBody";
import { ReportsHeaderMeta } from "@/components/admin/ReportsHeaderMeta";
import { ReportsRefreshButton } from "@/components/admin/ReportsRefreshButton";
import {
  currentYearMonthInReportStore,
  parseReportRangeFromSearchParams,
  parseReportTiendaMonthFromSearchParams,
  parseReportVistaFromSearchParams,
  prettyReportPeriodLabel,
  prettyYearMonthLabel,
  reportDataFetchYmdRange,
  reportSalesTrendWeekRanges,
  reportTiendaMonthRange,
  todayYmdInReportStore,
} from "@/lib/admin-report-range";
import { adminLandingPath } from "@/lib/admin-landing";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import { adminPageTitleClass } from "@/lib/admin-ui";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** TopBar h-14/h-16 + main padding. Mobile/tablet: scroll; desktop: viewport lock. */
const reportsViewportClass =
  "flex min-h-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto lg:h-[calc(100dvh-4rem-3rem)] lg:gap-2.5 lg:overflow-hidden";

function ReportsDashboardSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4" role="status">
      <span className="sr-only">Cargando reportes…</span>
      <div className="grid shrink-0 grid-cols-2 gap-x-4 gap-y-4 sm:gap-x-6 sm:gap-y-5 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg bg-zinc-100/50 dark:bg-zinc-900/50 motion-reduce:animate-none"
          />
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 border-t border-zinc-200/70 pt-4 dark:border-zinc-800 lg:grid-cols-12 lg:gap-6">
        <div className="min-h-[16rem] animate-pulse rounded-lg bg-zinc-100/40 dark:bg-zinc-900/40 motion-reduce:animate-none lg:col-span-7" />
        <div className="min-h-[14rem] max-h-[min(24rem,60vh)] animate-pulse rounded-lg bg-zinc-100/40 dark:bg-zinc-900/40 motion-reduce:animate-none lg:col-span-5 lg:max-h-none" />
      </div>
    </div>
  );
}

function ReportsFiltersSkeleton() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <div className="h-10 w-40 animate-pulse rounded-lg bg-zinc-200/80 dark:bg-zinc-800/90 motion-reduce:animate-none" />
      <div className="h-10 w-28 animate-pulse rounded-lg bg-zinc-200/80 dark:bg-zinc-800/90 motion-reduce:animate-none" />
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
  const currentYm = currentYearMonthInReportStore();
  const vista = parseReportVistaFromSearchParams(sp);
  const tiendaYm = parseReportTiendaMonthFromSearchParams(sp, todayKey);
  const urlRange = parseReportRangeFromSearchParams(sp, todayKey);
  const { from: rangeFrom, to: rangeTo } =
    vista === "tienda"
      ? reportTiendaMonthRange(tiendaYm, todayKey)
      : urlRange;
  const isCurrentTiendaMonth = vista === "tienda" && tiendaYm === currentYm;
  const periodLabel =
    vista === "tienda"
      ? isCurrentTiendaMonth
        ? `${prettyYearMonthLabel(tiendaYm)} · hasta hoy`
        : prettyYearMonthLabel(tiendaYm)
      : prettyReportPeriodLabel(rangeFrom, rangeTo, todayKey);
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
      <header className="flex w-full shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <h1 className={`whitespace-nowrap ${adminPageTitleClass}`}>
            Reportes
          </h1>
          <ReportsHeaderMeta
            vista={vista}
            periodLabel={periodLabel}
            isCurrentTiendaMonth={isCurrentTiendaMonth}
          />
        </div>
        <Suspense fallback={<ReportsFiltersSkeleton />}>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            <ReportsVistaFilter vista={vista} />
            {vista === "tienda" ? (
              <ReportsMonthFilter selectedYm={tiendaYm} currentYm={currentYm} />
            ) : (
              <ReportsPeriodFilter
                rangeFrom={rangeFrom}
                rangeTo={rangeTo}
                todayKey={todayKey}
              />
            )}
            <ReportsAleyaExportButton
              defaultYearMonth={
                rangeFrom.slice(0, 7) === rangeTo.slice(0, 7)
                  ? rangeFrom.slice(0, 7)
                  : currentYm
              }
            />
            <ReportsRefreshButton />
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
