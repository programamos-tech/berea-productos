"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";
import { cancelSupplierInvoicePaymentAction } from "@/app/actions/admin/suppliers";
import { AdminPortalRoot } from "@/components/admin/AdminPortalRoot";
import { SupplierAbonoForm } from "@/components/admin/SupplierAbonoForm";
import { productInputClass as inputClass } from "@/components/admin/product-form-primitives";
import { adminButtonCancelClass } from "@/lib/admin-ui";
import { formatCop } from "@/lib/money";
import {
  orderCreditPendingToneClass,
  orderCreditUiStatus,
  orderCreditUiStatusBadge,
} from "@/lib/order-credit";
import { formatStoreDateTime } from "@/lib/store-datetime-format";

type AbonoRow = {
  id: string;
  amountCents: number;
  methodLabel: string;
  paidAt: string | null;
  notes?: string | null;
  isCancelled: boolean;
  cancellationReason: string | null;
};

const REASON_MIN = 8;

const iconBtnClass =
  "inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

function CancelAbonoModal({
  open,
  paymentId,
  invoiceId,
  supplierId,
  amountLabel,
  onClose,
  onSucceeded,
}: {
  open: boolean;
  paymentId: string;
  invoiceId: string;
  supplierId: string;
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
    if (!open) return;
    setReason("");
    setLocalError(null);
    setPending(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, pending, onClose]);

  if (!open || !mounted) return null;

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
            aria-labelledby="cancel-supplier-abono-title"
            className="pointer-events-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
          >
            <h2 id="cancel-supplier-abono-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Anular abono
            </h2>
            <p className="mt-1.5 text-sm text-zinc-500">
              Se anula el abono de {amountLabel}. El saldo pendiente vuelve a subir.
            </p>
            <label className="mt-4 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Motivo
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className={`${inputClass} mt-1.5`}
              placeholder="Por qué se anula este abono"
            />
            {localError ? (
              <p className="mt-2 text-sm text-red-700 dark:text-red-300" role="alert">
                {localError}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={onClose} disabled={pending} className={adminButtonCancelClass}>
                Cancelar
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={async () => {
                  const t = reason.trim();
                  if (t.length < REASON_MIN) {
                    setLocalError(`Escribí al menos ${REASON_MIN} caracteres.`);
                    return;
                  }
                  setPending(true);
                  setLocalError(null);
                  const res = await cancelSupplierInvoicePaymentAction({
                    paymentId,
                    invoiceId,
                    supplierId,
                    reason: t,
                  });
                  setPending(false);
                  if (!res.ok) {
                    setLocalError(
                      res.error === "already_cancelled"
                        ? "Este abono ya está anulado."
                        : "No se pudo anular el abono.",
                    );
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

export function SupplierOrderAbonosPanel({
  invoiceId,
  supplierId,
  totalCents,
  cancelled,
  payments,
  readOnly = false,
}: {
  invoiceId: string;
  supplierId: string;
  totalCents: number;
  cancelled: boolean;
  payments: AbonoRow[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const activePaid = payments.reduce(
    (sum, pay) => (pay.isCancelled ? sum : sum + pay.amountCents),
    0,
  );
  const pendingCents = cancelled ? 0 : Math.max(0, totalCents - activePaid);
  const uiStatus = orderCreditUiStatus({
    orderStatus: cancelled ? "cancelled" : "pending",
    pendingCents,
  });
  const badge = orderCreditUiStatusBadge(uiStatus);
  const labelClass = "text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";
  const cancelling = payments.find((pay) => pay.id === cancelId) ?? null;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={labelClass}>Saldo</p>
          <p className="mt-1">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
              {badge.label}
            </span>
          </p>
        </div>
        {!cancelled && !readOnly ? (
          <SupplierAbonoForm
            invoiceId={invoiceId}
            supplierId={supplierId}
            pendingCents={pendingCents}
          />
        ) : readOnly && !cancelled && pendingCents > 0 ? (
          <span className="inline-flex cursor-default items-center justify-center rounded-lg border border-[var(--admin-coral)] bg-[var(--admin-coral)] px-4 py-2.5 text-sm font-semibold text-white opacity-80 shadow-sm">
            Registrar abono
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <div>
          <p className={labelClass}>Total</p>
          <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-xl">
            {formatCop(totalCents)}
          </p>
        </div>
        <div>
          <p className={labelClass}>Pagado</p>
          <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-zinc-800 dark:text-zinc-200 sm:text-xl">
            {formatCop(activePaid)}
          </p>
        </div>
        <div>
          <p className={labelClass}>Pendiente</p>
          <p className={`mt-1 text-xl tabular-nums tracking-tight sm:text-2xl ${orderCreditPendingToneClass(uiStatus)}`}>
            {formatCop(pendingCents)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className={labelClass}>Abonos</p>
        {payments.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">Todavía no hay abonos.</p>
        ) : (
          <ul className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
            {payments.map((pay) => (
              <li key={pay.id} className="flex items-start justify-between gap-2 py-2 text-sm">
                <div className="min-w-0">
                  <p
                    className={`font-medium tabular-nums ${
                      pay.isCancelled
                        ? "text-zinc-400 line-through dark:text-zinc-500"
                        : "text-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    {formatCop(pay.amountCents)}
                    {pay.isCancelled ? (
                      <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-red-700 no-underline dark:text-red-400">
                        Anulado
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {pay.methodLabel}
                    {pay.paidAt
                      ? ` · ${formatStoreDateTime(pay.paidAt, {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}`
                      : ""}
                  </p>
                  {pay.notes ? <p className="mt-0.5 text-xs text-zinc-500">{pay.notes}</p> : null}
                  {pay.isCancelled && pay.cancellationReason ? (
                    <p className="mt-0.5 text-xs text-red-700 dark:text-red-400">
                      Motivo: {pay.cancellationReason}
                    </p>
                  ) : null}
                </div>
                {!readOnly && !pay.isCancelled && !cancelled ? (
                  <button
                    type="button"
                    onClick={() => setCancelId(pay.id)}
                    className={iconBtnClass}
                    title="Anular abono"
                    aria-label="Anular abono"
                  >
                    <Trash2 className="size-4" strokeWidth={2} aria-hidden />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <CancelAbonoModal
        open={cancelling != null}
        paymentId={cancelling?.id ?? ""}
        invoiceId={invoiceId}
        supplierId={supplierId}
        amountLabel={cancelling ? formatCop(cancelling.amountCents) : ""}
        onClose={() => setCancelId(null)}
        onSucceeded={() => {
          setCancelId(null);
          router.refresh();
        }}
      />
    </section>
  );
}
