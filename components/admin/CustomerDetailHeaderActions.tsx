"use client";

import Link from "next/link";
import { CustomerDeleteConfirmForm } from "@/components/admin/CustomerDeleteConfirmForm";

const btnIdle =
  "inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800";
const btnPrimary =
  "inline-flex items-center justify-center rounded-lg border border-[var(--admin-coral)] bg-[var(--admin-coral)] px-2.5 py-1.5 text-xs font-medium text-white transition hover:border-[var(--admin-coral-hover)] hover:bg-[var(--admin-coral-hover)]";
const btnIcon =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800";

type Props = {
  customerId: string;
  customerName: string;
};

export function CustomerDetailHeaderActions({
  customerId,
  customerName,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Link
        href={`/admin/customers/${customerId}/edit`}
        className={btnPrimary}
      >
        Editar
      </Link>
      <CustomerDeleteConfirmForm
        customerId={customerId}
        customerName={customerName}
        variant="header"
        className="inline-flex shrink-0"
      />
      <Link
        href="/admin/customers"
        className={btnIcon}
        title="Volver"
        aria-label="Volver al listado de clientes"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="size-4"
          aria-hidden
        >
          <path
            d="m15 18-6-6 6-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    </div>
  );
}
