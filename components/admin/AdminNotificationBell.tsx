"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useAdminOrderNotifications } from "@/components/admin/AdminOrderNotificationsProvider";
import { formatCop } from "@/lib/money";
import { webOrderPaymentLabel } from "@/lib/admin-web-order-notifications";
import { formatStoreDateTime } from "@/lib/store-datetime-format";
import { ventaNumeroReferencia } from "@/lib/ventas-sales";

const STOCK_VISIBLE = 8;

function IconBell({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 7H3s3 0 3-7" />
      <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
    </svg>
  );
}

function stockLabel(quantity: number): string {
  if (quantity <= 0) return "Se agotó";
  if (quantity === 1) return "Queda 1";
  return `Quedan ${quantity}`;
}

export function AdminNotificationBell({ className }: { className?: string }) {
  const {
    ordersEnabled,
    stockEnabled,
    notifications,
    lowStock,
    unreadCount,
    panelOpen,
    setPanelOpen,
    markRead,
    markAllRead,
  } = useAdminOrderNotifications();
  const panelRef = useRef<HTMLDivElement>(null);
  const visibleStock = lowStock.slice(0, STOCK_VISIBLE);
  const hiddenStock = Math.max(0, lowStock.length - visibleStock.length);

  useEffect(() => {
    if (!panelOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      setPanelOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [panelOpen, setPanelOpen]);

  const ordersEmpty = !ordersEnabled || notifications.length === 0;
  const stockEmpty = !stockEnabled || lowStock.length === 0;
  const empty = ordersEmpty && stockEmpty;
  const emptyLabel =
    ordersEnabled && stockEnabled
      ? "No hay pedidos nuevos ni productos con stock bajo."
      : stockEnabled
        ? "No hay productos con stock bajo."
        : "No hay pedidos nuevos.";

  return (
    <div ref={panelRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setPanelOpen(!panelOpen)}
        className="relative flex size-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 sm:size-10 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        title="Avisos"
        aria-label={
          unreadCount > 0 ? `Avisos, ${unreadCount} sin leer` : "Avisos"
        }
        aria-expanded={panelOpen}
        aria-haspopup="true"
      >
        <IconBell className="size-5" />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex min-w-[1.1rem] items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {panelOpen ? (
        <div className="absolute right-0 top-full z-[80] mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Avisos
            </p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
              >
                Marcar leídas
              </button>
            ) : null}
          </div>
          {empty ? (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">
              {emptyLabel}
            </p>
          ) : (
            <div className="max-h-[min(28rem,70vh)] overflow-y-auto">
              {ordersEnabled ? (
                <section>
                  <p className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                    Pedidos nuevos
                  </p>
                  {notifications.length === 0 ? (
                    <p className="px-4 pb-3 text-sm text-zinc-500">
                      No hay pedidos web pendientes.
                    </p>
                  ) : (
                    <ul>
                      {notifications.map((n) => (
                        <li key={n.id}>
                          <Link
                            href={`/admin/orders/${n.id}`}
                            prefetch={false}
                            onClick={() => {
                              markRead(n.id, "order");
                              setPanelOpen(false);
                            }}
                            className={[
                              "block border-b border-zinc-100 px-4 py-3 transition last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60",
                              n.read
                                ? "opacity-70"
                                : "bg-emerald-50/40 dark:bg-emerald-950/20",
                            ].join(" ")}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                #{ventaNumeroReferencia(n.id)} · {n.customerName}
                              </p>
                              {!n.read ? (
                                <span className="mt-1 size-2 shrink-0 rounded-full bg-emerald-500" />
                              ) : null}
                            </div>
                            <p className="mt-0.5 text-xs text-zinc-500">
                              {webOrderPaymentLabel(n.checkoutPaymentMethod)} ·{" "}
                              {formatCop(n.totalCents)}
                            </p>
                            <p className="mt-1 text-[11px] text-zinc-400">
                              {formatStoreDateTime(n.createdAt, {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ) : null}

              {stockEnabled ? (
                <section>
                  <p className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                    Stock bajo
                  </p>
                  {lowStock.length === 0 ? (
                    <p className="px-4 pb-3 text-sm text-zinc-500">
                      Ningún producto de esta sucursal está por agotarse.
                    </p>
                  ) : (
                    <ul>
                      {visibleStock.map((n) => (
                        <li key={n.id}>
                          <Link
                            href={`/admin/products/${n.id}`}
                            prefetch={false}
                            onClick={() => {
                              markRead(n.id, "stock");
                              setPanelOpen(false);
                            }}
                            className={[
                              "block border-b border-zinc-100 px-4 py-3 transition last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60",
                              n.read
                                ? "opacity-70"
                                : n.quantity <= 0
                                  ? "bg-red-50/50 dark:bg-red-950/20"
                                  : "bg-amber-50/60 dark:bg-amber-950/20",
                            ].join(" ")}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                {n.name}
                              </p>
                              {!n.read ? (
                                <span
                                  className={`mt-1 size-2 shrink-0 rounded-full ${
                                    n.quantity <= 0 ? "bg-red-500" : "bg-amber-500"
                                  }`}
                                />
                              ) : null}
                            </div>
                            <p className="mt-0.5 text-xs text-zinc-500">
                              {n.reference ? `${n.reference} · ` : ""}
                              {stockLabel(n.quantity)}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  {hiddenStock > 0 ? (
                    <Link
                      href="/admin/products?status=low"
                      prefetch={false}
                      onClick={() => setPanelOpen(false)}
                      className="block px-4 py-3 text-center text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                      Ver el inventario
                    </Link>
                  ) : null}
                </section>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
