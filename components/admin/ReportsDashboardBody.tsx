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
import Link from "next/link";
import { Suspense } from "react";
import { formatCop } from "@/lib/money";

const labelClass =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-500";

function Metric({
  label,
  children,
  hint,
  staggerMs = 0,
}: {
  label: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
  staggerMs?: number;
}) {
  return (
    <div
      className="reports-metric-card min-w-0"
      style={{ ["--reports-stagger" as string]: `${staggerMs}ms` }}
    >
      <p className={labelClass}>{label}</p>
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
  let arrastreEfectivoCents = 0;
  let cajaHoyCents = 0;
  let cobrosEfectivoHoyCents = 0;
  let egresosEfectivoHoyCents = 0;
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
    arrastreEfectivoCents = arrastreHoy;
    if (vista === "tienda") {
      const live = await fetchCashDayLiveTotals(
        supabase,
        todayKey,
        arrastreHoy,
      );
      cajaHoyCents = live.expectedCashCents;
      cobrosEfectivoHoyCents = live.salesCashCents;
      egresosEfectivoHoyCents = live.expensesCashCents;
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
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className={labelClass}>
            {isTienda ? "Cómo va la tienda" : "Reporte del día"}
            <span className="mx-1.5 font-normal normal-case tracking-normal text-zinc-600 dark:text-zinc-500">
              · {periodLabel}
            </span>
          </p>
          <p className="text-[10px] text-zinc-500">
            {isTienda
              ? "Mes en curso · caja = arrastre + cobros − egresos de hoy"
              : "Solo ventas y cobros del periodo"}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4 xl:grid-cols-7">
          <Metric
            label="Total ingresos"
            staggerMs={0}
            hint={
              <>
                {ventasPagadasPeriod} venta{ventasPagadasPeriod === 1 ? "" : "s"}
                {isTienda ? " del mes" : ""} · IVA{" "}
                <span className="tabular-nums">{formatCop(ivaRecaudadoPeriod)}</span>
                <span className="sr-only">
                  {" "}
                  Base {formatCop(ingresosSinIvaPeriod)}
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
              isTienda ? (
                <>
                  Arrastre {formatCop(arrastreEfectivoCents)}
                  {cobrosEfectivoHoyCents > 0
                    ? ` + cobros ${formatCop(cobrosEfectivoHoyCents)}`
                    : ""}
                  {egresosEfectivoHoyCents > 0
                    ? ` − egresos ${formatCop(egresosEfectivoHoyCents)}`
                    : ""}
                </>
              ) : efectivoPct != null ? (
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
            label="Transferencia"
            staggerMs={60}
            hint={
              isTienda ? (
                transferPct != null ? (
                  <>Neto del mes · {transferPct}% cobrado</>
                ) : (
                  <>Neto del mes (cobros − egresos)</>
                )
              ) : transferPct != null ? (
                <>{transferPct}% del cobrado</>
              ) : (
                <>Sin cobros en transferencia</>
              )
            }
          >
            <StaticCopCents cents={transferenciaShown} />
          </Metric>

          <Metric
            label="Facturas anuladas"
            staggerMs={90}
            hint={isTienda ? "En el mes" : "En el periodo"}
          >
            <StaticInteger value={anuladas} />
          </Metric>

          <Metric
            label="Egresos"
            staggerMs={120}
            hint={
              <>
                {cantidadEgresosPeriod} registrado
                {cantidadEgresosPeriod === 1 ? "" : "s"}
                {isTienda ? " del mes" : ""}
                {isTienda ? (
                  <>
                    {" · "}
                    <Link
                      href="/admin/egresos/nuevo"
                      className="font-medium text-rose-800 underline-offset-2 hover:underline dark:text-rose-300"
                    >
                      + Egreso
                    </Link>
                  </>
                ) : null}
              </>
            }
          >
            <StaticCopCents cents={egresosPeriod} />
          </Metric>

          <Metric
            label="Ganancia"
            staggerMs={150}
            hint={
              isTienda ? (
                <>
                  Bruta {formatCop(gananciaBruta)} · margen − egresos del mes
                </>
              ) : (
                <>Margen de productos (sin egresos)</>
              )
            }
          >
            <span
              className={
                gananciaShown < 0
                  ? "text-red-600 dark:text-red-400"
                  : gananciaShown > 0
                    ? undefined
                    : "text-zinc-500"
              }
            >
              <StaticCopCents cents={gananciaShown} />
            </span>
            {isTienda ? (
              <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                neta
              </span>
            ) : (
              <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                bruta
              </span>
            )}
          </Metric>

          <Metric
            label="Stock"
            staggerMs={180}
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
