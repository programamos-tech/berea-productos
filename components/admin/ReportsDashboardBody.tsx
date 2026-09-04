import { ReportLiquidityMetricCards } from "@/components/admin/ReportLiquidityMetricCards";
import {
  ReportMonthlyPulseSection,
  ReportMonthlyPulseSkeleton,
} from "@/components/admin/ReportMonthlyPulseSection";
import { ReportStockTrendLine } from "@/components/admin/ReportStockTrendLine";
import { ReportSalesWeekTrendChart } from "@/components/admin/ReportSalesWeekTrendChart";
import { StaticCopCents } from "@/components/admin/ReportsAnimatedFigures";
import {
  prettyReportDayShortLabel,
  type ReportVista,
} from "@/lib/admin-report-range";
import { fetchAdminReportDashboardData } from "@/lib/admin-reports-data";
import { fetchCashArrastreCentsForReportStart } from "@/lib/cash-register";
import { adminPanelLgClass } from "@/lib/admin-ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { formatCop } from "@/lib/money";

const labelClass =
  "text-[9px] font-semibold uppercase tracking-[0.14em] text-rose-900/40 dark:text-zinc-500";

function KpiShell({
  children,
  staggerMs,
}: {
  children: React.ReactNode;
  staggerMs: number;
}) {
  return (
    <div
      className="reports-metric-card min-w-0 rounded-xl border border-rose-200/35 bg-white/80 px-3 py-2.5 dark:border-zinc-700/70 dark:bg-zinc-900/80"
      style={{ ["--reports-stagger" as string]: `${staggerMs}ms` }}
    >
      {children}
    </div>
  );
}

export async function ReportsDashboardBody({
  rangeFrom,
  rangeTo,
  chartFrom,
  chartTo,
  salesTrendCurrentFrom,
  salesTrendCurrentTo,
  salesTrendPriorFrom,
  salesTrendPriorTo,
  fetchFrom,
  fetchTo,
  periodLabel,
  todayKey,
  vista,
}: {
  rangeFrom: string;
  rangeTo: string;
  chartFrom: string;
  chartTo: string;
  salesTrendCurrentFrom: string;
  salesTrendCurrentTo: string;
  salesTrendPriorFrom: string;
  salesTrendPriorTo: string;
  fetchFrom: string;
  fetchTo: string;
  periodLabel: string;
  todayKey: string;
  vista: ReportVista;
}) {
  let report;
  let arrastreEfectivoCents = 0;
  try {
    const supabase = await createSupabaseServerClient();
    const [dashboard, arrastre] = await Promise.all([
      fetchAdminReportDashboardData(supabase, {
        rangeFrom,
        rangeTo,
        chartFrom,
        chartTo,
        salesTrendCurrentFrom,
        salesTrendCurrentTo,
        salesTrendPriorFrom,
        salesTrendPriorTo,
        fetchFrom,
        fetchTo,
        periodLabel,
      }),
      vista === "tienda"
        ? fetchCashArrastreCentsForReportStart(supabase, rangeFrom)
        : Promise.resolve(0),
    ]);
    report = dashboard;
    arrastreEfectivoCents = arrastre;
  } catch (err) {
    console.error("[admin reportes] body:", err);
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-6 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
        <p className="font-semibold">No se pudieron cargar los reportes</p>
        <p className="mt-2">Recargá la página o probá de nuevo en unos segundos.</p>
      </div>
    );
  }

  if (report.ordersRangeError) {
    console.error("[admin reportes] orders:", report.ordersRangeError);
  }

  const {
    ingresosSinIvaPeriod,
    ingresosConIvaPeriod,
    ivaRecaudadoPeriod,
    gananciaBruta,
    gananciaNeta,
    totalCobradoPedidos,
    efectivo,
    transferencia,
    ventasPagadasPeriod,
    egresosPeriod,
    egresosEfectivoCents,
    egresosTransferenciaBucketCents,
    cantidadEgresosPeriod,
    transferenciaNeta,
    reportExpensesEfectivoLines,
    reportExpensesOtrosLines,
    reportIncomeChartPoints,
    salesTrendComparison,
    stockInversionNet,
    stockInversionGross,
    stockInvestmentTrend,
  } = report;

  const isTienda = vista === "tienda";
  const efectivoNetoPosicion =
    arrastreEfectivoCents + efectivo - egresosEfectivoCents;

  return (
    <div
      key={`reports-body-${vista}-${rangeFrom}-${rangeTo}`}
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden"
    >
      <div className="shrink-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className={labelClass}>
            {isTienda ? "Cómo va la tienda" : "Reporte del día"}
            <span className="mx-1.5 text-stone-300 dark:text-zinc-600">·</span>
            <span className="font-medium normal-case tracking-normal text-stone-500 dark:text-zinc-400">
              {periodLabel}
            </span>
          </p>
          <p className="text-[10px] text-stone-400 dark:text-zinc-500">
            {isTienda
              ? "Arrastre + cobros − egresos"
              : "Solo ventas y cobros"}
          </p>
        </div>

        <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          <KpiShell staggerMs={0}>
            <dt className={labelClass}>Ingresos</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-stone-900 dark:text-zinc-50 sm:text-xl">
              <StaticCopCents cents={ingresosConIvaPeriod} />
            </dd>
            <p className="mt-0.5 text-[10px] text-stone-400 dark:text-zinc-500">
              {ventasPagadasPeriod} venta{ventasPagadasPeriod === 1 ? "" : "s"} · IVA{" "}
              <span className="tabular-nums">{formatCop(ivaRecaudadoPeriod)}</span>
            </p>
            <p className="sr-only">Base sin IVA {formatCop(ingresosSinIvaPeriod)}</p>
          </KpiShell>

          <ReportLiquidityMetricCards
            cardLabelClass={labelClass}
            periodLabel={periodLabel}
            mode={isTienda ? "position" : "inflow"}
            totalCobradoPedidos={totalCobradoPedidos}
            efectivo={efectivo}
            efectivoNetoCaja={efectivoNetoPosicion}
            egresosEfectivoCents={egresosEfectivoCents}
            expensesEfectivo={reportExpensesEfectivoLines}
            transferencia={transferencia}
            transferenciaNeta={transferenciaNeta}
            egresosTransferenciaBucketCents={egresosTransferenciaBucketCents}
            expensesOtros={reportExpensesOtrosLines}
            arrastreEfectivoCents={arrastreEfectivoCents}
          />

          {isTienda ? (
            <KpiShell staggerMs={100}>
              <dt className={labelClass}>Egresos</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-stone-900 dark:text-zinc-50 sm:text-xl">
                <StaticCopCents cents={egresosPeriod} />
              </dd>
              <p className="mt-0.5 text-[10px] text-stone-400 dark:text-zinc-500">
                {cantidadEgresosPeriod} movimiento
                {cantidadEgresosPeriod === 1 ? "" : "s"}
              </p>
            </KpiShell>
          ) : null}

          <KpiShell staggerMs={140}>
            <dt className={labelClass}>Ganancia</dt>
            <dd className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-lg font-semibold tabular-nums tracking-tight text-stone-900 dark:text-zinc-50 sm:text-xl">
                <StaticCopCents cents={gananciaBruta} />
              </span>
              {isTienda ? (
                <span
                  className={`text-xs font-medium tabular-nums ${
                    gananciaNeta > 0
                      ? "text-emerald-700 dark:text-emerald-400"
                      : gananciaNeta < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-stone-400"
                  }`}
                >
                  neta <StaticCopCents cents={gananciaNeta} />
                </span>
              ) : (
                <span className="text-[10px] text-stone-400 dark:text-zinc-500">bruta</span>
              )}
            </dd>
            <p className="mt-0.5 text-[10px] text-stone-400 dark:text-zinc-500">
              {isTienda ? "Margen − egresos" : "Margen del periodo"}
            </p>
          </KpiShell>

          <KpiShell staggerMs={180}>
            <dt className={labelClass}>Stock</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-stone-900 dark:text-zinc-50 sm:text-xl">
              <StaticCopCents cents={stockInversionNet} />
            </dd>
            {stockInversionGross > 0 ? (
              <p className="mt-0.5 text-[10px] tabular-nums text-stone-400 dark:text-zinc-500">
                c/IVA {formatCop(stockInversionGross)}
              </p>
            ) : null}
            <div className="[&_p]:mt-0.5 [&_p]:text-[10px]">
              <ReportStockTrendLine trend={stockInvestmentTrend} />
            </div>
          </KpiShell>

          {!isTienda ? (
            <KpiShell staggerMs={100}>
              <dt className={labelClass}>Base sin IVA</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-stone-900 dark:text-zinc-50 sm:text-xl">
                <StaticCopCents cents={ingresosSinIvaPeriod} />
              </dd>
              <p className="mt-0.5 text-[10px] text-stone-400 dark:text-zinc-500">
                IVA recaudado {formatCop(ivaRecaudadoPeriod)}
              </p>
            </KpiShell>
          ) : null}
        </dl>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
        <Suspense fallback={<ReportMonthlyPulseSkeleton compact />}>
          <ReportMonthlyPulseSection
            todayKey={todayKey}
            rangeFrom={rangeFrom}
            rangeTo={rangeTo}
            compact
          />
        </Suspense>

        <section
          className={`reports-chart-reveal flex min-h-0 flex-col overflow-hidden ${adminPanelLgClass}`}
          style={{ ["--reports-chart-delay" as string]: "260ms" }}
        >
          <div className="flex shrink-0 items-end justify-between gap-2 px-4 pt-3 sm:px-5 sm:pt-4">
            <div className="min-w-0">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600 dark:text-zinc-400">
                Tendencia de ventas
              </h2>
              <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                7 días vs semana anterior ·{" "}
                {prettyReportDayShortLabel(salesTrendCurrentFrom)}–
                {prettyReportDayShortLabel(salesTrendCurrentTo)}
              </p>
            </div>
          </div>
          <div className="min-h-0 flex-1 pb-1">
            <ReportSalesWeekTrendChart
              points={reportIncomeChartPoints}
              comparison={salesTrendComparison}
              fillGradientId="reportsIncomeChartFill"
              compact
            />
          </div>
        </section>
      </div>
    </div>
  );
}
