import { Suspense } from "react";
import { ReportsPeriodFilter } from "@/components/admin/ReportsPeriodFilter";
import { ReportsMonthFilter } from "@/components/admin/ReportsMonthFilter";
import { ReportsVistaFilter } from "@/components/admin/ReportsVistaFilter";
import { ReportsAleyaExportButton } from "@/components/admin/ReportsAleyaExportButton";
import { ReportsDashboardBody } from "@/components/admin/ReportsDashboardBody";
import { ReportsHeaderMeta } from "@/components/admin/ReportsHeaderMeta";
import { ReportsRefreshButton } from "@/components/admin/ReportsRefreshButton";
import {
  ReportActivityFeed,
  ReportActivityFeedSkeleton,
} from "@/components/admin/ReportActivityFeed";
import {
  ReportMonthlyChartsSection,
  ReportMonthlyChartsSkeleton,
} from "@/components/admin/ReportMonthlyChartsSection";
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

/** Mobile/iPad: scroll de página (sin lock). Desktop xl+: alto de viewport con scroll interno si hace falta. */
const reportsViewportClass =
  "flex w-full min-w-0 flex-col gap-3 overflow-x-hidden pb-8 max-xl:overflow-visible xl:h-[calc(100dvh-4rem-3rem)] xl:min-h-0 xl:flex-1 xl:gap-2.5 xl:overflow-y-auto xl:overscroll-y-contain xl:pb-0";

function ReportsKpisSkeleton() {
  return (
    <div
      className="grid shrink-0 grid-cols-2 gap-x-4 gap-y-4 sm:gap-x-6 sm:gap-y-5 md:grid-cols-3 xl:grid-cols-6"
      role="status"
    >
      <span className="sr-only">Cargando métricas…</span>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-lg bg-zinc-100/50 dark:bg-zinc-900/50 motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}

function ReportsFiltersSkeleton() {
  return (
    <div className="flex w-full flex-nowrap items-center gap-2 overflow-x-auto xl:w-auto xl:justify-end">
      <div className="h-9 w-24 shrink-0 animate-pulse rounded-lg bg-zinc-200/80 dark:bg-zinc-800/90 motion-reduce:animate-none sm:w-32" />
      <div className="h-9 w-20 shrink-0 animate-pulse rounded-lg bg-zinc-200/80 dark:bg-zinc-800/90 motion-reduce:animate-none sm:w-24" />
      <div className="h-9 w-36 shrink-0 animate-pulse rounded-lg bg-zinc-200/80 dark:bg-zinc-800/90 motion-reduce:animate-none" />
      <div className="h-9 w-20 shrink-0 animate-pulse rounded-lg bg-zinc-200/80 dark:bg-zinc-800/90 motion-reduce:animate-none sm:w-24" />
      <div className="size-9 shrink-0 animate-pulse rounded-lg bg-zinc-200/80 dark:bg-zinc-800/90 motion-reduce:animate-none" />
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
  // Vista "por periodo": solo el rango elegido (antes se unía a 14 días hasta hoy
  // por un gráfico de tendencia que ya no se muestra → escaneos enormes).
  const { fetchFrom, fetchTo } =
    vista === "dia"
      ? { fetchFrom: rangeFrom, fetchTo: rangeTo }
      : reportDataFetchYmdRange(rangeFrom, rangeTo, chartFrom, chartTo);
  // En "por periodo" el RPC no necesita la ventana de tendencia semanal.
  const dashChartFrom = vista === "dia" ? rangeFrom : chartFrom;
  const dashChartTo = vista === "dia" ? rangeTo : chartTo;
  const dashTrendCurrentFrom =
    vista === "dia" ? rangeFrom : salesTrendCurrentFrom;
  const dashTrendCurrentTo = vista === "dia" ? rangeTo : salesTrendCurrentTo;
  const dashTrendPriorFrom = vista === "dia" ? rangeFrom : salesTrendPriorFrom;
  const dashTrendPriorTo = vista === "dia" ? rangeTo : salesTrendPriorTo;

  const streamKey = `${vista}-${rangeFrom}-${rangeTo}`;

  return (
    <div className={reportsViewportClass}>
      <header className="flex w-full shrink-0 flex-col gap-3 xl:flex-row xl:items-start xl:justify-between xl:gap-6">
        <div className="min-w-0 xl:max-w-md 2xl:max-w-lg">
          <h1 className={`leading-none ${adminPageTitleClass}`}>Reportes</h1>
          <ReportsHeaderMeta
            vista={vista}
            periodLabel={periodLabel}
            isCurrentTiendaMonth={isCurrentTiendaMonth}
          />
        </div>
        <Suspense fallback={<ReportsFiltersSkeleton />}>
          <div className="flex w-full min-w-0 flex-nowrap items-center gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] xl:w-auto xl:flex-1 xl:justify-end xl:overflow-visible [&::-webkit-scrollbar]:hidden">
            <ReportsVistaFilter vista={vista} todayKey={todayKey} />
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

      <div className="flex min-h-0 flex-1 flex-col gap-4 max-xl:flex-none">
        {/* KPIs y gráfica en paralelo: la chart ya no espera al dashboard agg. */}
        <Suspense key={`kpis-${streamKey}`} fallback={<ReportsKpisSkeleton />}>
          <ReportsDashboardBody
            rangeFrom={rangeFrom}
            rangeTo={rangeTo}
            chartFrom={dashChartFrom}
            chartTo={dashChartTo}
            salesTrendCurrentFrom={dashTrendCurrentFrom}
            salesTrendCurrentTo={dashTrendCurrentTo}
            salesTrendPriorFrom={dashTrendPriorFrom}
            salesTrendPriorTo={dashTrendPriorTo}
            fetchFrom={fetchFrom}
            fetchTo={fetchTo}
            periodLabel={periodLabel}
            todayKey={todayKey}
            vista={vista}
          />
        </Suspense>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 border-t border-zinc-200/70 pt-4 dark:border-zinc-800 max-xl:flex-none lg:grid-cols-12 lg:gap-6">
          <div className="flex min-h-0 min-w-0 flex-col lg:col-span-7 max-xl:min-h-0">
            <Suspense fallback={<ReportMonthlyChartsSkeleton />}>
              <ReportMonthlyChartsSection
                todayKey={todayKey}
                rangeFrom={rangeFrom}
                rangeTo={rangeTo}
                periodLabel={periodLabel}
              />
            </Suspense>
          </div>

          <section className="reports-chart-reveal flex max-h-[min(24rem,60vh)] min-h-[14rem] flex-col border-t border-zinc-200/70 pt-4 dark:border-zinc-800 sm:min-h-[16rem] lg:col-span-5 lg:max-h-none lg:min-h-0 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <Suspense fallback={<ReportActivityFeedSkeleton />}>
              <ReportActivityFeed />
            </Suspense>
          </section>
        </div>
      </div>
    </div>
  );
}
