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
  adminSupportWhatsAppDisplay,
  adminSupportWhatsAppPrefilledText,
  adminSupportWhatsAppUrl,
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
        label: "Gastos",
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
        label: "Inventario",
        icon: (
          <Icon>
            <path d="M21 16V8l-9-5-9 5v8l9 5 9-5z" />
            <path d="M3.3 7 12 12l8.7-5" />
          </Icon>
        ),
      },
      {
        href: "/admin/kits",
        label: "Kits",
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
        label: "Registros",
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

const sidebarInkMuted = "text-zinc-500 dark:text-zinc-500";
const sidebarBorder = "border-zinc-200 dark:border-zinc-800/90";

function SidebarProductBrand() {
  return (
    <Link
      href="/admin"
      prefetch
      className="inline-block rounded-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-zinc-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--admin-sidebar-bg)]"
    >
      <Image
        src={adminSidebarLogoPath}
        alt={adminProductBrand}
        width={1200}
        height={662}
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
    "group mt-3.5 flex w-full items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-left transition dark:border-zinc-700/70 dark:bg-zinc-900/55";

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
        <span className="block truncate text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
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
      className={`${cardClass} hover:border-zinc-300 hover:bg-zinc-50 dark:hover:border-zinc-600 dark:hover:bg-zinc-900/80`}
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
        <p className={`mt-2 whitespace-nowrap text-[10px] font-medium tracking-wide ${sidebarInkMuted}`}>
          Gestiona tu tienda de productos
        </p>
      </div>
      <SidebarTenantAccount
        showStorefront={showStorefront}
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

function SidebarSupportCard() {
  const href = `${adminSupportWhatsAppUrl}?text=${encodeURIComponent(adminSupportWhatsAppPrefilledText)}`;

  return (
    <div className={`mt-auto shrink-0 border-t px-2.5 py-3 ${sidebarBorder}`}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-none dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm">
          <IconWhatsApp className="size-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-medium text-zinc-900 dark:text-white">
            ¿Necesitas ayuda?
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-zinc-500 dark:text-zinc-400">
            WhatsApp · {adminSupportWhatsAppDisplay}
          </span>
        </span>
        <span
          className="shrink-0 text-zinc-400 transition group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
          aria-hidden
        >
          →
        </span>
      </a>
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
        ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-none"
        : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-zinc-100",
    ].join(" ");

  const maintenanceClass =
    "flex cursor-not-allowed items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-zinc-400 opacity-55 grayscale-[0.35] dark:text-zinc-500 dark:opacity-45";

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
                        <span className="shrink-0 rounded-md bg-zinc-200/80 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500">
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
      <SidebarSupportCard />
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
          <p className={`mt-2 whitespace-nowrap text-[10px] font-medium tracking-wide ${sidebarInkMuted}`}>
            Gestiona tu tienda de productos
          </p>
        </div>
        <div className="mt-3.5 flex w-full items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 dark:border-zinc-700/70 dark:bg-zinc-900/55">
          <span className="size-8 shrink-0 rounded-md bg-[#3d3d3f]" />
          <span className="min-w-0 flex-1">
            <span className="block h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
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
