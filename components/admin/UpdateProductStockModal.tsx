"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { adjustProductStock } from "@/app/actions/admin/products";
import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import { AdminPortalRoot } from "@/components/admin/AdminPortalRoot";
import { ProductQuantityInput } from "@/components/admin/product-form-primitives";
import { formatQuantityInputGrouping } from "@/lib/money";

type MovementMode = "replace" | "add";

type Props = {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  referenceLabel: string;
  stockLocal: number;
  returnTo: string;
};

function fmtQty(n: number) {
  return n <= 0 ? "0" : formatQuantityInputGrouping(n);
}

function newSubmissionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export function UpdateProductStockModal({
  open,
  onClose,
  productId,
  productName,
  referenceLabel,
  stockLocal,
  returnTo,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [movementMode, setMovementMode] = useState<MovementMode>("add");
  const [quantity, setQuantity] = useState(0);
  const [submissionId, setSubmissionId] = useState(newSubmissionId);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setMovementMode("add");
    setQuantity(0);
    setSubmissionId(newSubmissionId());
  }, [open, productId]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const stockAfter = useMemo(() => {
    if (movementMode === "replace") return Math.max(0, quantity);
    return stockLocal + Math.max(0, quantity);
  }, [movementMode, quantity, stockLocal]);

  const hasQty = quantity > 0;
  const canConfirm = movementMode === "replace" || hasQty;

  const modeHelp =
    movementMode === "add"
      ? "Vas a agregar unidades al stock que hay hoy en el punto."
      : "Vas a dejar el stock del punto exactamente en el número que escribas.";

  const qtyLabel =
    movementMode === "add"
      ? "¿Cuántas unidades llegaron?"
      : "¿En cuánto queda el stock del punto?";

  const submitLabel = !canConfirm
    ? "Escribe una cantidad"
    : movementMode === "add"
      ? `Sumar ${fmtQty(quantity)} → queda ${fmtQty(stockAfter)}`
      : `Dejar el stock en ${fmtQty(quantity)}`;

  if (!open || !mounted) return null;

  const boundAction = adjustProductStock.bind(null, productId);

  return createPortal(
    <AdminPortalRoot>
      <>
        <button
          type="button"
          className="fixed inset-x-0 bottom-0 top-14 z-[100] bg-zinc-950/40 backdrop-blur-sm dark:bg-black/50 sm:top-16 lg:left-64"
          aria-label="Cerrar"
          onClick={onClose}
        />
        <div className="pointer-events-none fixed inset-x-0 bottom-0 top-14 z-[101] flex items-center justify-center p-4 sm:top-16 sm:p-6 lg:left-64">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="update-stock-title"
            className="pointer-events-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900 sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2
                  id="update-stock-title"
                  className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
                >
                  Actualizar stock del punto
                </h2>
                <p className="mt-1 truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {productName}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-zinc-500">
                  Ref. {referenceLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                aria-label="Cerrar"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Stock actual bien visible */}
            <div className="mt-4 flex items-baseline justify-between gap-3 rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-950/60">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Stock actual en el punto
                </p>
                <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
                  {fmtQty(stockLocal)}
                </p>
              </div>
              <p className="text-xs text-zinc-500">unidades</p>
            </div>

            <form action={boundAction} className="mt-5 space-y-4">
              <input type="hidden" name="location" value="local" />
              <input type="hidden" name="movement_mode" value={movementMode} />
              <input type="hidden" name="return_to" value={returnTo} />
              <input type="hidden" name="submission_id" value={submissionId} />

              <fieldset>
                <legend className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  ¿Qué querés hacer?
                </legend>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementMode("add")}
                    aria-pressed={movementMode === "add"}
                    className={`rounded-xl border px-3 py-2.5 text-left transition ${
                      movementMode === "add"
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                        : "border-zinc-200 text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <span className="block text-sm font-semibold">Sumar</span>
                    <span
                      className={`mt-0.5 block text-[11px] leading-snug ${
                        movementMode === "add"
                          ? "opacity-80"
                          : "text-zinc-500"
                      }`}
                    >
                      Llegó mercancía
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementMode("replace")}
                    aria-pressed={movementMode === "replace"}
                    className={`rounded-xl border px-3 py-2.5 text-left transition ${
                      movementMode === "replace"
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                        : "border-zinc-200 text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <span className="block text-sm font-semibold">Fijar</span>
                    <span
                      className={`mt-0.5 block text-[11px] leading-snug ${
                        movementMode === "replace"
                          ? "opacity-80"
                          : "text-zinc-500"
                      }`}
                    >
                      Después de contar
                    </span>
                  </button>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                  {modeHelp}
                </p>
              </fieldset>

              <div>
                <label
                  htmlFor="modal-stock-qty"
                  className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  {qtyLabel}
                </label>
                <div className="max-w-[11rem]">
                  <ProductQuantityInput
                    id="modal-stock-qty"
                    name="quantity"
                    value={quantity}
                    onChange={setQuantity}
                  />
                </div>
              </div>

              {/* Resultado claro */}
              <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-3 dark:border-zinc-700">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Así quedará el punto
                </p>
                <div className="mt-2 flex flex-wrap items-end gap-3">
                  <div>
                    <p className="text-[11px] text-zinc-500">Ahora</p>
                    <p className="text-lg font-semibold tabular-nums text-zinc-400 line-through">
                      {fmtQty(stockLocal)}
                    </p>
                  </div>
                  <span className="pb-1 text-zinc-300 dark:text-zinc-600" aria-hidden>
                    →
                  </span>
                  <div>
                    <p className="text-[11px] text-zinc-500">Después</p>
                    <p className="text-2xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
                      {canConfirm ? fmtQty(stockAfter) : "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  Cancelar
                </button>
                <AdminFormSubmitButton
                  pendingLabel="Guardando…"
                  disabled={!canConfirm}
                  className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400"
                >
                  {submitLabel}
                </AdminFormSubmitButton>
              </div>
            </form>
          </div>
        </div>
      </>
    </AdminPortalRoot>,
    document.body,
  );
}
