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
import {
  ArrowDownLeft,
  ArrowLeftRight,
  Banknote,
  CircleDollarSign,
  Package,
  TrendingDown,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { ReportMetricInfoTip } from "@/components/admin/ReportProfitInfoTip";

const labelClass =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-500";

function Metric({
  label,
  children,
  hint,
  staggerMs = 0,
  labelClassName,
  labelExtra,
  icon: Icon,
  iconClassName,
}: {
  label: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
  staggerMs?: number;
  labelClassName?: string;
  labelExtra?: React.ReactNode;
  icon?: LucideIcon;
  iconClassName?: string;
}) {
  return (
    <div
      className="reports-metric-card min-w-0"
      style={{ ["--reports-stagger" as string]: `${staggerMs}ms` }}
    >
      <div className="inline-flex min-w-0 items-center gap-1.5">
        {Icon ? (
          <Icon
            className={`size-3.5 shrink-0 ${iconClassName ?? "text-zinc-400 dark:text-zinc-500"}`}
            strokeWidth={2.25}
            aria-hidden
          />
        ) : null}
        <p className={`min-w-0 truncate ${labelClassName ?? labelClass}`}>
          {label}
        </p>
        {labelExtra}
      </div>
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

/** Barrita del mix de egresos: caja (amarillo) + transferencia (azul). Solo en vista tienda. */
function EgresosMixHint({
  egresosEfectivoCents,
  egresosTransferCents,
}: {
  egresosEfectivoCents: number;
  egresosTransferCents: number;
}) {
  const cash = Math.max(0, egresosEfectivoCents);
  const transfer = Math.max(0, egresosTransferCents);
  const total = cash + transfer;
  if (total <= 0) {
    return <span>Sin egresos</span>;
  }
  const cashPct = (cash / total) * 100;
  const transferPct = (transfer / total) * 100;
  return (
    <div className="w-full max-w-[9.5rem]">
      <div
        className="flex h-1.5 w-full overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-700/50"
        aria-hidden
      >
        {cashPct > 0 ? (
          <div
            className="h-full bg-amber-400 dark:bg-amber-400/90"
            style={{ width: `${cashPct}%` }}
            title={`Caja ${formatCop(cash)}`}
          />
        ) : null}
        {transferPct > 0 ? (
          <div
            className="h-full bg-sky-400 dark:bg-sky-400/90"
            style={{ width: `${transferPct}%` }}
            title={`Cuentas ${formatCop(transfer)}`}
          />
        ) : null}
      </div>
      <p className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] tabular-nums text-zinc-500 dark:text-zinc-400">
        {cash > 0 ? (
          <span className="inline-flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-amber-400" aria-hidden />
            Caja {formatCop(cash)}
          </span>
        ) : null}
        {transfer > 0 ? (
          <span className="inline-flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-sky-400" aria-hidden />
            Cuentas {formatCop(transfer)}
          </span>
        ) : null}
      </p>
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
    const dashboard = await fetchAdminReportDashboardData(supabase, {
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
    });
    report = dashboard;
    if (vista !== "tienda") {
      const arrastreHoy = await fetchCashArrastreCentsForReportStart(
        supabase,
        todayKey,
      );
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
    ventasPagadasPeriod,
    egresosPeriod,
    egresosEfectivoCents,
    egresosTransferenciaBucketCents,
    cantidadEgresosPeriod,
    reportIncomeChartPoints,
    salesTrendComparison,
    stockInversionNet,
    stockInversionGross,
    stockInvestmentTrend,
  } = report;

  const isTienda = vista === "tienda";
  const transferenciaShown = transferencia;

  const efectivoPct =
    totalCobradoPedidos > 0
      ? Math.round((efectivo / totalCobradoPedidos) * 100)
      : null;
  const transferPct =
    totalCobradoPedidos > 0
      ? Math.round((transferencia / totalCobradoPedidos) * 100)
      : null;

  const cajaHoyMetric = (
    <Metric label="Caja hoy" icon={Wallet} staggerMs={45}>
      <StaticCopCents
        cents={cajaHoyCents}
        className={
          cajaHoyCents < 0 ? "text-red-600 dark:text-red-400" : undefined
        }
      />
    </Metric>
  );

  const enCajaMesMetric = (
    <Metric label="En caja" icon={Wallet} staggerMs={30}>
      <StaticCopCents cents={efectivo} />
    </Metric>
  );

  return (
    <div
      key={`reports-body-${vista}-${rangeFrom}-${rangeTo}`}
      className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
    >
      <div className="shrink-0">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4 xl:grid-cols-7">
          <Metric
            label="Total ingresos"
            icon={CircleDollarSign}
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

          {isTienda ? (
            enCajaMesMetric
          ) : (
            <Metric
              label="Efectivo"
              icon={Banknote}
              staggerMs={30}
              hint={
                efectivoPct != null ? (
                  <>{efectivoPct}% del cobrado</>
                ) : (
                  <>Sin cobros POS en efectivo</>
                )
              }
            >
              <StaticCopCents
                cents={efectivo}
                className={
                  efectivo < 0 ? "text-red-600 dark:text-red-400" : undefined
                }
              />
            </Metric>
          )}

          {!isTienda ? cajaHoyMetric : null}

          <Metric
            label={isTienda ? "En cuentas" : "Transferencia"}
            icon={ArrowLeftRight}
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
            label="Ganancia bruta"
            icon={TrendingUp}
            staggerMs={90}
            labelExtra={
              <ReportMetricInfoTip>
                <p>
                  Sale del precio de venta sin IVA, menos el costo de los
                  productos.
                </p>
              </ReportMetricInfoTip>
            }
          >
            <StaticCopCents
              cents={gananciaBruta}
              className={
                gananciaBruta < 0
                  ? "text-red-600 dark:text-red-400"
                  : gananciaBruta > 0
                    ? undefined
                    : "text-zinc-500"
              }
            />
          </Metric>

          <Metric
            label="Egresos"
            icon={ArrowDownLeft}
            staggerMs={120}
            hint={
              isTienda ? (
                <EgresosMixHint
                  egresosEfectivoCents={egresosEfectivoCents}
                  egresosTransferCents={egresosTransferenciaBucketCents}
                />
              ) : (
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
            label={gananciaNeta < 0 ? "Pérdida" : "Ganancia"}
            icon={gananciaNeta < 0 ? TrendingDown : TrendingUp}
            staggerMs={150}
            iconClassName={
              gananciaNeta < 0
                ? "text-red-500 dark:text-red-400"
                : gananciaNeta > 0
                  ? "text-emerald-500 dark:text-emerald-400"
                  : "text-zinc-400 dark:text-zinc-500"
            }
            labelClassName={
              gananciaNeta < 0
                ? "text-[10px] font-semibold uppercase tracking-[0.14em] text-red-600 dark:text-red-400"
                : gananciaNeta > 0
                  ? "text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400"
                  : labelClass
            }
          >
            <span
              className={
                gananciaNeta < 0
                  ? "text-red-600 dark:text-red-400"
                  : gananciaNeta > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-500"
              }
            >
              <StaticCopCents cents={Math.abs(gananciaNeta)} />
            </span>
          </Metric>

          {isTienda ? (
            <Metric
              label="Stock"
              icon={Package}
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
          ) : null}
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
