import {
  ReportDayCashCloseChip,
  ReportDayCashCloseChipSkeleton,
} from "@/components/admin/ReportDayCashCloseChip";
import {
  StaticCopCents,
  StaticInteger,
} from "@/components/admin/ReportsAnimatedFigures";
import { type ReportVista } from "@/lib/admin-report-range";
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
  FileX2,
  Package,
  TrendingDown,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { ReportMetricInfoTip } from "@/components/admin/ReportProfitInfoTip";
import {
  adminCashNegativeTextClass,
  adminCashOkTextClass,
} from "@/lib/admin-ui";

const labelClass =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-500";

/** Mix egresos: zinc (caja) + zinc suave (cuentas). */
const egresoCajaBarClass = "bg-zinc-700 dark:bg-zinc-300";
const egresoCuentasBarClass = "bg-zinc-300 dark:bg-zinc-600";

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
      <div className="mt-1.5 text-lg font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-xl md:text-2xl">
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

/** Barrita del mix de egresos: caja (coral) + cuentas (zinc suave). Solo en vista tienda. */
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
    <div className="w-full min-w-0 max-w-none sm:max-w-[14rem]">
      <div
        className="flex h-1.5 w-full overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-700/50"
        aria-hidden
      >
        {cashPct > 0 ? (
          <div
            className={`h-full ${egresoCajaBarClass}`}
            style={{ width: `${cashPct}%` }}
            title={`Caja ${formatCop(cash)}`}
          />
        ) : null}
        {transferPct > 0 ? (
          <div
            className={`h-full ${egresoCuentasBarClass}`}
            style={{ width: `${transferPct}%` }}
            title={`Cuentas ${formatCop(transfer)}`}
          />
        ) : null}
      </div>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] tabular-nums text-zinc-500 dark:text-zinc-400">
        {cash > 0 ? (
          <span className="inline-flex min-w-0 items-center gap-1">
            <span
              className={`size-1.5 shrink-0 rounded-full ${egresoCajaBarClass}`}
              aria-hidden
            />
            <span className="truncate">Caja {formatCop(cash)}</span>
          </span>
        ) : null}
        {transfer > 0 ? (
          <span className="inline-flex min-w-0 items-center gap-1">
            <span
              className={`size-1.5 shrink-0 rounded-full ${egresoCuentasBarClass}`}
              aria-hidden
            />
            <span className="truncate">Cuentas {formatCop(transfer)}</span>
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
    const dashboardPromise = fetchAdminReportDashboardData(supabase, {
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
    const cashPromise =
      vista === "tienda"
        ? Promise.resolve(0)
        : (async () => {
            const arrastreHoy = await fetchCashArrastreCentsForReportStart(
              supabase,
              todayKey,
            );
            const live = await fetchCashDayLiveTotals(
              supabase,
              todayKey,
              arrastreHoy,
            );
            return live.expectedCashCents;
          })();
    const [dashboard, cash] = await Promise.all([
      dashboardPromise,
      cashPromise,
    ]);
    report = dashboard;
    cajaHoyCents = cash;
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
    anuladas,
    stockInversionNet,
    stockInversionGross,
    stockInvestmentTrend,
  } = report;

  const isTienda = vista === "tienda";
  const transferenciaShown = transferencia;
  const isSingleDayPeriod = !isTienda && rangeFrom === rangeTo;

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
      key={`reports-kpis-${vista}-${rangeFrom}-${rangeTo}`}
      className="shrink-0 overflow-visible"
    >
      {isSingleDayPeriod ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Cierre de caja
          </span>
          <Suspense fallback={<ReportDayCashCloseChipSkeleton />}>
            <ReportDayCashCloseChip dayYmd={rangeFrom} />
          </Suspense>
        </div>
      ) : null}

      <div
        className={`grid grid-cols-2 gap-x-4 gap-y-4 sm:gap-x-6 sm:gap-y-5 md:grid-cols-3 ${
          isTienda ? "xl:grid-cols-7" : "xl:grid-cols-6"
        }`}
      >
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
            <Metric label="En caja" icon={Wallet} staggerMs={20}>
              <StaticCopCents cents={efectivo} />
            </Metric>
          ) : (
            <Metric
              label="Efectivo"
              icon={Banknote}
              staggerMs={20}
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
                  efectivo < 0 ? adminCashNegativeTextClass : undefined
                }
              />
            </Metric>
          )}

          <Metric
            label={isTienda ? "En cuentas" : "Transferencia"}
            icon={ArrowLeftRight}
            staggerMs={40}
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
                  ? adminCashNegativeTextClass
                  : undefined
              }
            />
          </Metric>

          {isTienda ? (
            <Metric
              label="Ganancia bruta"
              icon={TrendingUp}
              staggerMs={50}
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
                    ? adminCashNegativeTextClass
                    : gananciaBruta > 0
                      ? undefined
                      : "text-zinc-500"
                }
              />
            </Metric>
          ) : null}

          <Metric
            label="Egresos"
            icon={ArrowDownLeft}
            staggerMs={isTienda ? 60 : 50}
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

          {isTienda ? (
            <Metric
              label={gananciaNeta < 0 ? "Pérdida" : "Ganancia"}
              icon={gananciaNeta < 0 ? TrendingDown : TrendingUp}
              staggerMs={70}
              iconClassName={
                gananciaNeta < 0
                  ? adminCashNegativeTextClass
                  : gananciaNeta > 0
                    ? adminCashOkTextClass
                    : "text-zinc-400 dark:text-zinc-500"
              }
              labelClassName={
                gananciaNeta < 0
                  ? `text-[10px] font-semibold uppercase tracking-[0.14em] ${adminCashNegativeTextClass}`
                  : gananciaNeta > 0
                    ? `text-[10px] font-semibold uppercase tracking-[0.14em] ${adminCashOkTextClass}`
                    : labelClass
              }
            >
              <span
                className={
                  gananciaNeta < 0
                    ? adminCashNegativeTextClass
                    : gananciaNeta > 0
                      ? adminCashOkTextClass
                      : "text-zinc-500"
                }
              >
                <StaticCopCents cents={Math.abs(gananciaNeta)} />
              </span>
            </Metric>
          ) : (
            <Metric label="Dinero en caja" icon={Wallet} staggerMs={60}>
              <StaticCopCents
                cents={cajaHoyCents}
                className={
                  cajaHoyCents < 0
                    ? adminCashNegativeTextClass
                    : undefined
                }
              />
            </Metric>
          )}

          {isTienda ? (
            <Metric
              label="Stock"
              icon={Package}
              staggerMs={80}
              hint={
                stockInvestmentTrend?.changeNetPercent != null ? (
                  <span
                    className={
                      stockInvestmentTrend.changeNetPercent > 0
                        ? adminCashOkTextClass
                        : stockInvestmentTrend.changeNetPercent < 0
                          ? adminCashNegativeTextClass
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
          ) : (
            <Metric label="Facturas anuladas" icon={FileX2} staggerMs={70}>
              <StaticInteger value={anuladas} />
            </Metric>
          )}
      </div>
    </div>
  );
}
