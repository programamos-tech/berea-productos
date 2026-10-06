import type { CSSProperties } from "react";
import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { leaveStorefrontBranch } from "@/app/actions/storefront-access";
import { WholesaleSessionBar } from "@/components/store/WholesaleSessionBar";
import { StoreAuthModalProvider } from "@/components/store/StoreAuthModals";
import { StoreCookiesBanner } from "@/components/store/StoreCookiesBanner";
import { StoreFavoritesProvider } from "@/components/store/StoreFavoritesProvider";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreHeaderSkeleton } from "@/components/store/StoreHeaderSkeleton";
import { StoreWelcomeDiscountBanner } from "@/components/store/StoreWelcomeDiscountBanner";
import { StoreWhatsAppFloatingButton } from "@/components/store/StoreWhatsAppFloatingButton";
import { StoreCartDrawerProvider } from "@/components/store/StoreCartDrawerProvider";
import { StoreChromeShell } from "@/components/store/StoreChromeShell";
import { StoreDocumentTheme } from "@/components/store/StoreDocumentTheme";
import { StorefrontBrandProvider } from "@/components/store/StorefrontBrandProvider";
import {
  getCachedBannerStoreCoupon,
} from "@/lib/store-public-cache";
import { getStorefrontChromeForRequest } from "@/lib/tenant-context";
import { getStorefrontScope } from "@/lib/storefront-scope";
import { loadStorefrontWholesaleOrders } from "@/lib/storefront-wholesale-orders";
import {
  storefrontClientChrome,
  storefrontCssVars,
} from "@/lib/storefront-brand";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const chrome = await getStorefrontChromeForRequest();
  return {
    title: {
      default: chrome.name,
      template: `%s | ${chrome.name}`,
    },
    description: chrome.description,
    applicationName: chrome.name,
    appleWebApp: {
      capable: true,
      title: chrome.name,
      statusBarStyle: "default",
    },
    openGraph: {
      title: chrome.name,
      siteName: chrome.name,
      description: chrome.description,
      locale: "es_CO",
      type: "website",
    },
    icons: {
      icon: chrome.logoSrc,
      apple: chrome.logoSrc,
    },
  };
}

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [chrome, promoBanner, scope, headerList] = await Promise.all([
    getStorefrontChromeForRequest(),
    getCachedBannerStoreCoupon(),
    getStorefrontScope(),
    headers(),
  ]);
  const path = headerList.get("x-store-path") ?? "";
  if (
    scope.requiresCode &&
    !scope.customer &&
    path.length > 0 &&
    !path.startsWith("/sucursal")
  ) {
    redirect(`/sucursal/${scope.branchCode}`);
  }

  const wholesaleOrders =
    scope.requiresCode && scope.customer
      ? await loadStorefrontWholesaleOrders(scope.customer.id)
      : null;

  const wholesaleBanner =
    scope.requiresCode && scope.customer && wholesaleOrders ? (
      <WholesaleSessionBar
        customerName={scope.customer.name}
        branchName={scope.branchName}
        wholesalePct={scope.customer.wholesalePct}
        orderCount={wholesaleOrders.count}
        orders={wholesaleOrders.latest}
        leaveAction={leaveStorefrontBranch}
      />
    ) : null;

  const top = (
    <>
      <Suspense fallback={<StoreHeaderSkeleton />}>
        <StoreHeader chrome={chrome} />
      </Suspense>
      {wholesaleBanner}
      {promoBanner && scope.isDefault ? (
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
    </>
  );

  return (
    <StorefrontBrandProvider chrome={storefrontClientChrome(chrome)}>
      <StoreDocumentTheme theme={chrome.theme} name={chrome.name} />
      <div
        className="flex min-h-full flex-col overflow-x-hidden bg-white text-stone-800"
        style={storefrontCssVars(chrome.theme) as CSSProperties}
      >
        <StoreFavoritesProvider>
          <StoreCartDrawerProvider>
            <StoreAuthModalProvider>
              <StoreChromeShell top={top} bottom={bottom}>
                <main className="flex-1">{children}</main>
              </StoreChromeShell>
            </StoreAuthModalProvider>
          </StoreCartDrawerProvider>
        </StoreFavoritesProvider>
      </div>
    </StorefrontBrandProvider>
  );
}
