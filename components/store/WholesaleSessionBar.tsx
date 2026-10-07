"use client";

import { useState } from "react";
import type { StorefrontWholesaleOrder } from "@/lib/storefront-wholesale-orders";

type Props = {
  customerName: string;
  branchName: string;
  wholesalePct: number;
  orderCount: number;
  orders: StorefrontWholesaleOrder[];
  leaveAction: () => Promise<void>;
};

export function WholesaleSessionBar({
  customerName,
  branchName,
  wholesalePct,
  orderCount,
  orders,
  leaveAction,
}: Props) {
  const [open, setOpen] = useState(false);
  const meta = [
    branchName,
    wholesalePct > 0 ? `${wholesalePct}%` : null,
    orderCount === 1 ? "1 pedido" : `${orderCount} pedidos`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="bg-[var(--store-accent)] text-[var(--store-on-accent)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em]">
            {customerName}
          </p>
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--store-on-accent)_72%,transparent)]">
            {meta}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="rounded-full border border-[color-mix(in_srgb,var(--store-on-accent)_35%,transparent)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--store-on-accent)] hover:bg-[color-mix(in_srgb,var(--store-on-accent)_8%,transparent)]"
          >
            Mis pedidos
          </button>
          <form action={leaveAction}>
            <button type="submit" className="text-[11px] font-medium uppercase tracking-[0.12em] underline underline-offset-2">
              Salir
            </button>
          </form>
        </div>
      </div>
      {open ? (
        <div className="border-t border-[color-mix(in_srgb,var(--store-on-accent)_16%,transparent)]">
          <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--store-on-accent)_62%,transparent)]">
              Últimos pedidos mayoristas
            </p>
            {orders.length === 0 ? (
              <p className="mt-2 text-sm text-[color-mix(in_srgb,var(--store-on-accent)_80%,transparent)]">Todavía no tienes pedidos.</p>
            ) : (
              <ul className="mt-2 divide-y divide-[color-mix(in_srgb,var(--store-on-accent)_16%,transparent)]">
                {orders.map((order) => (
                  <li key={order.id} className="flex items-baseline justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm">{order.whenLabel}</p>
                      <p className="text-[11px] uppercase tracking-[0.08em] text-[color-mix(in_srgb,var(--store-on-accent)_62%,transparent)]">
                        {[order.statusLabel, order.payLabel].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums">{order.totalLabel}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
