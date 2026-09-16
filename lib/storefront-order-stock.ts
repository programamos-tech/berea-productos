import type { SupabaseClient } from "@supabase/supabase-js";

export type DeductOrderItemsStockResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "no_items"
        | "product_missing"
        | "insufficient_stock"
        | "db";
    };

function deductionReason(message: string): Exclude<
  DeductOrderItemsStockResult,
  { ok: true }
>["reason"] {
  const text = message.toLowerCase();
  if (text.includes("insufficient_stock")) return "insufficient_stock";
  if (text.includes("product") || text.includes("order_not_found")) {
    return "product_missing";
  }
  if (text.includes("no_items")) return "no_items";
  return "db";
}

/** Atomic stock deduction against the branch stored on the order. */
export async function deductOrderItemsStock(
  supabase: SupabaseClient,
  orderId: string,
): Promise<DeductOrderItemsStockResult> {
  const { error } = await supabase.rpc("deduct_order_branch_inventory", {
    p_order_id: orderId,
  });
  if (error) {
    return { ok: false, reason: deductionReason(error.message ?? "") };
  }
  return { ok: true };
}

async function rollbackTransferOrder(
  supabase: SupabaseClient,
  orderId: string,
) {
  await supabase.from("order_items").delete().eq("order_id", orderId);
  await supabase.from("orders").delete().eq("id", orderId);
}

export async function deductTransferWebOrderStock(
  supabase: SupabaseClient,
  orderId: string,
): Promise<DeductOrderItemsStockResult> {
  const result = await deductOrderItemsStock(supabase, orderId);
  if (!result.ok) await rollbackTransferOrder(supabase, orderId);
  return result;
}
