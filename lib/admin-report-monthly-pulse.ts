import type { SupabaseClient } from "@supabase/supabase-js";
import {
  addYearMonths,
  currentYearMonthInReportStore,
  dayInRange,
  monthYmdBounds,
  prettyYearMonthLabel,
  reportCalendarDayKeyFromIso,
  reportYearMonthFromIso,
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
import { formatCop } from "@/lib/money";

export type MonthlyPulsePoint = {
  yearMonth: string;
  /** «julio de 2026» */
  label: string;
  /** Etiqueta corta: «Julio» */
  shortLabel: string;
  from: string;
  to: string;
  isPartial: boolean;
  ventas: number;
  ingresosConIva: number;
  gananciaBruta: number;
  egresos: number;
  gananciaNeta: number;
};

export type MonthlyPulseResult = {
  months: MonthlyPulsePoint[];
  /** Frase tipo: «Julio cerró en verde… Agosto en rojo…» */
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
    .limit(3000);
  if (!withCancelled.error) return (withCancelled.data ?? []) as Record<string, unknown>[];

  const fallback = await supabase
    .from("store_expenses")
    .select("amount_cents,expense_date,created_at")
    .gte("expense_date", from)
    .lte("expense_date", to)
    .limit(3000);
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

function buildInsight(months: MonthlyPulsePoint[]): string {
  if (months.length === 0) return "";
  const parts = months.map((m) => {
    const tone = m.gananciaNeta >= 0 ? "en verde" : "en rojo";
    const amount = formatCop(m.gananciaNeta);
    if (m.isPartial) {
      return `${m.shortLabel} (parcial) va ${tone} (${amount})`;
    }
    return `${m.shortLabel} cerró ${tone} (${amount})`;
  });
  if (parts.length === 1) return parts[0] + ".";
  if (parts.length === 2) return `${parts[0]}. ${parts[1]}.`;
  const last = parts[parts.length - 1];
  const head = parts.slice(0, -1).join(". ");
  return `${head}. ${last}.`;
}

/**
 * Últimos `monthCount` meses calendario (tienda), anclados al mes actual.
 * Misma definición de ganancia que Reportes: margen por línea − egresos activos.
 * Independiente del filtro del resumen.
 */
export async function fetchAdminReportMonthlyPulse(
  supabase: SupabaseClient,
  opts?: { monthCount?: number; todayYmd?: string; now?: Date },
): Promise<MonthlyPulseResult> {
  const monthCount = Math.min(6, Math.max(2, Math.trunc(opts?.monthCount ?? 3)));
  const todayYmd =
    opts?.todayYmd ??
    reportCalendarDayKeyFromIso((opts?.now ?? new Date()).toISOString());
  const anchorYm = currentYearMonthInReportStore(opts?.now);

  const yearMonths: string[] = [];
  for (let i = monthCount - 1; i >= 0; i -= 1) {
    const ym = addYearMonths(anchorYm, -i);
    if (ym) yearMonths.push(ym);
  }
  if (yearMonths.length === 0) return { months: [], insight: "" };

  const monthSpecs = yearMonths.map((ym) => {
    const bounds = monthYmdBounds(ym);
    if (!bounds) {
      return {
        yearMonth: ym,
        from: `${ym}-01`,
        to: `${ym}-01`,
        isPartial: false,
      };
    }
    const fullTo = bounds.to;
    const to = fullTo > todayYmd ? todayYmd : fullTo;
    const isPartial = to < fullTo;
    return { yearMonth: ym, from: bounds.from, to, isPartial };
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

  const months: MonthlyPulsePoint[] = monthSpecs.map((spec) => {
    const paid = paidAll.filter((o) => {
      if (typeof o.created_at !== "string") return false;
      const dk = reportCalendarDayKeyFromIso(o.created_at);
      return dayInRange(dk, spec.from, spec.to);
    });

    const rev = sumRevenueNetGrossForOrders(paid, orderItems, productsById);
    const bruta = sumGrossProfitNetOnLinesForPaidOrders(
      paid,
      orderItems,
      productsById,
    );

    let egresos = 0;
    for (const e of expenseRows) {
      if (isExpenseCancelled(e)) continue;
      const dk = expenseDayKey(e);
      if (!dayInRange(dk, spec.from, spec.to)) continue;
      egresos += Math.max(0, Math.round(Number(e.amount_cents ?? 0)));
    }

    const neta = bruta - egresos;
    return {
      yearMonth: spec.yearMonth,
      label: prettyYearMonthLabel(spec.yearMonth),
      shortLabel: shortMonthLabel(spec.yearMonth),
      from: spec.from,
      to: spec.to,
      isPartial: spec.isPartial,
      ventas: paid.length,
      ingresosConIva: rev.gross,
      gananciaBruta: bruta,
      egresos,
      gananciaNeta: neta,
    };
  });

  return { months, insight: buildInsight(months) };
}

/** Mes `YYYY-MM` del día ancla (filtro), por si se quiere resaltar. */
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
