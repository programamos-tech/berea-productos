import type { CSSProperties } from "react";
import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { leaveStorefrontBranch } from "@/app/actions/storefront-access";
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

  const wholesaleBanner =
    scope.requiresCode && scope.customer ? (
      <div className="bg-stone-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] sm:px-6">
          <p className="min-w-0 truncate">
            Tienda {scope.branchName}
            {scope.customer.wholesalePct > 0
              ? ` · Mayorista ${scope.customer.wholesalePct}%`
              : ""}
          </p>
          <form action={leaveStorefrontBranch}>
            <button type="submit" className="shrink-0 underline underline-offset-2">
              Salir
            </button>
          </form>
        </div>
      </div>
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
