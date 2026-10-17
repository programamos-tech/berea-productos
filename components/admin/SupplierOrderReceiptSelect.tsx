"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { updateSupplierReceiptStatusAction } from "@/app/actions/admin/suppliers";
import {
  SUPPLIER_RECEIPT_STATUSES,
  isSupplierReceiptStatus,
  supplierReceiptLabel,
  type SupplierReceiptStatus,
} from "@/lib/supplier-invoices";

function selectClass(status: SupplierReceiptStatus): string {
  const base =
    "w-full min-w-[150px] rounded-lg border bg-white px-2.5 py-1.5 text-xs font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:bg-zinc-950 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-900";
  switch (status) {
    case "sent":
      return `${base} border-violet-300 text-violet-800 dark:border-violet-700/70 dark:text-violet-200`;
    case "receiving":
      return `${base} border-sky-300 text-sky-800 dark:border-sky-700/70 dark:text-sky-200`;
    case "received":
      return `${base} border-emerald-300 text-emerald-800 dark:border-emerald-700/70 dark:text-emerald-200`;
  }
}

export function SupplierOrderReceiptSelect({
  invoiceId,
  supplierId,
  currentStatus,
  disabled = false,
}: {
  invoiceId: string;
  supplierId: string;
  currentStatus: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const resolved: SupplierReceiptStatus = isSupplierReceiptStatus(currentStatus)
    ? currentStatus
    : "sent";
  const [value, setValue] = useState(resolved);

  useEffect(() => {
    setValue(resolved);
  }, [resolved]);

  return (
    <select
      aria-label="Estado de recepción"
      disabled={disabled || pending}
      value={value}
      onChange={(e) => {
        const next = e.target.value;
        if (!isSupplierReceiptStatus(next)) return;
        setValue(next);
        startTransition(async () => {
          const res = await updateSupplierReceiptStatusAction(invoiceId, supplierId, next);
          if (!res.ok) {
            setValue(resolved);
            return;
          }
          router.refresh();
        });
      }}
      className={`${selectClass(value)} disabled:opacity-60`}
    >
      {SUPPLIER_RECEIPT_STATUSES.map((status) => (
        <option key={status} value={status}>
          {supplierReceiptLabel(status)}
        </option>
      ))}
    </select>
  );
}
