import type { CSSProperties } from "react";
import { Suspense } from "react";
import type { Metadata } from "next";
import { StoreAuthModalProvider } from "@/components/store/StoreAuthModals";
import { StoreCookiesBanner } from "@/components/store/StoreCookiesBanner";
import { StoreFavoritesProvider } from "@/components/store/StoreFavoritesProvider";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreHeaderSkeleton } from "@/components/store/StoreHeaderSkeleton";
import { StoreWelcomeSignupModal } from "@/components/store/StoreWelcomeSignupModal";
import { StoreWelcomeDiscountBanner } from "@/components/store/StoreWelcomeDiscountBanner";
import { StoreWhatsAppFloatingButton } from "@/components/store/StoreWhatsAppFloatingButton";
import { StoreCartDrawerProvider } from "@/components/store/StoreCartDrawerProvider";
import { StoreChromeShell } from "@/components/store/StoreChromeShell";
import { StorefrontBrandProvider } from "@/components/store/StorefrontBrandProvider";
import { resolveWelcomeModalCtaHref } from "@/lib/store-welcome-modal";
import {
  getCachedBannerStoreCoupon,
  getCachedActiveWelcomeModal,
} from "@/lib/store-public-cache";
import { getStorefrontChromeForRequest } from "@/lib/tenant-context";
import { storefrontClientChrome } from "@/lib/storefront-brand";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const chrome = await getStorefrontChromeForRequest();
  return {
    title: {
      default: chrome.name,
      template: `%s | ${chrome.name}`,
    },
    description: chrome.description,
  };
}

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [chrome, welcomeModal, promoBanner] = await Promise.all([
    getStorefrontChromeForRequest(),
    getCachedActiveWelcomeModal(),
    getCachedBannerStoreCoupon(),
  ]);

  const top = (
    <>
      <Suspense fallback={<StoreHeaderSkeleton />}>
        <StoreHeader chrome={chrome} />
      </Suspense>
      {promoBanner ? (
        <StoreWelcomeDiscountBanner dbCoupon={promoBanner} />
      ) : null}
    </>
  );

  const bottom = (
    <>
      <StoreFooter chrome={chrome} />
      <StoreWhatsAppFloatingButton
        phone={chrome.phone}
        whatsappUrl={chrome.whatsappUrl}
        message={chrome.whatsappPrefilledText}
      />
      <StoreCookiesBanner
        brandName={chrome.name}
        tenantSlug={chrome.tenantSlug}
      />
      {welcomeModal ? (
        <StoreWelcomeSignupModal
          title={welcomeModal.title}
          description={welcomeModal.description}
          imagePath={welcomeModal.image_path}
          discountCode={welcomeModal.discount_code}
          ctaLabel={welcomeModal.cta_label}
          ctaHref={resolveWelcomeModalCtaHref(welcomeModal.cta_href)}
        />
      ) : null}
    </>
  );

  return (
    <StorefrontBrandProvider chrome={storefrontClientChrome(chrome)}>
      <StoreFavoritesProvider>
        <StoreCartDrawerProvider>
          <StoreAuthModalProvider>
          <div
            className="flex min-h-full flex-col overflow-x-hidden bg-white text-stone-800"
            style={
              {
                "--store-accent": chrome.theme.primary,
                "--store-accent-hover": chrome.theme.primaryHover,
                "--store-brand": chrome.theme.primary,
                "--store-brand-hover": chrome.theme.primaryHover,
                "--store-header-bg": chrome.theme.primary,
                "--store-header-fg": chrome.theme.foreground,
                "--store-announcement-bg": chrome.theme.announcement,
                "--store-image-well-tint": chrome.theme.imageTint,
              } as CSSProperties
            }
          >
            <StoreChromeShell top={top} bottom={bottom}>
              <main className="flex-1">{children}</main>
            </StoreChromeShell>
          </div>
          </StoreAuthModalProvider>
        </StoreCartDrawerProvider>
      </StoreFavoritesProvider>
    </StorefrontBrandProvider>
  );
}
