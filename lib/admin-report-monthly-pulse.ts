import type { SupabaseClient } from "@supabase/supabase-js";
import {
  addCalendarDaysReport,
  addYearMonths,
  currentYearMonthInReportStore,
  dayInRange,
  monthYmdBounds,
  prettyYearMonthLabel,
  reportCalendarDayKeyFromIso,
  reportRangeDayCountInclusive,
  reportYearMonthFromIso,
  yearMonthsInclusive,
} from "@/lib/admin-report-range";
import {
  fetchOrderItemsInChunks,
  fetchOrdersCreatedInReportYmdWindow,
} from "@/lib/admin-fetch-orders-for-report";
import {
  sumGrossProfitNetOnLinesForPaidOrders,
  sumRevenueNetGrossForOrders,
  type OrderItemRow,
  type OrderRowRef,
  type ProductVatRow,
} from "@/lib/order-revenue-vat";

export type MonthlyPulsePoint = {
  yearMonth: string;
  label: string;
  shortLabel: string;
  year: string;
  from: string;
  to: string;
  isPartial: boolean;
  isCurrent: boolean;
  ventas: number;
  ingresosConIva: number;
  gananciaBruta: number;
  egresos: number;
  gananciaNeta: number;
  /** Mismo tramo de días del mes anterior (solo mes actual). */
  priorMtdNeta: number | null;
};

export type MonthlyPulseResult = {
  /** Cronológico: más viejo → más nuevo. */
  months: MonthlyPulsePoint[];
  /** Una línea sobre el mes en curso. */
  insight: string;
};

function capitalizeEs(s: string): string {
  if (!s) return s;
  return s.charAt(0).toLocaleUpperCase("es-CO") + s.slice(1);
}

function shortMonthLabel(yearMonth: string): string {
  const full = prettyYearMonthLabel(yearMonth);
  const monthOnly = full.split(" de ")[0] ?? full;
  return capitalizeEs(monthOnly);
}

function expenseDayKey(row: Record<string, unknown>): string {
  const ed = row.expense_date;
  if (typeof ed === "string" && ed.length >= 10) return ed.slice(0, 10);
  const created = row.created_at;
  if (typeof created === "string") return reportCalendarDayKeyFromIso(created);
  return "";
}

function isExpenseCancelled(row: Record<string, unknown>): boolean {
  return row.is_cancelled === true;
}

async function fetchExpensesWindow(
  supabase: SupabaseClient,
  from: string,
  to: string,
): Promise<Record<string, unknown>[]> {
  const withCancelled = await supabase
    .from("store_expenses")
    .select("amount_cents,expense_date,created_at,is_cancelled")
    .gte("expense_date", from)
    .lte("expense_date", to)
    .limit(8000);
  if (!withCancelled.error) return (withCancelled.data ?? []) as Record<string, unknown>[];

  const fallback = await supabase
    .from("store_expenses")
    .select("amount_cents,expense_date,created_at")
    .gte("expense_date", from)
    .lte("expense_date", to)
    .limit(8000);
  return (fallback.data ?? []) as Record<string, unknown>[];
}

async function loadProductsById(
  supabase: SupabaseClient,
  orderItems: OrderItemRow[],
): Promise<Map<string, ProductVatRow>> {
  const productsById = new Map<string, ProductVatRow>();
  const pids = [
    ...new Set(
      orderItems.map((i) => i.product_id).filter((id): id is string => Boolean(id)),
    ),
  ];
  for (let i = 0; i < pids.length; i += 120) {
    const part = pids.slice(i, i + 120);
    const { data } = await supabase
      .from("products")
      .select("id,price_cents,has_vat,vat_percent,cost_cents")
      .in("id", part);
    for (const p of data ?? []) {
      productsById.set(p.id as string, p as ProductVatRow);
    }
  }
  return productsById;
}

async function firstPaidYearMonth(supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("created_at")
    .eq("status", "paid")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !data?.created_at) return null;
  return reportYearMonthFromIso(String(data.created_at)) || null;
}

function summarizeWindow(
  from: string,
  to: string,
  paidAll: OrderRowRef[],
  orderItems: OrderItemRow[],
  productsById: Map<string, ProductVatRow>,
  expenseRows: Record<string, unknown>[],
): {
  ventas: number;
  ingresosConIva: number;
  gananciaBruta: number;
  egresos: number;
  gananciaNeta: number;
} {
  const paid = paidAll.filter((o) => {
    if (typeof o.created_at !== "string") return false;
    return dayInRange(reportCalendarDayKeyFromIso(o.created_at), from, to);
  });
  const rev = sumRevenueNetGrossForOrders(paid, orderItems, productsById);
  const bruta = sumGrossProfitNetOnLinesForPaidOrders(paid, orderItems, productsById);
  let egresos = 0;
  for (const e of expenseRows) {
    if (isExpenseCancelled(e)) continue;
    const dk = expenseDayKey(e);
    if (!dayInRange(dk, from, to)) continue;
    egresos += Math.max(0, Math.round(Number(e.amount_cents ?? 0)));
  }
  return {
    ventas: paid.length,
    ingresosConIva: rev.gross,
    gananciaBruta: bruta,
    egresos,
    gananciaNeta: bruta - egresos,
  };
}

function nowPlayingInsight(current: MonthlyPulsePoint | undefined): string {
  if (!current) return "";
  if (current.gananciaNeta > 0) {
    if (current.priorMtdNeta != null && current.gananciaNeta < current.priorMtdNeta) {
      return "Más lento que el mes pasado";
    }
    return "Va bien";
  }
  if (current.gananciaNeta < 0) return "Va en rojo";
  return "En cero por ahora";
}

/**
 * Historial mensual desde la primera venta hasta el mes actual.
 * Misma ganancia neta que Reportes (margen por línea − egresos activos).
 */
export async function fetchAdminReportMonthlyPulse(
  supabase: SupabaseClient,
  opts?: { todayYmd?: string; now?: Date; maxMonths?: number },
): Promise<MonthlyPulseResult> {
  const maxMonths = Math.min(24, Math.max(2, Math.trunc(opts?.maxMonths ?? 24)));
  const todayYmd =
    opts?.todayYmd ??
    reportCalendarDayKeyFromIso((opts?.now ?? new Date()).toISOString());
  const anchorYm = currentYearMonthInReportStore(opts?.now);
  const firstYm = (await firstPaidYearMonth(supabase)) ?? anchorYm;
  const yearMonths = yearMonthsInclusive(firstYm, anchorYm, maxMonths) ?? [anchorYm];
  if (yearMonths.length === 0) return { months: [], insight: "" };

  const monthSpecs = yearMonths.map((ym) => {
    const bounds = monthYmdBounds(ym) ?? { from: `${ym}-01`, to: `${ym}-01` };
    const fullTo = bounds.to;
    const to = fullTo > todayYmd ? todayYmd : fullTo;
    return {
      yearMonth: ym,
      from: bounds.from,
      to,
      isPartial: to < fullTo,
      isCurrent: ym === anchorYm,
    };
  });

  const fetchFrom = monthSpecs[0].from;
  const fetchTo = monthSpecs[monthSpecs.length - 1].to;

  const [ordersResult, expenseRows] = await Promise.all([
    fetchOrdersCreatedInReportYmdWindow(
      supabase,
      fetchFrom,
      fetchTo,
      "id,status,total_cents,created_at,wompi_reference",
    ),
    fetchExpensesWindow(supabase, fetchFrom, fetchTo),
  ]);

  const allOrders = (ordersResult.rows ?? []) as OrderRowRef[];
  const paidAll = allOrders.filter((o) => o.status === "paid");
  const paidIds = paidAll.map((o) => o.id).filter(Boolean);
  const { rows: itemRows } = await fetchOrderItemsInChunks(
    supabase,
    paidIds,
    "order_id,product_id,quantity,unit_price_cents",
  );
  const orderItems = itemRows as OrderItemRow[];
  const productsById = await loadProductsById(supabase, orderItems);

  const months: MonthlyPulsePoint[] = [];
  for (const spec of monthSpecs) {
    const stats = summarizeWindow(
      spec.from,
      spec.to,
      paidAll,
      orderItems,
      productsById,
      expenseRows,
    );
    const keep =
      spec.isCurrent || stats.ventas > 0 || stats.egresos > 0 || stats.ingresosConIva > 0;
    if (!keep) continue;

    let priorMtdNeta: number | null = null;
    if (spec.isCurrent) {
      const priorYm = addYearMonths(spec.yearMonth, -1);
      const priorBounds = priorYm ? monthYmdBounds(priorYm) : null;
      if (priorYm && priorBounds) {
        const dayCount = reportRangeDayCountInclusive(spec.from, spec.to);
        const priorToRaw = addCalendarDaysReport(priorBounds.from, dayCount - 1);
        const priorTo = priorToRaw > priorBounds.to ? priorBounds.to : priorToRaw;
        priorMtdNeta = summarizeWindow(
          priorBounds.from,
          priorTo,
          paidAll,
          orderItems,
          productsById,
          expenseRows,
        ).gananciaNeta;
      }
    }

    months.push({
      yearMonth: spec.yearMonth,
      label: prettyYearMonthLabel(spec.yearMonth),
      shortLabel: shortMonthLabel(spec.yearMonth),
      year: spec.yearMonth.slice(0, 4),
      from: spec.from,
      to: spec.to,
      isPartial: spec.isPartial,
      isCurrent: spec.isCurrent,
      ...stats,
      priorMtdNeta,
    });
  }

  const current = months.find((m) => m.isCurrent);
  return { months, insight: nowPlayingInsight(current) };
}

export function pulseHighlightYearMonth(
  rangeFrom: string,
  rangeTo: string,
  todayYmd: string,
): string | null {
  if (rangeFrom.slice(0, 7) === rangeTo.slice(0, 7)) {
    return rangeFrom.slice(0, 7);
  }
  void todayYmd;
  return reportYearMonthFromIso(`${rangeTo}T17:00:00.000Z`) || null;
}
