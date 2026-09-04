import { ReportKpiCard } from "@/components/admin/ReportKpiCard";
import { ReportPaymentDonut } from "@/components/admin/ReportPaymentDonut";
import { ReportEgresosPanel } from "@/components/admin/ReportEgresosPanel";
import {
  ReportMonthlyPulseSection,
  ReportMonthlyPulseSkeleton,
} from "@/components/admin/ReportMonthlyPulseSection";
import { ReportSalesWeekTrendChart } from "@/components/admin/ReportSalesWeekTrendChart";
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

  const {
    ingresosConIvaPeriod,
    ivaRecaudadoPeriod,
    gananciaBruta,
    gananciaNeta,
    efectivo,
    transferencia,
    ventasPagadasPeriod,
    egresosPeriod,
    egresosEfectivoCents,
    egresosTransferenciaBucketCents,
    cantidadEgresosPeriod,
    reportExpensesEfectivoLines,
    reportExpensesOtrosLines,
    reportIncomeChartPoints,
    salesTrendComparison,
    stockInversionNet,
    stockInvestmentTrend,
  } = report;

  const isTienda = vista === "tienda";
  const efectivoDisplay = isTienda
    ? arrastreEfectivoCents + efectivo - egresosEfectivoCents
    : efectivo;
  const transferenciaDisplay = isTienda
    ? transferencia - egresosTransferenciaBucketCents
    : transferencia;

  const sparkValues = reportIncomeChartPoints.map((p) => p.avgCents);
  const weekDelta = salesTrendComparison.changePercent;
  const stockDelta = stockInvestmentTrend?.changeNetPercent ?? null;

  const allExpenseLines = [
    ...reportExpensesEfectivoLines,
    ...reportExpensesOtrosLines,
  ].sort((a, b) => b.amount_cents - a.amount_cents);

  const efectivoHint = isTienda
    ? arrastreEfectivoCents > 0
      ? `Incluye arrastre ${formatCop(arrastreEfectivoCents)}`
      : `${ventasPagadasPeriod} ventas · cobros en billete`
    : `${ventasPagadasPeriod} venta${ventasPagadasPeriod === 1 ? "" : "s"} en efectivo`;

  return (
    <div
      key={`reports-body-${vista}-${rangeFrom}-${rangeTo}`}
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden"
    >
      <div className="grid shrink-0 grid-cols-2 gap-2.5 lg:grid-cols-4">
        <ReportKpiCard
          label="Facturación"
          cents={ingresosConIvaPeriod}
          hint={`${ventasPagadasPeriod} ventas · IVA ${formatCop(ivaRecaudadoPeriod)}`}
          sparkline={sparkValues}
          sparkTone="rose"
          deltaPercent={weekDelta}
          staggerMs={0}
        />
        <ReportKpiCard
          label="Caja efectivo"
          cents={efectivoDisplay}
          hint={efectivoHint}
          staggerMs={40}
          valueClassName={
            efectivoDisplay < 0 ? "text-red-600 dark:text-red-400" : undefined
          }
        />
        <ReportKpiCard
          label="Caja transferencia"
          cents={transferenciaDisplay}
          hint={
            ingresosConIvaPeriod > 0
              ? `${Math.round((transferencia / Math.max(ingresosConIvaPeriod, 1)) * 100)}% del cobrado`
              : "Sin transferencias"
          }
          staggerMs={80}
        />
        <ReportKpiCard
          label={isTienda ? "Ganancia neta" : "Stock"}
          cents={isTienda ? gananciaNeta : stockInversionNet}
          hint={
            isTienda
              ? `Bruta ${formatCop(gananciaBruta)} · margen − egresos`
              : stockInvestmentTrend
                ? `Inversión en inventario`
                : "Inversión en inventario"
          }
          deltaPercent={isTienda ? null : stockDelta}
          staggerMs={120}
          valueClassName={
            isTienda && gananciaNeta < 0
              ? "text-red-600 dark:text-red-400"
              : undefined
          }
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2.5 lg:grid-cols-12">
        <section
          className={`reports-chart-reveal flex min-h-0 flex-col overflow-hidden lg:col-span-6 ${adminPanelLgClass}`}
          style={{ ["--reports-chart-delay" as string]: "160ms" }}
        >
          <div className="flex shrink-0 items-end justify-between gap-2 px-4 pt-3.5 sm:px-5">
            <div className="min-w-0">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                Ventas del mostrador
              </h2>
              <p className="mt-0.5 truncate text-xs text-zinc-400 dark:text-zinc-500">
                {prettyReportDayShortLabel(salesTrendCurrentFrom)} –{" "}
                {prettyReportDayShortLabel(salesTrendCurrentTo)}
                {salesTrendCurrentTo === todayKey ? " · hoy" : ""}
              </p>
            </div>
            <div className="hidden items-center gap-3 text-[10px] font-medium text-zinc-500 sm:flex">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-rose-800 dark:bg-rose-300" />
                Este periodo
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-sm bg-zinc-300 dark:bg-zinc-600" />
                Anterior
              </span>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <ReportSalesWeekTrendChart
              points={reportIncomeChartPoints}
              comparison={salesTrendComparison}
              fillGradientId="reportsIncomeChartFill"
              compact
            />
          </div>
        </section>

        <div className="flex min-h-0 flex-col gap-2.5 lg:col-span-3">
          <div className={`min-h-0 ${isTienda ? "flex-[1.15]" : "flex-1"}`}>
            <ReportPaymentDonut
              efectivoCents={efectivo}
              transferenciaCents={transferencia}
            />
          </div>
          {isTienda ? (
            <div className="min-h-0 flex-1">
              <ReportEgresosPanel
                periodLabel={periodLabel}
                egresosPeriod={egresosPeriod}
                cantidad={cantidadEgresosPeriod}
                lines={allExpenseLines}
                showSaldo
                saldoNetoCaja={efectivoDisplay}
              />
            </div>
          ) : null}
        </div>

        <div className="min-h-0 lg:col-span-3">
          <Suspense fallback={<ReportMonthlyPulseSkeleton compact />}>
            <ReportMonthlyPulseSection
              todayKey={todayKey}
              rangeFrom={rangeFrom}
              rangeTo={rangeTo}
              compact
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
