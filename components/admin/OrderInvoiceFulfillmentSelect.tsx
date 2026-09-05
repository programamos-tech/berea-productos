"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { updateAdminOrderFulfillment } from "@/app/actions/admin/order-fulfillment";
import {
  ADMIN_FULFILLMENT_OPTIONS,
  isOrderFulfillmentStatus,
  type OrderFulfillmentStatus,
} from "@/lib/order-fulfillment";

function selectClassForFulfillment(status: OrderFulfillmentStatus): string {
  const base =
    "w-full min-w-[150px] rounded-lg border bg-white px-2.5 py-1.5 text-xs font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:bg-zinc-950 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-900";
  switch (status) {
    case "awaiting_payment":
      return `${base} border-amber-300 text-amber-800 dark:border-amber-700/70 dark:text-amber-200`;
    case "preparing":
      return `${base} border-sky-300 text-sky-800 dark:border-sky-700/70 dark:text-sky-200`;
    case "shipped":
      return `${base} border-violet-300 text-violet-800 dark:border-violet-700/70 dark:text-violet-200`;
    case "completed":
      return `${base} border-emerald-300 text-emerald-800 dark:border-emerald-700/70 dark:text-emerald-200`;
    default:
      return `${base} border-zinc-300 text-zinc-700 dark:border-zinc-600 dark:text-zinc-200`;
  }
}

export function OrderInvoiceFulfillmentSelect({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const resolved: OrderFulfillmentStatus =
    currentStatus && isOrderFulfillmentStatus(currentStatus)
      ? currentStatus
      : "preparing";
  const [value, setValue] = useState(resolved);

  useEffect(() => {
    setValue(resolved);
  }, [resolved]);

  return (
    <select
      aria-label="Estado del envío"
      disabled={pending}
      value={value}
      onChange={(e) => {
        const v = e.target.value;
        if (!isOrderFulfillmentStatus(v)) return;
        setValue(v);
        startTransition(async () => {
          const res = await updateAdminOrderFulfillment(orderId, v);
          if (!res.ok) {
            setValue(resolved);
            return;
          }
          router.refresh();
        });
      }}
      className={`${selectClassForFulfillment(value)} disabled:opacity-60`}
    >
      {ADMIN_FULFILLMENT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
