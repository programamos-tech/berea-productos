import {
  unitPriceGrossCents,
  unitPriceGrossExactCents,
} from "@/lib/product-vat-price";

/** Consumidor final vs mayorista (panel admin). */
export type StoreCustomerKind = "retail" | "wholesale";

export function parseStoreCustomerKind(raw: string | null | undefined): StoreCustomerKind {
  return raw === "wholesale" ? "wholesale" : "retail";
}

export function clampWholesaleDiscountPercent(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.floor(n)));
}

/**
 * Precio unitario en centavos tras descuento mayorista (% sobre catálogo),
 * mismo redondeo que cupones: descuento = round(precio × % / 100).
 */
export function unitPriceAfterWholesaleCents(
  catalogPriceCents: number,
  discountPercent: number,
): number {
  const p = clampWholesaleDiscountPercent(discountPercent);
  if (p <= 0) return Math.max(0, Math.floor(Number(catalogPriceCents ?? 0)));
  if (p >= 100) return 0;
  const base = Math.max(0, Math.floor(Number(catalogPriceCents ?? 0)));
  return Math.max(0, base - Math.round((base * p) / 100));
}

/**
 * Unitario con IVA para el cliente. La lista va a la centena; el precio mayorista
 * queda exacto al peso para no cobrar más de lo que da el porcentaje.
 */
export function unitGrossAfterWholesaleCents(
  catalogPriceCents: number,
  hasVat: boolean | null | undefined,
  discountPercent: number,
): number {
  const net = unitPriceAfterWholesaleCents(catalogPriceCents, discountPercent);
  if (clampWholesaleDiscountPercent(discountPercent) <= 0) {
    return unitPriceGrossCents(net, hasVat, null);
  }
  return unitPriceGrossExactCents(net, hasVat);
}

export function wholesaleDiscountPercentFromRow(row: {
  customer_kind?: string | null;
  wholesale_discount_percent?: number | null;
}): number {
  if (parseStoreCustomerKind(row.customer_kind) !== "wholesale") return 0;
  return clampWholesaleDiscountPercent(Number(row.wholesale_discount_percent ?? 0));
}
