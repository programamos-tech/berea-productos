"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminAuthVisibilityKeepAlive } from "@/components/admin/AdminAuthVisibilityKeepAlive";
import { AdminMobileBottomNav } from "@/components/admin/AdminMobileBottomNav";
import { AdminOrderNotificationsProvider } from "@/components/admin/AdminOrderNotificationsProvider";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { CashRegisterMorningGateModal } from "@/components/admin/CashRegisterMorningGateModal";
import { pathAllowedDuringCashGate } from "@/lib/cash-register-gate";
import { isAdminPathInMaintenance } from "@/lib/admin-nav-maintenance";
import {
  clearStoreCheckoutNavigation,
  removeStoreCheckoutBootOverlay,
} from "@/lib/store-checkout-nav";

export function AdminDashboardShell({
  children,
  allowedNavHrefs,
  notifyNewWebOrders = false,
  cashGate = null,
  sessionUser,
}: {
  children: React.ReactNode;
  /** Hrefs del menú lateral permitidos para esta sesión (incluye `/admin/cuenta` y `/`). */
  allowedNavHrefs: string[];
  notifyNewWebOrders?: boolean;
  cashGate?: {
    mustOpen: boolean;
    businessDayLabel: string;
    displayName: string | null;
    suggestedOpeningFloatCents?: number;
  } | null;
  /** Usuario autenticado para el menú superior (nombre + email). */
  sessionUser: {
    displayName: string;
    email: string;
  };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const mustOpen = Boolean(cashGate?.mustOpen);

  // Overlay de checkout de la tienda no debe tapar el admin (iPad / Safari).
  useEffect(() => {
    clearStoreCheckoutNavigation();
    removeStoreCheckoutBootOverlay();
  }, []);

  useEffect(() => {
    if (!mustOpen) return;
    if (pathAllowedDuringCashGate(pathname)) return;
    router.replace("/admin/caja");
  }, [mustOpen, pathname, router]);

  useEffect(() => {
    if (!isAdminPathInMaintenance(pathname)) return;
    router.replace("/admin");
  }, [pathname, router]);

  return (
    <AdminOrderNotificationsProvider enabled={notifyNewWebOrders && !mustOpen}>
      <AdminAuthVisibilityKeepAlive />
      <div className="isolate flex min-h-screen items-stretch antialiased">
        <AdminSidebar allowedNavHrefs={allowedNavHrefs} />

        <div className="relative z-10 flex min-h-screen min-w-0 flex-1 flex-col overflow-x-visible overflow-y-visible bg-white dark:bg-zinc-950 lg:ml-64 print:ml-0 print:bg-white">
          <AdminTopBar
            showOrderNotifications={notifyNewWebOrders && !mustOpen}
            displayName={sessionUser.displayName}
            email={sessionUser.email}
          />
          <main className="relative z-0 min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-visible p-3 pb-[calc(4.75rem+env(safe-area-inset-bottom))] sm:p-4 md:p-6 lg:pb-6 print:bg-white print:p-8 print:pb-8">
            {children}
          </main>
        </div>

        <AdminMobileBottomNav allowedNavHrefs={allowedNavHrefs} />

        {mustOpen && cashGate ? (
          <CashRegisterMorningGateModal
            businessDayLabel={cashGate.businessDayLabel}
            displayName={cashGate.displayName}
            suggestedOpeningFloatCents={cashGate.suggestedOpeningFloatCents ?? 0}
          />
        ) : null}
      </div>
    </AdminOrderNotificationsProvider>
  );
}
