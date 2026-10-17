import Link from "next/link";
import { getStorefrontCartItemCount } from "@/lib/storefront-cart";
import { StoreAnnouncementBar } from "@/components/store/StoreAnnouncementBar";
import { StoreHeaderActions } from "@/components/store/StoreHeaderActions";
import { StoreLogoLink } from "@/components/store/StoreLogoLink";
import { StoreNavDropdowns } from "@/components/store/StoreNavDropdowns";
import { StoreSearch } from "@/components/store/StoreSearch";
import { getCachedStoreCategoriesWithCounts } from "@/lib/store-public-cache";
import { storeShellClass } from "@/lib/store-theme";
import { storefrontLogoSrc } from "@/lib/tenant-brand";
import type { StorefrontChrome } from "@/lib/storefront-brand";

export async function StoreHeader({
  chrome,
  onLight = false,
  wholesaleHref = null,
}: {
  chrome: StorefrontChrome;
  onLight?: boolean;
  /** Tienda mayorista (Bodega). Solo en la vitrina pública de Aleya. */
  wholesaleHref?: string | null;
}) {
  const [menuCategories, cartItemCount] = await Promise.all([
    getCachedStoreCategoriesWithCounts(),
    getStorefrontCartItemCount(),
  ]);

  return (
    <header>
      <StoreAnnouncementBar chrome={chrome} />

      <div
        data-header-tone={onLight ? "light" : undefined}
        className="border-b border-white/20 bg-[var(--store-header-bg)] text-[var(--store-header-fg)]"
      >
        <div className={`${storeShellClass} grid grid-cols-[auto_1fr_auto] items-center gap-x-2 py-3 sm:gap-x-3 md:py-3.5 lg:grid-cols-[1fr_auto_1fr] lg:gap-x-6 lg:py-5`}>
          <div className="flex min-w-0 items-center justify-start gap-4 lg:gap-6 lg:pr-4">
            <StoreNavDropdowns
              menuCategories={menuCategories}
              wholesaleHref={wholesaleHref}
            />
            {wholesaleHref ? (
              <Link
                href={wholesaleHref}
                className="hidden whitespace-nowrap text-[12px] font-medium tracking-wide text-white/90 underline-offset-4 transition hover:text-white hover:underline sm:inline lg:text-[13px]"
              >
                <span className="lg:hidden">Mayorista</span>
                <span className="hidden lg:inline">Ingresar como mayorista</span>
              </Link>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-col items-center justify-center px-1 sm:px-2">
            <StoreLogoLink
              brand={chrome.name}
              logoPath={storefrontLogoSrc(chrome.logoSrc, onLight)}
              square={chrome.logoSquare}
              className="block max-w-[min(100%,16rem)] bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-white/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--store-header-bg)] sm:max-w-[min(100%,18rem)] lg:max-w-[20rem]"
            />
          </div>

          <div className="flex min-w-0 items-center justify-end gap-0.5 sm:gap-1 md:gap-2 lg:justify-end lg:gap-4 lg:pl-4">
            <StoreSearch variant="minimal" />
            <StoreHeaderActions cartItemCount={cartItemCount} />
          </div>
        </div>
      </div>
    </header>
  );
}
