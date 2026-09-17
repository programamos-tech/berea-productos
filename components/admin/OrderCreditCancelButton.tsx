"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cancelOrderCreditPayment } from "@/app/actions/admin/order-credit";
import { AdminPortalRoot } from "@/components/admin/AdminPortalRoot";
import { productInputClass as inputClass } from "@/components/admin/product-form-primitives";
import { CREDIT_PAYMENT_CANCELLATION_REASON_MIN_LENGTH } from "@/lib/order-credit";
import { adminButtonCancelClass } from "@/lib/admin-ui";
import { formatCop } from "@/lib/money";

function CancelCreditPaymentModal({
  open,
  paymentId,
  amountLabel,
  onClose,
  onSucceeded,
}: {
  open: boolean;
  paymentId: string;
  amountLabel: string;
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

  const minLen = CREDIT_PAYMENT_CANCELLATION_REASON_MIN_LENGTH;

  return createPortal(
    <AdminPortalRoot>
      <>
        <button
          type="button"
          className="fixed inset-x-0 bottom-0 top-14 z-[100] bg-zinc-950/40 backdrop-blur-sm dark:bg-black/50 sm:top-16 lg:left-64"
          aria-label="Cerrar"
          onClick={pending ? undefined : onClose}
        />
        <div className="pointer-events-none fixed inset-x-0 bottom-0 top-14 z-[101] flex items-center justify-center p-4 sm:top-16 sm:p-6 lg:left-64">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-credit-payment-title"
            className="pointer-events-auto relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
          >
            <h2
              id="cancel-credit-payment-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
            >
              Anular abono
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {amountLabel}
              </span>
              {" — "}
              deja de contar en el saldo, en la caja del día en que se cobró y
              en los reportes (cómo va la tienda y por periodo). El registro
              queda con el motivo.
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
              placeholder="Ej.: monto incorrecto, cobro duplicado, no se recibió el dinero…"
              disabled={pending}
              className={`${inputClass} mt-2 min-h-[100px] resize-y`}
            />
            {localError ? (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {localError}
              </p>
            ) : null}
            <div className="mt-6 flex flex-row items-center justify-end gap-2">
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
                      `Escribí al menos ${minLen} caracteres explicando el motivo.`,
                    );
                    return;
                  }
                  setPending(true);
                  setLocalError(null);
                  const res = await cancelOrderCreditPayment(paymentId, t);
                  setPending(false);
                  if (!res.ok) {
                    if (res.error === "reason_required") {
                      setLocalError(
                        `El motivo debe tener al menos ${minLen} caracteres.`,
                      );
                    } else if (res.error === "already_cancelled") {
                      setLocalError("Este abono ya está anulado.");
                    } else if (res.error === "auth") {
                      setLocalError("Sesión expirada. Volvé a iniciar sesión.");
                    } else if (res.error === "forbidden") {
                      setLocalError("No tenés permiso para anular abonos.");
                    } else {
                      setLocalError("No se pudo guardar. Intentá de nuevo.");
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

export function OrderCreditCancelButton({
  paymentId,
  amountCents,
  canCancel,
}: {
  paymentId: string;
  amountCents: number;
  canCancel: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!canCancel) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-red-700 underline-offset-2 hover:underline dark:text-red-400"
      >
        Anular
      </button>
      <CancelCreditPaymentModal
        open={open}
        paymentId={paymentId}
        amountLabel={formatCop(amountCents)}
        onClose={() => setOpen(false)}
        onSucceeded={() => {
          setOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
