"use client";

import { ShoppingBag } from "lucide-react";
import {
  STORE_HEADER_ICON_LG,
  STORE_HEADER_ICON_STROKE,
} from "@/lib/store-header-icons";
import { StoreFavoritesNavLink } from "@/components/store/StoreFavoritesNavLink";
import { useStoreCartDrawer } from "@/components/store/StoreCartDrawerProvider";

const iconBtn =
  "flex items-center justify-center rounded-none p-1.5 text-white/90 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--store-header-bg)]";

export function StoreHeaderActions({
  cartItemCount,
}: {
  cartItemCount: number;
}) {
  const { openCart } = useStoreCartDrawer();

  return (
    <div className="flex shrink-0 items-center gap-1 sm:gap-2 lg:gap-3">
      <StoreFavoritesNavLink className="hidden md:flex" />
      <button
        type="button"
        onClick={() => openCart()}
        aria-label={
          cartItemCount > 0
            ? `Bolsa de compras, ${cartItemCount} productos. Abrir bolsa`
            : "Bolsa de compras. Abrir bolsa"
        }
        aria-haspopup="dialog"
        className={`${iconBtn} gap-1.5`}
      >
        {cartItemCount > 0 ? (
          <span className="min-w-[1ch] text-center text-[13px] font-medium tabular-nums text-white/90">
            {cartItemCount > 99 ? "99+" : cartItemCount}
          </span>
        ) : null}
        <ShoppingBag
          className={STORE_HEADER_ICON_LG}
          strokeWidth={STORE_HEADER_ICON_STROKE}
          aria-hidden
        />
      </button>
    </div>
  );
}
