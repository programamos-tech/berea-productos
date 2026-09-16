import type { SupabaseClient } from "@supabase/supabase-js";

export async function fetchCurrentBranchInventoryMap(
  supabase: SupabaseClient,
  productIds: string[],
): Promise<Map<string, number>> {
  const ids = [...new Set(productIds.filter(Boolean))];
  if (ids.length === 0) return new Map();
  const { data, error } = await supabase.rpc("current_branch_inventory", {
    p_product_ids: ids,
  });
  if (error) {
    console.error("[branch-inventory] current:", error.message);
    return new Map();
  }
  return new Map(
    (data ?? []).map((row: { product_id: string; quantity: number }) => [
      String(row.product_id),
      Math.max(0, Math.floor(Number(row.quantity ?? 0))),
    ]),
  );
}

export async function fetchBranchInventoryMap(
  supabase: SupabaseClient,
  branchId: string,
  productIds: string[],
): Promise<Map<string, number>> {
  const ids = [...new Set(productIds.filter(Boolean))];
  if (ids.length === 0) return new Map();
  const { data, error } = await supabase
    .from("branch_inventory")
    .select("product_id,quantity")
    .eq("branch_id", branchId)
    .in("product_id", ids);
  if (error) {
    console.error("[branch-inventory] branch:", error.message);
    return new Map();
  }
  return new Map(
    (data ?? []).map((row) => [
      String(row.product_id),
      Math.max(0, Math.floor(Number(row.quantity ?? 0))),
    ]),
  );
}
