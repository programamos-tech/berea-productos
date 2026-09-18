import type { SupabaseClient } from "@supabase/supabase-js";
import {
  POS_CREDIT_REF,
  mapOrderCreditPaymentRows,
  orderCreditPendingCents,
  orderCreditUiStatus,
  sumOrderCreditPaidCents,
  type OrderCreditPayment,
  type OrderCreditUiStatus,
} from "@/lib/order-credit";

export type CreditListFilter = "pending" | "paid" | "cancelled" | "all";

export type CreditListRow = {
  id: string;
  customerId: string | null;
  customerName: string;
  totalCents: number;
  paidCents: number;
  pendingCents: number;
  createdAt: string | null;
  status: string;
  uiStatus: OrderCreditUiStatus;
};

export function parseCreditListFilter(
  raw: string | null | undefined,
): CreditListFilter {
  const v = String(raw ?? "").trim();
  if (v === "paid" || v === "cancelled" || v === "all") return v;
  return "pending";
}

export async function fetchOrderCreditPaymentsMap(
  supabase: SupabaseClient,
  orderIds: string[],
): Promise<Map<string, OrderCreditPayment[]>> {
  const out = new Map<string, OrderCreditPayment[]>();
  if (orderIds.length === 0) return out;

  const chunkSize = 120;
  for (let i = 0; i < orderIds.length; i += chunkSize) {
    const part = orderIds.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from("order_payments")
      .select(
        "id,order_id,amount_cents,payment_method,notes,paid_at,is_cancelled,cancellation_reason,cancelled_at",
      )
      .in("order_id", part)
      .order("paid_at", { ascending: false });
    if (error) {
      console.error("fetchOrderCreditPaymentsMap", error.message);
      continue;
    }
    for (const row of data ?? []) {
      const oid = String((row as { order_id?: string }).order_id ?? "");
      if (!oid) continue;
      const mapped = mapOrderCreditPaymentRows([row]);
      const prev = out.get(oid) ?? [];
      out.set(oid, [...prev, ...mapped]);
    }
  }
  return out;
}

export async function fetchAdminCreditsList(
  supabase: SupabaseClient,
  opts: { filter: CreditListFilter; q?: string; customerId?: string },
): Promise<{ rows: CreditListRow[]; error: string | null }> {
  let query = supabase
    .from("orders")
    .select("id,customer_id,customer_name,total_cents,created_at,status")
    .eq("wompi_reference", POS_CREDIT_REF)
    .order("created_at", { ascending: false })
    .limit(400);

  if (opts.filter === "cancelled") {
    query = query.eq("status", "cancelled");
  } else if (opts.filter !== "all") {
    query = query.neq("status", "cancelled");
  }

  const q = opts.q?.trim() ?? "";
  if (q.length > 0) {
    query = query.ilike("customer_name", `%${q}%`);
  }
  const customerId = opts.customerId?.trim() ?? "";
  if (customerId) {
    query = query.eq("customer_id", customerId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("fetchAdminCreditsList", error.message);
    return { rows: [], error: error.message };
  }

  const orders = data ?? [];
  const paymentsMap = await fetchOrderCreditPaymentsMap(
    supabase,
    orders.map((o) => String(o.id)),
  );

  const rows: CreditListRow[] = [];
  for (const o of orders) {
    const totalCents = Math.max(0, Math.floor(Number(o.total_cents ?? 0)));
    const paidCents = sumOrderCreditPaidCents(paymentsMap.get(String(o.id)) ?? []);
    const pendingCents = orderCreditPendingCents(totalCents, paidCents);
    const status = String(o.status ?? "");
    const uiStatus = orderCreditUiStatus({
      orderStatus: status,
      pendingCents,
    });
    if (opts.filter === "pending" && uiStatus !== "pending") continue;
    if (opts.filter === "paid" && uiStatus !== "paid") continue;
    rows.push({
      id: String(o.id),
      customerId:
        o.customer_id != null && String(o.customer_id).trim()
          ? String(o.customer_id)
          : null,
      customerName: String(o.customer_name ?? "Cliente"),
      totalCents,
      paidCents,
      pendingCents,
      createdAt: o.created_at != null ? String(o.created_at) : null,
      status,
      uiStatus,
    });
  }

  return { rows, error: null };
}

export async function fetchCustomerCreditDebtCents(
  supabase: SupabaseClient,
  customerId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("orders")
    .select("id,total_cents,status")
    .eq("customer_id", customerId)
    .eq("wompi_reference", POS_CREDIT_REF)
    .eq("status", "paid");
  if (error) {
    console.error("fetchCustomerCreditDebtCents", error.message);
    return 0;
  }
  const orders = data ?? [];
  const paymentsMap = await fetchOrderCreditPaymentsMap(
    supabase,
    orders.map((o) => String(o.id)),
  );
  let pending = 0;
  for (const o of orders) {
    const totalCents = Math.max(0, Math.floor(Number(o.total_cents ?? 0)));
    const paidCents = sumOrderCreditPaidCents(paymentsMap.get(String(o.id)) ?? []);
    pending += orderCreditPendingCents(totalCents, paidCents);
  }
  return pending;
}
