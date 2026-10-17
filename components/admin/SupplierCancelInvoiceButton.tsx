"use client";

import { cancelSupplierInvoiceAction } from "@/app/actions/admin/suppliers";

export function SupplierCancelInvoiceButton({
  supplierId,
  invoiceId,
  disabled,
}: {
  supplierId: string;
  invoiceId: string;
  disabled?: boolean;
}) {
  return (
    <form
      action={cancelSupplierInvoiceAction}
      onSubmit={(e) => {
        if (!confirm("¿Anular esta orden? No se podrán registrar nuevos abonos.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="supplier_id" value={supplierId} />
      <input type="hidden" name="invoice_id" value={invoiceId} />
      <button
        type="submit"
        disabled={disabled}
        className="w-full rounded-lg border border-red-300 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800/70 dark:bg-zinc-950 dark:text-red-400 dark:hover:bg-red-950/40"
      >
        Anular orden
      </button>
    </form>
  );
}
