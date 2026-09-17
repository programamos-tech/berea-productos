import Link from "next/link";
import { Search } from "lucide-react";
import {
  STORE_HEADER_ICON_LG,
  STORE_HEADER_ICON_STROKE,
} from "@/lib/store-header-icons";
import { getStorefrontCartItemCount } from "@/lib/storefront-cart";
import { StoreAnnouncementBar } from "@/components/store/StoreAnnouncementBar";
import { StoreHeaderActions } from "@/components/store/StoreHeaderActions";
import { StoreLogoLink } from "@/components/store/StoreLogoLink";
import { StoreNavDropdowns } from "@/components/store/StoreNavDropdowns";
import { StoreSearch } from "@/components/store/StoreSearch";
import { getCachedStoreCategoriesWithCounts } from "@/lib/store-public-cache";
import { storeShellClass } from "@/lib/store-theme";
import type { StorefrontChrome } from "@/lib/storefront-brand";

export async function StoreHeader({
  chrome,
}: {
  chrome: StorefrontChrome;
}) {
  const [menuCategories, cartItemCount] = await Promise.all([
    getCachedStoreCategoriesWithCounts(),
    getStorefrontCartItemCount(),
  ]);

  return (
    <header>
      <StoreAnnouncementBar chrome={chrome} />

      <div className="border-b border-white/20 bg-[var(--store-header-bg)] text-[var(--store-header-fg)]">
        <div className={`${storeShellClass} grid grid-cols-[auto_1fr_auto] items-center gap-x-2 py-3 sm:gap-x-3 md:py-3.5 lg:grid-cols-[1fr_auto_1fr] lg:gap-x-6 lg:py-5`}>
          <div className="flex min-w-0 items-center justify-start lg:pr-4">
            <StoreNavDropdowns menuCategories={menuCategories} />
          </div>

          <div className="flex min-w-0 justify-center px-1 sm:px-2">
            <StoreLogoLink
              brand={chrome.name}
              logoPath={chrome.logoSrc}
              className="block max-w-[min(100%,18rem)] outline-none focus-visible:ring-2 focus-visible:ring-white/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--store-header-bg)] sm:max-w-[min(100%,20rem)] lg:max-w-[22rem] xl:max-w-[24rem]"
            />
          </div>

          <div className="flex min-w-0 items-center justify-end gap-0.5 sm:gap-1 md:gap-2 lg:justify-end lg:gap-4 lg:pl-4">
            <Link
              href="/products"
              className="hidden shrink-0 items-center justify-center p-1.5 text-white/90 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--store-header-bg)] md:flex lg:hidden"
              aria-label="Buscar productos"
            >
              <Search
                className={STORE_HEADER_ICON_LG}
                strokeWidth={STORE_HEADER_ICON_STROKE}
                aria-hidden
              />
            </Link>
            <StoreSearch variant="minimal" />
            <StoreHeaderActions cartItemCount={cartItemCount} />
          </div>
        </div>
      </div>
    </header>
  );
}
