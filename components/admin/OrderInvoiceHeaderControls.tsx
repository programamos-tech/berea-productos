"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { updateAdminOrderStatus } from "@/app/actions/admin/order-status";
import { AdminPortalRoot } from "@/components/admin/AdminPortalRoot";
import { productInputClass as inputClass } from "@/components/admin/product-form-primitives";
import { adminButtonCancelClass } from "@/lib/admin-ui";
import { ORDER_CANCELLATION_REASON_MIN_LENGTH } from "@/lib/orders-constants";

const INVOICE_OPTIONS: { value: string; label: string }[] = [
  { value: "paid", label: "Finalizada" },
  { value: "quotation", label: "Cotización" },
  { value: "pending", label: "Pendiente" },
  { value: "cancelled", label: "Anulada" },
  { value: "failed", label: "Fallida" },
];

function selectClassForStatus(status: string): string {
  const base =
    "w-full min-w-[150px] rounded-lg border bg-white px-2.5 py-1.5 text-xs font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:bg-zinc-950 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-900";
  switch (status) {
    case "paid":
      return `${base} border-emerald-300 text-emerald-700 dark:border-emerald-700/70 dark:text-emerald-400`;
    case "quotation":
      return `${base} border-violet-300 text-violet-700 dark:border-violet-700/70 dark:text-violet-300`;
    case "pending":
      return `${base} border-amber-300 text-amber-700 dark:border-amber-700/70 dark:text-amber-300`;
    case "cancelled":
      return `${base} border-red-300 text-red-600 dark:border-red-800/70 dark:text-red-400`;
    case "failed":
      return `${base} border-zinc-300 text-zinc-500 dark:border-zinc-600 dark:text-zinc-400`;
    default:
      return `${base} border-zinc-300 text-zinc-800 dark:border-zinc-600 dark:text-zinc-100`;
  }
}

function IconPrinter({ className }: { className?: string }) {
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
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 9V3h12v6" />
      <path d="M18 14v8H6v-8Z" />
    </svg>
  );
}

export function OrderInvoicePrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 print:hidden"
    >
      <IconPrinter className="size-3.5 text-zinc-500 dark:text-zinc-400" />
      Imprimir
    </button>
  );
}

function CancelInvoiceModal({
  open,
  orderId,
  invoiceRef,
  onClose,
  onSucceeded,
}: {
  open: boolean;
  orderId: string;
  invoiceRef: string;
  onClose: () => void;
  onSucceeded: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setReason("");
      setLocalError(null);
      setPending(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending, onClose]);

  if (!open || !mounted) return null;

  const minLen = ORDER_CANCELLATION_REASON_MIN_LENGTH;

  return createPortal(
    <AdminPortalRoot>
      <>
        {/* Backdrop solo sobre el contenido (navbar + sidebar quedan nítidos). */}
        <button
          type="button"
          className="fixed inset-x-0 bottom-0 top-14 z-[100] bg-zinc-950/40 backdrop-blur-sm dark:bg-black/50 sm:top-16 lg:left-64"
          aria-label="Cerrar"
          onClick={pending ? undefined : onClose}
        />
        {/* Centrado en el workspace (derecha del sidebar en desktop). */}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 top-14 z-[101] flex items-center justify-center p-4 sm:top-16 sm:p-6 lg:left-64">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-invoice-title"
            className="pointer-events-auto relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_24px_64px_-24px_rgba(0,0,0,0.6)]"
          >
            <h2
              id="cancel-invoice-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
            >
              Anular factura #{invoiceRef}
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Cuéntanos el motivo de la anulación. Este dato queda registrado
              para auditoría.
            </p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Motivo
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setLocalError(null);
              }}
              rows={4}
              placeholder="Ej.: cliente pidió devolución, error en el cobro, duplicado…"
              disabled={pending}
              className={`${inputClass} mt-2 min-h-[100px] resize-y`}
            />
            {localError ? (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {localError}
              </p>
            ) : null}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={pending}
                onClick={onClose}
                className={adminButtonCancelClass}
              >
                Volver
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={async () => {
                  const t = reason.trim();
                  if (t.length < minLen) {
                    setLocalError(
                      `Escribe al menos ${minLen} caracteres explicando el motivo.`,
                    );
                    return;
                  }
                  setPending(true);
                  setLocalError(null);
                  const res = await updateAdminOrderStatus(
                    orderId,
                    "cancelled",
                    t,
                  );
                  setPending(false);
                  if (!res.ok) {
                    if (res.error === "reason_required") {
                      setLocalError(
                        `El motivo debe tener al menos ${minLen} caracteres.`,
                      );
                    } else if (res.error === "auth") {
                      setLocalError(
                        "Sesión expirada. Vuelve a iniciar sesión.",
                      );
                    } else if (res.error === "forbidden") {
                      setLocalError(
                        "No tenés permiso para cambiar el estado de la factura.",
                      );
                    } else if (res.error === "stock_restore") {
                      setLocalError(
                        "No se pudo devolver el inventario. Aplica la migración 20260620120000_order_cancel_stock_restore en Supabase e intenta de nuevo.",
                      );
                    } else {
                      setLocalError("No se pudo guardar. Intenta de nuevo.");
                    }
                    return;
                  }
                  onSucceeded();
                }}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
              >
                {pending ? "Guardando…" : "Confirmar anulación"}
              </button>
            </div>
          </div>
        </div>
      </>
    </AdminPortalRoot>,
    document.body,
  );
}

export function OrderInvoiceStatusSelect({
  orderId,
  invoiceRef,
  currentStatus,
}: {
  orderId: string;
  invoiceRef: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(currentStatus);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  useEffect(() => {
    setValue(currentStatus);
  }, [currentStatus]);

  const options =
    currentStatus === "quotation"
      ? INVOICE_OPTIONS.filter(
          (o) => o.value === "quotation" || o.value === "cancelled",
        )
      : INVOICE_OPTIONS.filter((o) => o.value !== "quotation");

  return (
    <>
      <select
        aria-label="Estado de la factura"
        disabled={pending}
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "cancelled" && currentStatus !== "cancelled") {
            setCancelModalOpen(true);
            return;
          }
          setValue(v);
          startTransition(async () => {
            const res = await updateAdminOrderStatus(orderId, v);
            if (!res.ok) {
              setValue(currentStatus);
              return;
            }
            router.refresh();
          });
        }}
        className={`${selectClassForStatus(value)} disabled:opacity-60`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <CancelInvoiceModal
        open={cancelModalOpen}
        orderId={orderId}
        invoiceRef={invoiceRef}
        onClose={() => setCancelModalOpen(false)}
        onSucceeded={() => {
          setValue("cancelled");
          setCancelModalOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
