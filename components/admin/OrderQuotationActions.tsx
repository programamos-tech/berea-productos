"use client";

import { useState } from "react";
import { convertQuotationToSaleAction } from "@/app/actions/admin/quotation";
import { productInputClass as inputClass } from "@/components/admin/product-form-primitives";
import { adminButtonCancelClass } from "@/lib/admin-ui";

/** Acciones de cotización: facturar y descargar hoja membretada. */
export function OrderQuotationActions({
  orderId,
  invoiceRef,
  totalCents,
}: {
  orderId: string;
  invoiceRef: string;
  /** Reservado para reactivar envío por correo. */
  customerEmail?: string | null;
  totalCents: number;
}) {
  const [facturarOpen, setFacturarOpen] = useState(false);
  const [payment, setPayment] = useState<"cash" | "transfer" | "mixed">("cash");
  const [mixedCash, setMixedCash] = useState("");
  const [mixedTransfer, setMixedTransfer] = useState("");

  function downloadQuotation() {
    document.title = `Cotización ${invoiceRef} · Aleya Shop SAS`;
    window.print();
  }

  return (
    <div className="space-y-2 print:hidden">
      <button
        type="button"
        onClick={() => setFacturarOpen(true)}
        className="inline-flex w-full items-center justify-center rounded-lg border border-rose-950 bg-rose-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-rose-900 hover:bg-rose-900 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
      >
        Facturar cotización
      </button>
      <button
        type="button"
        onClick={downloadQuotation}
        className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        Descargar cotización
      </button>

      {facturarOpen ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-zinc-950/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Facturar cotización #{invoiceRef}
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              Se descuenta stock y queda como venta pagada. Total{" "}
              <span className="font-semibold tabular-nums">
                {new Intl.NumberFormat("es-CO", {
                  style: "currency",
                  currency: "COP",
                  maximumFractionDigits: 0,
                }).format(totalCents)}
              </span>
              .
            </p>
            <form action={convertQuotationToSaleAction} className="mt-4 space-y-3">
              <input type="hidden" name="order_id" value={orderId} />
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Método de pago
                </label>
                <select
                  name="payment_method"
                  value={payment}
                  onChange={(e) =>
                    setPayment(e.target.value as "cash" | "transfer" | "mixed")
                  }
                  className={inputClass}
                >
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                  <option value="mixed">Mixto</option>
                </select>
              </div>
              {payment === "mixed" ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                      Efectivo
                    </label>
                    <input
                      name="mixed_cash_cents"
                      type="number"
                      min={0}
                      required
                      value={mixedCash}
                      onChange={(e) => setMixedCash(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                      Transferencia
                    </label>
                    <input
                      name="mixed_transfer_cents"
                      type="number"
                      min={0}
                      required
                      value={mixedTransfer}
                      onChange={(e) => setMixedTransfer(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <input type="hidden" name="mixed_cash_cents" value="0" />
                  <input type="hidden" name="mixed_transfer_cents" value="0" />
                </>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 rounded-lg border border-rose-950 bg-rose-950 py-2.5 text-sm font-semibold text-white hover:bg-rose-900 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                >
                  Confirmar factura
                </button>
                <button
                  type="button"
                  onClick={() => setFacturarOpen(false)}
                  className={adminButtonCancelClass}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
