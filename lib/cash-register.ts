import {
  createdAtBoundsForReportYmdRange,
  todayYmdInReportStore,
} from "@/lib/admin-report-range";
import {
  posPaymentBreakdownForOrder,
  type PosPaymentBreakdownRow,
} from "@/lib/pos-payment-breakdown";
import type { SupabaseClient } from "@supabase/supabase-js";

export type CashSessionStatus = "open" | "closed";

export type CashStockOutLine = {
  product_id: string;
  name: string;
  reference: string | null;
  quantity: number;
};

export type CashRegisterSessionRow = {
  id: string;
  business_day: string;
  status: CashSessionStatus;
  opening_float_cents: number;
  opened_at: string;
  opened_by: string;
  sales_count: number | null;
  sales_total_cents: number | null;
  sales_cash_cents: number | null;
  sales_transfer_cents: number | null;
  sales_mixed_cents: number | null;
  sales_other_cents: number | null;
  expenses_cash_cents: number | null;
  expenses_other_cents: number | null;
  expected_cash_cents: number | null;
  counted_cash_cents: number | null;
  cash_difference_cents: number | null;
  units_sold: number | null;
  stock_out_lines: CashStockOutLine[];
  notes: string | null;
  closed_at: string | null;
  closed_by: string | null;
  created_at: string;
};

export type CashDayLiveTotals = {
  businessDay: string;
  salesCount: number;
  salesTotalCents: number;
  salesCashCents: number;
  salesTransferCents: number;
  salesMixedCents: number;
  salesOtherCents: number;
  expensesCashCents: number;
  expensesOtherCents: number;
  unitsSold: number;
  stockOutLines: CashStockOutLine[];
  expectedCashCents: number;
};

const SESSION_SELECT =
  "id,business_day,status,opening_float_cents,opened_at,opened_by,sales_count,sales_total_cents,sales_cash_cents,sales_transfer_cents,sales_mixed_cents,sales_other_cents,expenses_cash_cents,expenses_other_cents,expected_cash_cents,counted_cash_cents,cash_difference_cents,units_sold,stock_out_lines,notes,closed_at,closed_by,created_at";

function parseStockLines(raw: unknown): CashStockOutLine[] {
  if (!Array.isArray(raw)) return [];
  const out: CashStockOutLine[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const productId = String(r.product_id ?? "").trim();
    const name = String(r.name ?? "").trim();
    const qty = Math.max(0, Math.floor(Number(r.quantity ?? 0)));
    if (!productId || !name || qty <= 0) continue;
    const reference =
      r.reference == null || String(r.reference).trim() === ""
        ? null
        : String(r.reference).trim();
    out.push({ product_id: productId, name, reference, quantity: qty });
  }
  return out;
}

export function mapCashSessionRow(raw: Record<string, unknown>): CashRegisterSessionRow {
  return {
    id: String(raw.id),
    business_day: String(raw.business_day).slice(0, 10),
    status: raw.status === "closed" ? "closed" : "open",
    opening_float_cents: Math.max(0, Math.floor(Number(raw.opening_float_cents ?? 0))),
    opened_at: String(raw.opened_at),
    opened_by: String(raw.opened_by),
    sales_count:
      raw.sales_count == null ? null : Math.max(0, Math.floor(Number(raw.sales_count))),
    sales_total_cents:
      raw.sales_total_cents == null
        ? null
        : Math.max(0, Math.floor(Number(raw.sales_total_cents))),
    sales_cash_cents:
      raw.sales_cash_cents == null
        ? null
        : Math.max(0, Math.floor(Number(raw.sales_cash_cents))),
    sales_transfer_cents:
      raw.sales_transfer_cents == null
        ? null
        : Math.max(0, Math.floor(Number(raw.sales_transfer_cents))),
    sales_mixed_cents:
      raw.sales_mixed_cents == null
        ? null
        : Math.max(0, Math.floor(Number(raw.sales_mixed_cents))),
    sales_other_cents:
      raw.sales_other_cents == null
        ? null
        : Math.max(0, Math.floor(Number(raw.sales_other_cents))),
    expenses_cash_cents:
      raw.expenses_cash_cents == null
        ? null
        : Math.max(0, Math.floor(Number(raw.expenses_cash_cents))),
    expenses_other_cents:
      raw.expenses_other_cents == null
        ? null
        : Math.max(0, Math.floor(Number(raw.expenses_other_cents))),
    expected_cash_cents:
      raw.expected_cash_cents == null
        ? null
        : Math.floor(Number(raw.expected_cash_cents)),
    counted_cash_cents:
      raw.counted_cash_cents == null
        ? null
        : Math.max(0, Math.floor(Number(raw.counted_cash_cents))),
    cash_difference_cents:
      raw.cash_difference_cents == null
        ? null
        : Math.floor(Number(raw.cash_difference_cents)),
    units_sold:
      raw.units_sold == null ? null : Math.max(0, Math.floor(Number(raw.units_sold))),
    stock_out_lines: parseStockLines(raw.stock_out_lines),
    notes: raw.notes == null ? null : String(raw.notes),
    closed_at: raw.closed_at == null ? null : String(raw.closed_at),
    closed_by: raw.closed_by == null ? null : String(raw.closed_by),
    created_at: String(raw.created_at),
  };
}

export function expectedCashFromParts(
  openingFloatCents: number,
  salesCashCents: number,
  expensesCashCents: number,
): number {
  return (
    Math.max(0, Math.floor(openingFloatCents)) +
    Math.max(0, Math.floor(salesCashCents)) -
    Math.max(0, Math.floor(expensesCashCents))
  );
}

/** Totales vivos del día calendario (Bogotá) para armar / cerrar caja. */
export async function fetchCashDayLiveTotals(
  supabase: SupabaseClient,
  businessDayYmd: string,
  openingFloatCents: number,
): Promise<CashDayLiveTotals> {
  const bounds = createdAtBoundsForReportYmdRange(businessDayYmd, businessDayYmd);
  if (!bounds) {
    return {
      businessDay: businessDayYmd,
      salesCount: 0,
      salesTotalCents: 0,
      salesCashCents: 0,
      salesTransferCents: 0,
      salesMixedCents: 0,
      salesOtherCents: 0,
      expensesCashCents: 0,
      expensesOtherCents: 0,
      unitsSold: 0,
      stockOutLines: [],
      expectedCashCents: expectedCashFromParts(openingFloatCents, 0, 0),
    };
  }

  const [ordersRes, expensesRes] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id,status,total_cents,wompi_reference,pos_mixed_cash_cents,pos_mixed_transfer_cents,created_at",
      )
      .eq("status", "paid")
      .gte("created_at", bounds.gte)
      .lt("created_at", bounds.lt),
    supabase
      .from("store_expenses")
      .select("amount_cents,payment_method,expense_date,is_cancelled")
      .eq("expense_date", businessDayYmd),
  ]);

  const orders = (ordersRes.data ?? []) as Array<
    PosPaymentBreakdownRow & { id?: string }
  >;
  let salesCash = 0;
  let salesTransfer = 0;
  let salesMixed = 0;
  let salesOther = 0;
  let salesTotal = 0;
  const orderIds: string[] = [];
  for (const row of orders) {
    const b = posPaymentBreakdownForOrder(row);
    salesCash += b.cashCents;
    salesTransfer += b.transferCents;
    salesMixed += b.mixedCents;
    salesOther += b.otherCents;
    salesTotal +=
      b.cashCents + b.transferCents + b.mixedCents + b.otherCents;
    if (row.id) orderIds.push(String(row.id));
  }

  let expensesCash = 0;
  let expensesOther = 0;
  for (const e of expensesRes.data ?? []) {
    if ((e as { is_cancelled?: boolean }).is_cancelled) continue;
    const amount = Math.max(0, Math.floor(Number(e.amount_cents ?? 0)));
    const pm = String(e.payment_method ?? "").trim().toLowerCase();
    if (pm === "efectivo") expensesCash += amount;
    else expensesOther += amount;
  }

  let unitsSold = 0;
  const qtyByProduct = new Map<string, number>();
  if (orderIds.length > 0) {
    const { data: items } = await supabase
      .from("order_items")
      .select("product_id,quantity,product_name_snapshot")
      .in("order_id", orderIds);

    for (const item of items ?? []) {
      const qty = Math.max(0, Math.floor(Number(item.quantity ?? 0)));
      if (qty <= 0) continue;
      unitsSold += qty;
      const pid = item.product_id != null ? String(item.product_id) : "";
      if (!pid) continue;
      qtyByProduct.set(pid, (qtyByProduct.get(pid) ?? 0) + qty);
    }
  }

  const productIds = [...qtyByProduct.keys()];
  const nameById = new Map<string, { name: string; reference: string | null }>();
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id,name,reference")
      .in("id", productIds);
    for (const p of products ?? []) {
      nameById.set(String(p.id), {
        name: String(p.name ?? "Producto"),
        reference:
          p.reference == null || String(p.reference).trim() === ""
            ? null
            : String(p.reference).trim(),
      });
    }
  }

  // Fallback names from order_items snapshots if product missing
  if (orderIds.length > 0 && productIds.some((id) => !nameById.has(id))) {
    const { data: snaps } = await supabase
      .from("order_items")
      .select("product_id,product_name_snapshot")
      .in("order_id", orderIds)
      .in("product_id", productIds);
    for (const s of snaps ?? []) {
      const pid = String(s.product_id ?? "");
      if (!pid || nameById.has(pid)) continue;
      const n = String(s.product_name_snapshot ?? "").trim();
      if (n) nameById.set(pid, { name: n, reference: null });
    }
  }

  const stockOutLines = [...qtyByProduct.entries()]
    .map(([product_id, quantity]) => {
      const meta = nameById.get(product_id);
      return {
        product_id,
        name: meta?.name ?? "Producto",
        reference: meta?.reference ?? null,
        quantity,
      };
    })
    .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name))
    .slice(0, 40);

  return {
    businessDay: businessDayYmd,
    salesCount: orders.length,
    salesTotalCents: salesTotal,
    salesCashCents: salesCash,
    salesTransferCents: salesTransfer,
    salesMixedCents: salesMixed,
    salesOtherCents: salesOther,
    expensesCashCents: expensesCash,
    expensesOtherCents: expensesOther,
    unitsSold,
    stockOutLines,
    expectedCashCents: expectedCashFromParts(
      openingFloatCents,
      salesCash,
      expensesCash,
    ),
  };
}

export async function fetchOpenCashSession(
  supabase: SupabaseClient,
): Promise<CashRegisterSessionRow | null> {
  const { data, error } = await supabase
    .from("cash_register_sessions")
    .select(SESSION_SELECT)
    .eq("status", "open")
    .maybeSingle();
  if (error) {
    console.error("fetchOpenCashSession", error);
    return null;
  }
  if (!data) return null;
  return mapCashSessionRow(data as Record<string, unknown>);
}

export async function fetchCashSessionById(
  supabase: SupabaseClient,
  id: string,
): Promise<CashRegisterSessionRow | null> {
  const { data, error } = await supabase
    .from("cash_register_sessions")
    .select(SESSION_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return mapCashSessionRow(data as Record<string, unknown>);
}

export async function fetchRecentCashSessions(
  supabase: SupabaseClient,
  limit = 30,
): Promise<CashRegisterSessionRow[]> {
  const { data, error } = await supabase
    .from("cash_register_sessions")
    .select(SESSION_SELECT)
    .order("business_day", { ascending: false })
    .limit(Math.min(100, Math.max(1, limit)));
  if (error) {
    console.error("fetchRecentCashSessions", error);
    return [];
  }
  return (data ?? []).map((r) => mapCashSessionRow(r as Record<string, unknown>));
}

export function todayBusinessDayYmd(): string {
  return todayYmdInReportStore();
}
