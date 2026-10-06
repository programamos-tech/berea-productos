"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Suspense, type SVGProps } from "react";
import {
  adminNavItemActive,
  filterAdminNavSections,
} from "@/components/admin/admin-nav-config";
import { BranchSwitcher } from "@/components/admin/BranchSwitcher";
import { OperatorAccountLogo } from "@/components/admin/OperatorAccountLogo";
import {
  adminProductBrand,
  adminSidebarLogoPath,
  adminSupportWhatsAppDisplay,
  adminSupportWhatsAppPrefilledText,
  adminSupportWhatsAppUrl,
} from "@/lib/brand";
import { ADMIN_TENANT_SIDEBAR_BG } from "@/lib/admin-theme";
import type { BranchContext } from "@/lib/branch-context";
import { storagePublicObjectUrl } from "@/lib/storage-public-url";
import {
  storefrontPathForBranch,
  storefrontUrlForBranch,
  storefrontUrlLabel,
} from "@/lib/storefront-branch-url";

function Icon(props: SVGProps<SVGSVGElement> & { children: React.ReactNode }) {
  const { children, className = "", ...rest } = props;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`size-[18px] shrink-0 ${className}`}
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

const STOREFRONT_HREF = "/";

function IconExternalStore({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </Icon>
  );
}

const sidebarInkMuted = "text-zinc-500";
const sidebarBorder = "border-zinc-800";
const sidebarBg = { backgroundColor: ADMIN_TENANT_SIDEBAR_BG };

type AccountBrand = {
  name: string;
  logoSrc: string;
  plateColor: string;
  logoFullColor?: boolean;
};

function SidebarProductBrand({ account }: { account: AccountBrand }) {
  return (
    <Link
      href="/admin"
      prefetch
      className="inline-flex rounded-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#161618]"
    >
      {account.logoFullColor ? (
        <span
          className="relative block h-14 w-28 overflow-hidden rounded-xl"
          style={{ backgroundColor: account.plateColor }}
        >
          <Image
            src={account.logoSrc}
            alt={account.name}
            fill
            sizes="76px"
            unoptimized
            className="object-contain p-1.5"
          />
        </span>
      ) : (
        <OperatorAccountLogo
          src={account.logoSrc}
          name={account.name}
          size={56}
          plateColor={account.plateColor}
          fullColor={account.logoFullColor}
        />
      )}
    </Link>
  );
}

function SidebarTenantAccount({
  account,
  branchContext,
  showStorefront,
  storefrontOrigin,
  onNavigate,
}: {
  account: AccountBrand;
  branchContext: BranchContext;
  showStorefront: boolean;
  storefrontOrigin: string;
  onNavigate: () => void;
}) {
  const branchLogo = storagePublicObjectUrl(branchContext.active.logoPath);
  const markSrc = branchLogo ?? account.logoSrc;
  const cardClass =
    "mt-3.5 flex w-full items-center gap-2.5 rounded-lg border border-zinc-800 px-2.5 py-2 text-left";
  const storeHref = storefrontPathForBranch(branchContext.active);
  const storeLabel = storefrontUrlLabel(
    storefrontUrlForBranch(storefrontOrigin, branchContext.active),
  );

  return (
    <div className={cardClass}>
      <OperatorAccountLogo
        src={markSrc}
        name={branchContext.active.name}
        size={32}
        plateColor={branchLogo ? "#ffffff" : account.plateColor}
        fullColor={Boolean(branchLogo) || account.logoFullColor}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Sucursal activa
        </span>
        <BranchSwitcher
          active={branchContext.active}
          branches={branchContext.available}
          appearance="sidebar"
          className="mt-0.5 w-full"
        />
        {showStorefront ? (
          <Link
            href={storeHref}
            prefetch
            onClick={() => onNavigate()}
            title={storeLabel}
            className="mt-1 block truncate text-[10px] font-medium text-zinc-400 transition hover:text-white"
          >
            {storeLabel}
          </Link>
        ) : null}
      </span>
      {showStorefront ? (
        <Link
          href={storeHref}
          prefetch
          onClick={() => onNavigate()}
          title={`Ver tienda · ${storeLabel}`}
          className="shrink-0 rounded-md p-1 text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
        >
          <IconExternalStore className="size-4" />
          <span className="sr-only">Ver tienda {storeLabel}</span>
        </Link>
      ) : null}
    </div>
  );
}

function SidebarHeader({
  account,
  branchContext,
  showStorefront,
  storefrontOrigin,
  onNavigate,
}: {
  account: AccountBrand;
  branchContext: BranchContext;
  showStorefront: boolean;
  storefrontOrigin: string;
  onNavigate: () => void;
}) {
  return (
    <div className={`border-b px-3 py-3 ${sidebarBorder}`}>
      <div className="flex flex-col items-center text-center">
        <SidebarProductBrand account={account} />
        <p
          className="mt-2 text-[13px] font-semibold tracking-tight text-white"
        >
          {account.name}
        </p>
        <p
          className={`mt-0.5 whitespace-nowrap text-[10px] font-medium tracking-wide ${sidebarInkMuted}`}
        >
          Gestiona tu tienda de productos
        </p>
      </div>
      <SidebarTenantAccount
        account={account}
        branchContext={branchContext}
        showStorefront={showStorefront}
        storefrontOrigin={storefrontOrigin}
        onNavigate={onNavigate}
      />
    </div>
  );
}

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function SidebarPoweredBy() {
  return (
    <p className="mt-3 flex flex-col items-center gap-1 px-1">
      <span className={`text-[9px] font-medium uppercase tracking-[0.14em] ${sidebarInkMuted}`}>
        Powered by
      </span>
      <Image
        src={adminSidebarLogoPath}
        alt={adminProductBrand}
        width={480}
        height={265}
        className="h-5 w-auto max-w-[7.5rem] object-contain object-center brightness-0 invert"
      />
    </p>
  );
}

function SidebarSupportCard() {
  const href = `${adminSupportWhatsAppUrl}?text=${encodeURIComponent(adminSupportWhatsAppPrefilledText)}`;

  return (
    <div className={`mt-auto shrink-0 border-t px-2.5 py-3 ${sidebarBorder}`}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-left transition hover:border-white/20 hover:bg-white/[0.08]"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm">
          <IconWhatsApp className="size-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-medium text-white">
            ¿Necesitas ayuda?
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-zinc-400">
            WhatsApp · {adminSupportWhatsAppDisplay}
          </span>
        </span>
        <span
          className="shrink-0 text-zinc-500 transition group-hover:text-zinc-300"
          aria-hidden
        >
          →
        </span>
      </a>
      <SidebarPoweredBy />
    </div>
  );
}

function AdminSidebarInner({
  allowedNavHrefs,
  account,
  branchContext,
  storefrontOrigin,
}: {
  allowedNavHrefs: string[];
  account: AccountBrand;
  branchContext: BranchContext;
  storefrontOrigin: string;
}) {
  const pathname = usePathname();
  const allowed = new Set(allowedNavHrefs);
  const navSectionsFiltered = filterAdminNavSections(allowedNavHrefs);

  const linkClass = (active: boolean) =>
    [
      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition",
      active
        ? "bg-[var(--admin-coral)] text-white shadow-sm"
        : "text-zinc-300 hover:bg-white/[0.06] hover:text-white",
    ].join(" ");

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-[50] hidden w-64 shrink-0 flex-col border-r print:hidden lg:flex ${sidebarBorder}`}
      style={sidebarBg}
    >
      <SidebarHeader
        account={account}
        branchContext={branchContext}
        showStorefront={allowed.has(STOREFRONT_HREF)}
        storefrontOrigin={storefrontOrigin}
        onNavigate={() => {}}
      />
      <nav
        id="admin-sidebar-nav"
        className="admin-sidebar-nav-scroll flex-1 space-y-6 overflow-y-auto overscroll-contain px-2.5 py-4"
      >
        {navSectionsFiltered.map((section) => (
          <div key={section.title}>
            <p
              className={`px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${sidebarInkMuted}`}
            >
              {section.title}
            </p>
            <ul className="mt-2 space-y-0.5">
              {section.items.map((item) => {
                const active = adminNavItemActive(pathname, item.href, item);
                const children = item.children ?? [];
                return (
                  <li key={`${section.title}-${item.label}`}>
                    <Link
                      href={item.href}
                      prefetch
                      className={linkClass(
                        children.length > 0
                          ? false
                          : active,
                      )}
                    >
                      {item.icon}
                      <span
                        className={
                          children.length > 0 && active
                            ? "font-semibold text-white"
                            : undefined
                        }
                      >
                        {item.label}
                      </span>
                    </Link>
                    {children.length > 0 ? (
                      <ul className="mt-0.5 space-y-0.5 border-l border-zinc-800 py-0.5 pl-2 ml-[1.15rem]">
                        {children.map((child) => {
                          const childActive = adminNavItemActive(
                            pathname,
                            child.href,
                          );
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                prefetch
                                className={[
                                  "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition",
                                  childActive
                                    ? "bg-[var(--admin-coral)] text-white shadow-sm"
                                    : "text-zinc-400 hover:bg-white/[0.06] hover:text-white",
                                ].join(" ")}
                              >
                                {child.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <SidebarSupportCard />
    </aside>
  );
}

function AdminSidebarFallback({
  account,
}: {
  account: AccountBrand;
}) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-[45] hidden w-64 flex-col border-r print:hidden lg:flex lg:flex-col ${sidebarBorder}`}
      style={sidebarBg}
    >
      <div className={`border-b px-3 py-3 ${sidebarBorder}`}>
        <div className="flex flex-col items-center text-center">
          <SidebarProductBrand account={account} />
          <p
            className="mt-2 text-[13px] font-semibold tracking-tight text-white"
          >
            {account.name}
          </p>
          <p
            className={`mt-0.5 whitespace-nowrap text-[10px] font-medium tracking-wide ${sidebarInkMuted}`}
          >
            Gestiona tu tienda de productos
          </p>
        </div>
        <div className="mt-3.5 flex w-full items-center gap-2.5 rounded-lg border border-zinc-800 px-2.5 py-2">
          <span className="size-8 shrink-0 overflow-hidden rounded-md bg-zinc-800" />
          <span className="min-w-0 flex-1">
            <span className="block h-3 w-20 rounded bg-zinc-800" />
          </span>
        </div>
      </div>
      <div className="flex-1 px-2.5 py-4" aria-busy aria-label="Cargando menú" />
    </aside>
  );
}

export function AdminSidebar({
  allowedNavHrefs,
  account,
  branchContext,
  storefrontOrigin,
}: {
  allowedNavHrefs: string[];
  account: AccountBrand;
  branchContext: BranchContext;
  storefrontOrigin: string;
}) {
  return (
    <Suspense fallback={<AdminSidebarFallback account={account} />}>
      <AdminSidebarInner
        allowedNavHrefs={allowedNavHrefs}
        account={account}
        branchContext={branchContext}
        storefrontOrigin={storefrontOrigin}
      />
    </Suspense>
  );
}
