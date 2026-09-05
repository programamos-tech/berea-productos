import {
  ReportMonthlyPulseSection,
  ReportMonthlyPulseSkeleton,
} from "@/components/admin/ReportMonthlyPulseSection";
import {
  ReportActivityFeed,
  ReportActivityFeedSkeleton,
} from "@/components/admin/ReportActivityFeed";
import { ReportPaymentDonut } from "@/components/admin/ReportPaymentDonut";
import { ReportSalesWeekTrendChart } from "@/components/admin/ReportSalesWeekTrendChart";
import {
  StaticCopCents,
  StaticInteger,
} from "@/components/admin/ReportsAnimatedFigures";
import {
  prettyReportDayShortLabel,
  type ReportVista,
} from "@/lib/admin-report-range";
import { fetchAdminReportDashboardData } from "@/lib/admin-reports-data";
import {
  fetchCashArrastreCentsForReportStart,
  fetchCashDayLiveTotals,
} from "@/lib/cash-register";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { formatCop } from "@/lib/money";
import { ReportProfitInfoTip } from "@/components/admin/ReportProfitInfoTip";

const labelClass =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-500";

function Metric({
  label,
  children,
  hint,
  staggerMs = 0,
  labelClassName,
  labelExtra,
}: {
  label: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
  staggerMs?: number;
  labelClassName?: string;
  labelExtra?: React.ReactNode;
}) {
  return (
    <div
      className="reports-metric-card min-w-0"
      style={{ ["--reports-stagger" as string]: `${staggerMs}ms` }}
    >
      <p
        className={`inline-flex items-center gap-1 ${(labelClassName ?? labelClass)}`}
      >
        <span>{label}</span>
        {labelExtra}
      </p>
      <div className="mt-1.5 text-xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
        {children}
      </div>
      {hint ? (
        <div className="mt-1 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
          {hint}
        </div>
      ) : null}
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
  let cajaHoyCents = 0;
  try {
    const supabase = await createSupabaseServerClient();
    const [dashboard, arrastreHoy] = await Promise.all([
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
        ? fetchCashArrastreCentsForReportStart(supabase, todayKey)
        : Promise.resolve(0),
    ]);
    report = dashboard;
    if (vista === "tienda") {
      const live = await fetchCashDayLiveTotals(
        supabase,
        todayKey,
        arrastreHoy,
      );
      cajaHoyCents = live.expectedCashCents;
    }
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
    ingresosSinIvaPeriod,
    ingresosConIvaPeriod,
    ivaRecaudadoPeriod,
    gananciaBruta,
    gananciaNeta,
    totalCobradoPedidos,
    efectivo,
    transferencia,
    anuladas,
    ventasPagadasPeriod,
    egresosPeriod,
    egresosTransferenciaBucketCents,
    cantidadEgresosPeriod,
    reportIncomeChartPoints,
    salesTrendComparison,
    stockInversionNet,
    stockInversionGross,
    stockInvestmentTrend,
  } = report;

  const isTienda = vista === "tienda";
  const efectivoShown = isTienda ? cajaHoyCents : efectivo;
  const transferenciaShown = isTienda
    ? transferencia - egresosTransferenciaBucketCents
    : transferencia;
  const gananciaShown = isTienda ? gananciaNeta : gananciaBruta;

  const efectivoPct =
    totalCobradoPedidos > 0
      ? Math.round((efectivo / totalCobradoPedidos) * 100)
      : null;
  const transferPct =
    totalCobradoPedidos > 0
      ? Math.round((transferencia / totalCobradoPedidos) * 100)
      : null;

  return (
    <div
      key={`reports-body-${vista}-${rangeFrom}-${rangeTo}`}
      className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
    >
      <div className="shrink-0">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4 xl:grid-cols-7">
          <Metric
            label="Total ingresos"
            staggerMs={0}
            hint={
              <>
                IVA ={" "}
                <span className="tabular-nums">{formatCop(ivaRecaudadoPeriod)}</span>
                <span className="sr-only">
                  {" "}
                  · {ventasPagadasPeriod} venta
                  {ventasPagadasPeriod === 1 ? "" : "s"}
                  {isTienda ? " del mes" : ""} · base{" "}
                  {formatCop(ingresosSinIvaPeriod)}
                </span>
              </>
            }
          >
            <StaticCopCents cents={ingresosConIvaPeriod} />
          </Metric>

          <Metric
            label={isTienda ? "Caja hoy" : "Efectivo"}
            staggerMs={30}
            hint={
              isTienda ? undefined : efectivoPct != null ? (
                <>{efectivoPct}% del cobrado</>
              ) : (
                <>Sin cobros POS en efectivo</>
              )
            }
          >
            <StaticCopCents
              cents={efectivoShown}
              className={
                efectivoShown < 0 ? "text-red-600 dark:text-red-400" : undefined
              }
            />
          </Metric>

          <Metric
            label={isTienda ? "En cuentas" : "Transferencia"}
            staggerMs={60}
            hint={
              isTienda
                ? undefined
                : transferPct != null
                  ? <>{transferPct}% del cobrado</>
                  : <>Sin cobros en transferencia</>
            }
          >
            <StaticCopCents
              cents={transferenciaShown}
              className={
                transferenciaShown < 0
                  ? "text-red-600 dark:text-red-400"
                  : undefined
              }
            />
          </Metric>

          <Metric
            label="Egresos"
            staggerMs={90}
            hint={
              isTienda ? undefined : (
                <>
                  {cantidadEgresosPeriod} registrado
                  {cantidadEgresosPeriod === 1 ? "" : "s"}
                </>
              )
            }
          >
            <StaticCopCents cents={egresosPeriod} />
          </Metric>

          <Metric
            label={gananciaShown < 0 ? "Pérdida" : "Ganancia"}
            staggerMs={120}
            labelClassName={
              gananciaShown < 0
                ? "text-[10px] font-semibold uppercase tracking-[0.14em] text-red-600 dark:text-red-400"
                : gananciaShown > 0
                  ? "text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400"
                  : labelClass
            }
            labelExtra={
              <ReportProfitInfoTip
                mode={isTienda ? "neta" : "bruta"}
                margenCents={gananciaBruta}
                egresosCents={egresosPeriod}
                resultadoCents={gananciaShown}
              />
            }
          >
            <span
              className={
                gananciaShown < 0
                  ? "text-red-600 dark:text-red-400"
                  : gananciaShown > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-500"
              }
            >
              <StaticCopCents cents={Math.abs(gananciaShown)} />
            </span>
          </Metric>

          <Metric
            label="Stock"
            staggerMs={150}
            hint={
              stockInvestmentTrend?.changeNetPercent != null ? (
                <span
                  className={
                    stockInvestmentTrend.changeNetPercent > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : stockInvestmentTrend.changeNetPercent < 0
                        ? "text-red-600 dark:text-red-400"
                        : undefined
                  }
                >
                  {stockInvestmentTrend.changeNetPercent > 0 ? "+" : ""}
                  {stockInvestmentTrend.changeNetPercent}% vs 7 días
                </span>
              ) : stockInversionGross > 0 ? (
                <span className="tabular-nums">
                  c/IVA {formatCop(stockInversionGross)}
                </span>
              ) : (
                <>Inversión sin IVA</>
              )
            }
          >
            <StaticCopCents cents={stockInversionNet} />
          </Metric>

          <Metric label="Facturas anuladas" staggerMs={180}>
            <StaticInteger value={anuladas} />
          </Metric>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 border-t border-zinc-200/70 pt-4 dark:border-zinc-800 lg:grid-cols-12 lg:gap-6">
        <div className="flex min-h-0 flex-col gap-3 lg:col-span-7">
          <section
            className="reports-chart-reveal flex min-h-0 flex-[1.15] flex-col"
            style={{ ["--reports-chart-delay" as string]: "100ms" }}
          >
            <div className="mb-1 flex shrink-0 items-end justify-between gap-2">
              <div>
                <h2 className={labelClass}>Ventas del mostrador</h2>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  {prettyReportDayShortLabel(salesTrendCurrentFrom)} –{" "}
                  {prettyReportDayShortLabel(salesTrendCurrentTo)}
                  {salesTrendCurrentTo === todayKey ? " · hoy" : ""}
                </p>
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <ReportSalesWeekTrendChart
                points={reportIncomeChartPoints}
                comparison={salesTrendComparison}
                fillGradientId="reportsIncomeChartFill"
                mini
              />
            </div>
          </section>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            <section
              className="reports-chart-reveal min-h-0"
              style={{ ["--reports-chart-delay" as string]: "140ms" }}
            >
              <ReportPaymentDonut
                efectivoCents={efectivo}
                transferenciaCents={transferencia}
                flat
                mini
              />
            </section>
            <section
              className="reports-chart-reveal min-h-0"
              style={{ ["--reports-chart-delay" as string]: "180ms" }}
            >
              <Suspense fallback={<ReportMonthlyPulseSkeleton compact flat />}>
                <ReportMonthlyPulseSection
                  todayKey={todayKey}
                  rangeFrom={rangeFrom}
                  rangeTo={rangeTo}
                  mini
                />
              </Suspense>
            </section>
          </div>
        </div>

        <section
          className="reports-chart-reveal min-h-0 border-zinc-200/70 dark:border-zinc-800 lg:col-span-5 lg:border-l lg:pl-6"
          style={{ ["--reports-chart-delay" as string]: "200ms" }}
        >
          <Suspense fallback={<ReportActivityFeedSkeleton />}>
            <ReportActivityFeed />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
