import {
  ReportMonthlyPulseSection,
  ReportMonthlyPulseSkeleton,
} from "@/components/admin/ReportMonthlyPulseSection";
import { ReportPaymentDonut } from "@/components/admin/ReportPaymentDonut";
import { ReportSalesWeekTrendChart } from "@/components/admin/ReportSalesWeekTrendChart";
import { ReportStockTrendLine } from "@/components/admin/ReportStockTrendLine";
import {
  StaticCopCents,
  StaticInteger,
} from "@/components/admin/ReportsAnimatedFigures";
import {
  prettyReportDayShortLabel,
  type ReportVista,
} from "@/lib/admin-report-range";
import { fetchAdminReportDashboardData } from "@/lib/admin-reports-data";
import { fetchCashArrastreCentsForReportStart } from "@/lib/cash-register";
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
    ingresosSinIvaPeriod,
    ingresosConIvaPeriod,
    ivaRecaudadoPeriod,
    gananciaBruta,
    gananciaNeta,
    totalCobradoPedidos,
    efectivo,
    transferencia,
    anuladas,
    ventasVirtuales,
    ventasPagadasPeriod,
    egresosPeriod,
    egresosEfectivoCents,
    egresosTransferenciaBucketCents,
    cantidadEgresosPeriod,
    reportIncomeChartPoints,
    salesTrendComparison,
    stockInversionNet,
    stockInversionGross,
    stockHasProducts,
    stockInvestmentTrend,
  } = report;

  const isTienda = vista === "tienda";
  const efectivoShown = isTienda
    ? arrastreEfectivoCents + efectivo - egresosEfectivoCents
    : efectivo;
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
              ? "Arrastre + cobros − egresos"
              : "Solo ventas y cobros del periodo"}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4 xl:grid-cols-8">
          <Metric
            label="Total ingresos"
            staggerMs={0}
            hint={
              <>
                {ventasPagadasPeriod} venta{ventasPagadasPeriod === 1 ? "" : "s"} · IVA{" "}
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
            label="Efectivo"
            staggerMs={30}
            hint={
              isTienda && arrastreEfectivoCents > 0 ? (
                <>Incluye arrastre {formatCop(arrastreEfectivoCents)}</>
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
              transferPct != null ? (
                <>{transferPct}% del cobrado</>
              ) : (
                <>Sin cobros en transferencia</>
              )
            }
          >
            <StaticCopCents cents={transferenciaShown} />
          </Metric>

          <Metric label="Facturas anuladas" staggerMs={90} hint="En el periodo">
            <StaticInteger value={anuladas} />
          </Metric>

          <Metric
            label="Egresos"
            staggerMs={120}
            hint={
              <>
                {cantidadEgresosPeriod} registrado
                {cantidadEgresosPeriod === 1 ? "" : "s"}
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
                  Bruta {formatCop(gananciaBruta)} · margen − egresos
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
              <>
                {stockInversionGross > 0 ? (
                  <span className="tabular-nums">
                    c/IVA {formatCop(stockInversionGross)}
                  </span>
                ) : stockHasProducts ? (
                  <>Sin costo con IVA cargado</>
                ) : (
                  <>—</>
                )}
                <div className="[&_p]:mt-0.5 [&_p]:text-[11px]">
                  <ReportStockTrendLine trend={stockInvestmentTrend} />
                </div>
              </>
            }
          >
            <StaticCopCents cents={stockInversionNet} />
          </Metric>

          <Metric
            label="Ventas virtuales"
            staggerMs={210}
            hint="Checkout web (sin mostrador)"
          >
            <StaticCopCents cents={ventasVirtuales} />
          </Metric>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 border-t border-zinc-200/70 pt-4 dark:border-zinc-800 lg:grid-cols-12 lg:gap-6">
        <section
          className="reports-chart-reveal flex min-h-0 flex-col lg:col-span-5"
          style={{ ["--reports-chart-delay" as string]: "120ms" }}
        >
          <div className="mb-2 flex shrink-0 flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className={labelClass}>Ventas del mostrador</h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                {prettyReportDayShortLabel(salesTrendCurrentFrom)} –{" "}
                {prettyReportDayShortLabel(salesTrendCurrentTo)}
                {salesTrendCurrentTo === todayKey ? " · hoy" : ""}
              </p>
            </div>
            <div className="hidden items-center gap-3 text-[10px] font-medium text-zinc-500 sm:flex">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-rose-700 dark:bg-rose-300" />
                Este periodo
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-sm bg-zinc-400 dark:bg-zinc-600" />
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

        <section
          className="reports-chart-reveal flex min-h-0 flex-col border-zinc-200/70 dark:border-zinc-800 lg:col-span-3 lg:border-l lg:pl-6"
          style={{ ["--reports-chart-delay" as string]: "180ms" }}
        >
          <ReportPaymentDonut
            efectivoCents={efectivo}
            transferenciaCents={transferencia}
            flat
          />
        </section>

        <section
          className="reports-chart-reveal flex min-h-0 flex-col border-zinc-200/70 dark:border-zinc-800 lg:col-span-4 lg:border-l lg:pl-6"
          style={{ ["--reports-chart-delay" as string]: "220ms" }}
        >
          <Suspense fallback={<ReportMonthlyPulseSkeleton compact flat />}>
            <ReportMonthlyPulseSection
              todayKey={todayKey}
              rangeFrom={rangeFrom}
              rangeTo={rangeTo}
              compact
              flat
            />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
