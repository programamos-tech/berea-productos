import { unitPriceAfterWholesaleCents } from "@/lib/customer-wholesale-pricing";
import { unitPriceGrossCents } from "@/lib/product-vat-price";
import { storefrontPriceAfterCouponCents } from "@/lib/store-coupons";

/** Precio de lista unitario con IVA (catálogo neto en BD). */
export function storefrontListGrossUnitCents(
  catalogNetCents: number,
  hasVat: boolean | null | undefined,
): number {
  return unitPriceGrossCents(catalogNetCents, hasVat, null);
}

/** Unitario a cobrar con IVA tras descuento mayorista (% sobre catálogo neto). */
export function storefrontPayableUnitGrossCents(
  catalogNetCents: number,
  hasVat: boolean | null | undefined,
  wholesaleDiscountPercent: number,
): number {
  const netUnit = unitPriceAfterWholesaleCents(
    catalogNetCents,
    wholesaleDiscountPercent,
  );
  return unitPriceGrossCents(netUnit, hasVat, null);
}

/**
 * Precio de vitrina: lista, o el menor entre mayorista y cupón.
 * El tachado se muestra cuando `displayGross` es menor que `listGross`.
 */
export function storefrontDisplayGrossUnitCents(
  catalogNetCents: number,
  hasVat: boolean | null | undefined,
  options?: { wholesalePercent?: number; couponPercent?: number },
): { listGross: number; displayGross: number } {
  const listGross = storefrontListGrossUnitCents(catalogNetCents, hasVat);
  const wholesale = Math.max(
    0,
    Math.min(100, Math.floor(Number(options?.wholesalePercent) || 0)),
  );
  const coupon = Math.max(
    0,
    Math.min(100, Math.floor(Number(options?.couponPercent) || 0)),
  );
  const candidates = [listGross];
  if (wholesale > 0) {
    candidates.push(
      storefrontPayableUnitGrossCents(catalogNetCents, hasVat, wholesale),
    );
  }
  if (coupon > 0) {
    candidates.push(
      storefrontUnitGrossAfterCouponCents(catalogNetCents, hasVat, coupon),
    );
  }
  return { listGross, displayGross: Math.min(...candidates) };
}

/** Unitario con IVA tras cupón % sobre el catálogo neto. */
export function storefrontUnitGrossAfterCouponCents(
  catalogNetCents: number,
  hasVat: boolean | null | undefined,
  couponDiscountPercent: number,
): number {
  const netAfter = storefrontPriceAfterCouponCents(
    catalogNetCents,
    couponDiscountPercent,
  );
  return unitPriceGrossCents(netAfter, hasVat, null);
}
