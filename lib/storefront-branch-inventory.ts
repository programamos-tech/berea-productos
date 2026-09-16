import { fetchBranchInventoryMap } from "@/lib/branch-inventory";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProductKitRow } from "@/lib/product-kits";

export async function getStorefrontBranchId(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("branches")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("is_default", true)
    .eq("is_active", true)
    .maybeSingle();
  return data?.id ? String(data.id) : null;
}

export async function withStorefrontKitStock(
  supabase: SupabaseClient,
  tenantId: string,
  kits: ProductKitRow[],
): Promise<ProductKitRow[]> {
  const branchId = await getStorefrontBranchId(supabase, tenantId);
  if (!branchId) return kits;
  const ids = [
    ...new Set(
      kits.flatMap((kit) =>
        (kit.items ?? []).map((item) => String(item.product_id)),
      ),
    ),
  ];
  const inventory = await fetchBranchInventoryMap(supabase, branchId, ids);
  return kits.map((kit) => ({
    ...kit,
    items: (kit.items ?? []).map((item) => ({
      ...item,
      products:
        item.products && !Array.isArray(item.products)
          ? {
              ...item.products,
              stock_local: inventory.get(String(item.product_id)) ?? 0,
              stock_quantity: inventory.get(String(item.product_id)) ?? 0,
            }
          : item.products,
    })),
  }));
}

export async function withStorefrontBranchStock<
  T extends { id: string; stock_quantity?: number | null },
>(
  supabase: SupabaseClient,
  tenantId: string,
  rows: T[],
): Promise<T[]> {
  const branchId = await getStorefrontBranchId(supabase, tenantId);
  if (!branchId || rows.length === 0) return rows;
  const inventory = await fetchBranchInventoryMap(
    supabase,
    branchId,
    rows.map((row) => row.id),
  );
  return rows.map((row) => ({
    ...row,
    stock_quantity: inventory.get(row.id) ?? 0,
  }));
}
