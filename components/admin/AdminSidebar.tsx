"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Suspense, type SVGProps } from "react";
import {
  ADMIN_BRAND_LOGO_ON_SIDEBAR_CLASS,
  ADMIN_SIDEBAR_PRODUCT_LOGO_CLASS,
} from "@/lib/admin-theme";
import {
  adminProductBrand,
  adminSidebarLogoPath,
  adminTenantBrand,
  adminTenantLogoPath,
} from "@/lib/brand";
import {
  ADMIN_NAV_UNAVAILABLE_BADGE,
  ADMIN_NAV_UNAVAILABLE_HINT,
  isAdminNavHrefInMaintenance,
} from "@/lib/admin-nav-maintenance";

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

const navSections: {
  title: string;
  items: { href: string; label: string; icon: React.ReactNode }[];
}[] = [
  {
    title: "Comercial",
    items: [
      {
        href: "/admin",
        label: "Reportes",
        icon: (
          <Icon>
            <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z" />
          </Icon>
        ),
      },
      {
        href: "/admin/caja",
        label: "Caja",
        icon: (
          <Icon>
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <circle cx="12" cy="12" r="3" />
            <path d="M6 12h.01M18 12h.01" />
          </Icon>
        ),
      },
      {
        href: "/admin/ventas",
        label: "Ventas",
        icon: (
          <Icon>
            <path d="M6 3h12v18l-2-1-2 1-2-1-2 1-2-1-2 1V3Z" />
            <path d="M9 8h6M9 12h6M9 16h4" />
          </Icon>
        ),
      },
      {
        href: "/admin/egresos",
        label: "Gastos y egresos",
        icon: (
          <Icon>
            <path d="M4 6h16v12H4z" />
            <path d="M8 10h8" />
            <path d="M8 14h5" />
          </Icon>
        ),
      },
      {
        href: "/admin/products",
        label: "Productos",
        icon: (
          <Icon>
            <path d="M21 16V8l-9-5-9 5v8l9 5 9-5z" />
            <path d="M3.3 7 12 12l8.7-5" />
          </Icon>
        ),
      },
      {
        href: "/admin/kits",
        label: "Kits y combos",
        icon: (
          <Icon>
            <path d="M16.5 9.4 12 12 7.5 9.4" />
            <path d="M21 16V8l-9-5-9 5v8l9 5 9-5z" />
            <path d="M12 12v9" />
          </Icon>
        ),
      },
      {
        href: "/admin/customers",
        label: "Clientes",
        icon: (
          <Icon>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </Icon>
        ),
      },
    ],
  },
  {
    title: "Configuración",
    items: [
      {
        href: "/admin/cuenta",
        label: "Mi cuenta",
        icon: (
          <Icon>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20v-1a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v1" />
          </Icon>
        ),
      },
      {
        href: "/admin/usuarios",
        label: "Equipo",
        icon: (
          <Icon>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </Icon>
        ),
      },
      {
        href: "/admin/actividades",
        label: "Actividades",
        icon: (
          <Icon>
            <path d="M4 11h16" />
            <path d="M4 7h10" />
            <path d="M4 15h8" />
            <path d="M18 15h2" />
            <path d="M18 11h2" />
            <circle cx="18" cy="7" r="2" />
          </Icon>
        ),
      },
      {
        href: "/admin/banners",
        label: "Banners",
        icon: (
          <Icon>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 15h18" />
            <path d="m9 10 2 2 4-4" />
          </Icon>
        ),
      },
      {
        href: "/admin/coupons",
        label: "Cupones",
        icon: (
          <Icon>
            <path d="M20 12V8H4v4" />
            <path d="M12 8v11" />
            <path d="M8 19h8" />
            <path d="M8 5h8v3H8z" />
          </Icon>
        ),
      },
      {
        href: "/admin/envios",
        label: "Envíos",
        icon: (
          <Icon>
            <path d="M3 7h11v10H3z" />
            <path d="M14 10h4l3 3v4h-7V10z" />
            <circle cx="7" cy="18" r="2" />
            <circle cx="17" cy="18" r="2" />
          </Icon>
        ),
      },
      {
        href: "/admin/settings",
        label: "Ajustes",
        icon: (
          <Icon>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </Icon>
        ),
      },
    ],
  },
  {
    title: "Berea",
    items: [
      {
        href: "/admin/tenants/nuevo",
        label: "Nueva tienda",
        icon: (
          <Icon>
            <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5Z" />
            <path d="M12 12v4" />
            <path d="M10 14h4" />
          </Icon>
        ),
      },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/") return false;
  const pathOnly = href.split("?")[0] ?? href;
  return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
}

const PRODUCTS_HREF = "/admin/products";
const KITS_HREF = "/admin/kits";
const VENTAS_HREF = "/admin/ventas";
/** Pedidos / facturas abren bajo esta ruta; debe seguir resaltando Ventas en el sidebar. */
const ORDERS_HREF = "/admin/orders";
const CUSTOMERS_HREF = "/admin/customers";
const COUPONS_HREF = "/admin/coupons";
const USUARIOS_HREF = "/admin/usuarios";
const CUENTA_HREF = "/admin/cuenta";

function navItemActive(
  pathname: string,
  href: string,
): boolean {
  if (href === CUENTA_HREF) {
    return pathname === CUENTA_HREF || pathname.startsWith(`${CUENTA_HREF}/`);
  }
  if (href === USUARIOS_HREF) {
    return pathname === USUARIOS_HREF || pathname.startsWith(`${USUARIOS_HREF}/`);
  }
  if (href === VENTAS_HREF) {
    return (
      pathname === VENTAS_HREF ||
      pathname.startsWith(`${VENTAS_HREF}/`) ||
      pathname === ORDERS_HREF ||
      pathname.startsWith(`${ORDERS_HREF}/`)
    );
  }
  if (href === PRODUCTS_HREF) {
    return pathname === PRODUCTS_HREF || pathname.startsWith(`${PRODUCTS_HREF}/`);
  }
  if (href === KITS_HREF) {
    return pathname === KITS_HREF || pathname.startsWith(`${KITS_HREF}/`);
  }
  if (href === CUSTOMERS_HREF) {
    return pathname === CUSTOMERS_HREF || pathname.startsWith(`${CUSTOMERS_HREF}/`);
  }
  if (href === COUPONS_HREF) {
    return pathname === COUPONS_HREF || pathname.startsWith(`${COUPONS_HREF}/`);
  }
  return isActive(pathname, href);
}

const sidebarInkMuted =
  "text-[var(--admin-coral-deep)]/55 dark:text-zinc-500";
const sidebarBorder =
  "border-[color-mix(in_srgb,var(--admin-coral-deep)_14%,transparent)] dark:border-zinc-800/90";

function SidebarProductBrand() {
  return (
    <Link
      href="/admin"
      prefetch
      className="inline-block rounded-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--admin-coral)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--admin-sidebar-bg)]"
    >
      <Image
        src={adminSidebarLogoPath}
        alt={adminProductBrand}
        width={728}
        height={343}
        className={`${ADMIN_SIDEBAR_PRODUCT_LOGO_CLASS} ${ADMIN_BRAND_LOGO_ON_SIDEBAR_CLASS}`}
        priority
      />
    </Link>
  );
}

function SidebarTenantAccount({
  showStorefront,
  onNavigate,
}: {
  showStorefront: boolean;
  onNavigate: () => void;
}) {
  const href = showStorefront ? STOREFRONT_HREF : CUENTA_HREF;
  const cuentaBlocked =
    !showStorefront && isAdminNavHrefInMaintenance(CUENTA_HREF);
  const title = showStorefront
    ? `Ver tienda · ${adminTenantBrand}`
    : cuentaBlocked
      ? `${adminTenantBrand} · ${ADMIN_NAV_UNAVAILABLE_HINT}`
      : `Cuenta · ${adminTenantBrand}`;

  const cardClass =
    "group mt-3.5 flex w-full items-center gap-2.5 rounded-lg border border-[color-mix(in_srgb,var(--admin-coral-deep)_16%,transparent)] bg-white/55 px-2.5 py-2 text-left transition dark:border-zinc-700/70 dark:bg-zinc-900/55";

  const inner = (
    <>
      <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#3d3d3f]">
        <Image
          src={adminTenantLogoPath}
          alt=""
          width={64}
          height={64}
          className="size-full object-contain p-0.5"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-[var(--admin-coral-deep)]/90 dark:text-zinc-200">
          {adminTenantBrand}
        </span>
      </span>
      {showStorefront ? (
        <span className={`shrink-0 opacity-70 ${sidebarInkMuted}`} aria-hidden>
          <IconExternalStore className="size-4" />
        </span>
      ) : null}
    </>
  );

  if (cuentaBlocked) {
    return (
      <div
        className={`${cardClass} cursor-not-allowed opacity-55`}
        title={title}
        aria-disabled="true"
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={href}
      prefetch
      onClick={() => onNavigate()}
      title={title}
      className={`${cardClass} hover:border-[color-mix(in_srgb,var(--admin-coral)_35%,transparent)] hover:bg-white/80 dark:hover:border-zinc-600 dark:hover:bg-zinc-900/80`}
    >
      {inner}
    </Link>
  );
}

function SidebarHeader({
  showStorefront,
  onNavigate,
}: {
  showStorefront: boolean;
  onNavigate: () => void;
}) {
  return (
    <div className={`border-b px-3 py-3 ${sidebarBorder}`}>
      <div className="flex flex-col items-center text-center">
        <SidebarProductBrand />
      </div>
      <SidebarTenantAccount
        showStorefront={showStorefront}
        onNavigate={onNavigate}
      />
    </div>
  );
}

function AdminSidebarInner({
  allowedNavHrefs,
  mobileOpen,
  onNavigate,
}: {
  allowedNavHrefs: string[];
  mobileOpen: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const allowed = new Set(allowedNavHrefs);

  const navSectionsFiltered = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => allowed.has(item.href)),
    }))
    .filter((section) => section.items.length > 0);

  const linkClass = (active: boolean) =>
    [
      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition",
      active
        ? "bg-[var(--admin-coral)] text-white shadow-sm shadow-[color-mix(in_srgb,var(--admin-coral-deep)_18%,transparent)] dark:shadow-none"
        : "text-[var(--admin-coral-deep)]/85 hover:bg-white/70 hover:text-[var(--admin-coral-deep)] dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-zinc-100",
    ].join(" ");

  const maintenanceClass =
    "flex cursor-not-allowed items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-[var(--admin-coral-deep)]/40 opacity-55 grayscale-[0.35] dark:text-zinc-500 dark:opacity-45";

  const drawerTranslate =
    mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0";

  /** Drawer cerrado en móvil: sin foco ni clics; en lg siempre interactuable. */
  const drawerHiddenMobile =
    !mobileOpen
      ? "max-lg:invisible max-lg:pointer-events-none lg:!visible lg:!pointer-events-auto"
      : "";

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-[50] flex w-[min(88vw,288px)] max-w-[288px] shrink-0 flex-col border-r bg-[var(--admin-sidebar-bg)] transition-transform duration-300 ease-out motion-reduce:transition-none print:hidden lg:w-64 lg:max-w-none ${sidebarBorder} ${drawerTranslate} ${drawerHiddenMobile}`}
    >
      <SidebarHeader
        showStorefront={allowed.has(STOREFRONT_HREF)}
        onNavigate={onNavigate}
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
                const active = navItemActive(pathname, item.href);
                const maintenance = isAdminNavHrefInMaintenance(item.href);
                if (maintenance) {
                  return (
                    <li key={`${section.title}-${item.label}`}>
                      <span
                        className={maintenanceClass}
                        title={ADMIN_NAV_UNAVAILABLE_HINT}
                        aria-disabled="true"
                      >
                        <span className="opacity-70" aria-hidden>
                          {item.icon}
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {item.label}
                        </span>
                        <span className="shrink-0 rounded-md bg-[var(--admin-coral-deep)]/8 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--admin-coral-deep)]/55 dark:bg-zinc-800 dark:text-zinc-500">
                          {ADMIN_NAV_UNAVAILABLE_BADGE}
                        </span>
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={`${section.title}-${item.label}`}>
                    <Link
                      href={item.href}
                      prefetch
                      className={linkClass(active)}
                      onClick={() => onNavigate()}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

function AdminSidebarFallback() {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-[45] hidden w-64 flex-col border-r bg-[var(--admin-sidebar-bg)] print:hidden lg:flex lg:flex-col ${sidebarBorder}`}
    >
      <div className={`border-b px-3 py-3 ${sidebarBorder}`}>
        <div className="flex flex-col items-center text-center">
          <SidebarProductBrand />
        </div>
        <div className="mt-3.5 flex w-full items-center gap-2.5 rounded-lg border border-[color-mix(in_srgb,var(--admin-coral-deep)_16%,transparent)] bg-white/55 px-2.5 py-2 dark:border-zinc-700/70 dark:bg-zinc-900/55">
          <span className="size-8 shrink-0 rounded-md bg-[#3d3d3f]" />
          <span className="min-w-0 flex-1">
            <span className="block h-3 w-20 rounded bg-[var(--admin-coral-deep)]/15 dark:bg-zinc-700" />
          </span>
        </div>
      </div>
      <div className="flex-1 px-2.5 py-4" aria-busy aria-label="Cargando menú" />
    </aside>
  );
}

export function AdminSidebar({
  allowedNavHrefs,
  mobileOpen,
  onNavigate,
}: {
  allowedNavHrefs: string[];
  mobileOpen: boolean;
  onNavigate: () => void;
}) {
  return (
    <Suspense fallback={<AdminSidebarFallback />}>
      <AdminSidebarInner
        allowedNavHrefs={allowedNavHrefs}
        mobileOpen={mobileOpen}
        onNavigate={onNavigate}
      />
    </Suspense>
  );
}
