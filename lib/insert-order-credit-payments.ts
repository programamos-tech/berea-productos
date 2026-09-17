import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrderCreditPaymentMethod } from "@/lib/order-credit";

export type OrderCreditPaymentInsert = {
  amountCents: number;
  paymentMethod: OrderCreditPaymentMethod;
  notes?: string | null;
};

/** Inserta abonos de crédito. tenant_id / branch_id los completa el trigger. */
export async function insertOrderCreditPayments(
  supabase: SupabaseClient,
  args: {
    orderId: string;
    createdBy: string;
    payments: OrderCreditPaymentInsert[];
  },
): Promise<"ok" | "db"> {
  const rows = args.payments
    .map((p) => ({
      order_id: args.orderId,
      amount_cents: Math.floor(p.amountCents),
      payment_method: p.paymentMethod,
      notes: p.notes?.trim() || null,
      created_by: args.createdBy,
    }))
    .filter((p) => p.amount_cents > 0);
  if (rows.length === 0) return "ok";
  const { error } = await supabase.from("order_payments").insert(rows);
  if (error) {
    console.error("insertOrderCreditPayments", error.message);
    return "db";
  }
  return "ok";
}
