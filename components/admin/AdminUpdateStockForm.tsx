"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import {
  ProductQuantityInput,
  productInputClass,
} from "@/components/admin/product-form-primitives";
import { formatQuantityInputGrouping } from "@/lib/money";

type MovementMode = "replace" | "add";
type StockLoc = "local" | "warehouse";

type Props = {
  productName: string;
  referenceLabel: string;
  stockLocal: number;
  stockWarehouse: number;
  formAction: (formData: FormData) => void;
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

const stepLabel =
  "text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500";

export function AdminUpdateStockForm({
  productName,
  referenceLabel,
  stockLocal,
  stockWarehouse,
  formAction,
  returnTo,
}: Props) {
  const [movementMode, setMovementMode] = useState<MovementMode>("add");
  const [location, setLocation] = useState<StockLoc>("local");
  const [quantity, setQuantity] = useState(0);
  const [submissionId] = useState(newSubmissionId);

  const currentForLoc = location === "local" ? stockLocal : stockWarehouse;

  const stockAfter = useMemo(() => {
    if (movementMode === "replace") return Math.max(0, quantity);
    return currentForLoc + Math.max(0, quantity);
  }, [movementMode, quantity, currentForLoc]);

  const canConfirm =
    movementMode === "replace" ? quantity >= 0 : quantity > 0;

  const delta =
    movementMode === "replace"
      ? stockAfter - currentForLoc
      : Math.max(0, quantity);

  const deltaLabel =
    delta === 0
      ? "Sin cambio"
      : delta > 0
        ? `+${fmtQty(delta)}`
        : fmtQty(delta);

  return (
    <form action={formAction} className="mx-auto w-full max-w-2xl">
      <input type="hidden" name="movement_mode" value={movementMode} />
      <input type="hidden" name="location" value={location} />
      <input type="hidden" name="return_to" value={returnTo} />
      <input type="hidden" name="submission_id" value={submissionId} />

      {/* Producto */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-200/80 pb-4 dark:border-zinc-800">
        <div className="min-w-0">
          <p className={stepLabel}>Producto</p>
          <p className="mt-1 truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {productName}
          </p>
          <p className="mt-0.5 font-mono text-xs text-zinc-500">
            Ref. {referenceLabel}
          </p>
        </div>
        <Link
          href="/admin/products"
          className="text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline dark:hover:text-zinc-200"
        >
          Cambiar producto
        </Link>
      </div>

      {/* 1. Dónde */}
      <section className="pt-6">
        <p className={stepLabel}>1 · ¿Dónde ajustás?</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(
            [
              { id: "local" as const, title: "Local", stock: stockLocal },
              {
                id: "warehouse" as const,
                title: "Bodega",
                stock: stockWarehouse,
              },
            ] as const
          ).map((opt) => {
            const selected = location === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setLocation(opt.id)}
                aria-pressed={selected}
                className={`rounded-xl border px-4 py-4 text-left transition ${
                  selected
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                    : "border-zinc-200 bg-transparent text-zinc-800 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-500"
                }`}
              >
                <span className="block text-xs font-medium opacity-70">
                  {opt.title}
                </span>
                <span className="mt-1 block text-2xl font-semibold tabular-nums tracking-tight">
                  {fmtQty(opt.stock)}
                </span>
                <span
                  className={`mt-0.5 block text-[11px] ${
                    selected ? "opacity-70" : "text-zinc-500"
                  }`}
                >
                  unidades ahora
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Qué hacer */}
      <section className="pt-7">
        <p className={stepLabel}>2 · ¿Qué querés hacer?</p>
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={() => setMovementMode("add")}
            aria-pressed={movementMode === "add"}
            className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
              movementMode === "add"
                ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900/60"
                : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
            }`}
          >
            <span
              className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${
                movementMode === "add"
                  ? "border-zinc-900 bg-zinc-900 dark:border-zinc-100 dark:bg-zinc-100"
                  : "border-zinc-300 dark:border-zinc-600"
              }`}
              aria-hidden
            >
              {movementMode === "add" ? (
                <span className="size-1.5 rounded-full bg-white dark:bg-zinc-950" />
              ) : null}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Sumar unidades
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">
                Ideal cuando te llegó mercancía o una compra. Se agrega al stock
                actual de {location === "local" ? "local" : "bodega"}.
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMovementMode("replace")}
            aria-pressed={movementMode === "replace"}
            className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
              movementMode === "replace"
                ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900/60"
                : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
            }`}
          >
            <span
              className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${
                movementMode === "replace"
                  ? "border-zinc-900 bg-zinc-900 dark:border-zinc-100 dark:bg-zinc-100"
                  : "border-zinc-300 dark:border-zinc-600"
              }`}
              aria-hidden
            >
              {movementMode === "replace" ? (
                <span className="size-1.5 rounded-full bg-white dark:bg-zinc-950" />
              ) : null}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Dejar el stock en…
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">
                Ideal después de un conteo. El número que pongas será el stock
                final en {location === "local" ? "local" : "bodega"}.
              </span>
            </span>
          </button>
        </div>
      </section>

      {/* 3. Cantidad */}
      <section className="pt-7">
        <p className={stepLabel}>
          3 ·{" "}
          {movementMode === "add"
            ? "¿Cuántas unidades sumás?"
            : "¿En cuánto queda el stock?"}
        </p>
        <div className="mt-3 max-w-[12rem]">
          <ProductQuantityInput
            id="stock-qty"
            name="quantity"
            value={quantity}
            onChange={setQuantity}
          />
        </div>
        <label htmlFor="stock-reason" className="mt-5 block">
          <span className={stepLabel}>Nota (opcional)</span>
          <textarea
            id="stock-reason"
            name="reason"
            rows={2}
            placeholder={
              movementMode === "add"
                ? "Ej. Compra del 5 de sept"
                : "Ej. Conteo físico de la mañana"
            }
            className={`${productInputClass} mt-2 resize-none`}
          />
        </label>
      </section>

      {/* Resultado + guardar */}
      <section className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50/80 px-5 py-5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <p className={stepLabel}>Resultado</p>
        <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
          <div>
            <p className="text-xs text-zinc-500">
              {location === "local" ? "Local" : "Bodega"} ahora
            </p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums text-zinc-500 line-through decoration-zinc-300 dark:decoration-zinc-600">
              {fmtQty(currentForLoc)}
            </p>
          </div>
          <span className="pb-1 text-zinc-400" aria-hidden>
            →
          </span>
          <div>
            <p className="text-xs text-zinc-500">Quedará</p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
              {canConfirm ? fmtQty(stockAfter) : "—"}
            </p>
          </div>
          {canConfirm && delta !== 0 ? (
            <p
              className={`pb-1 text-sm font-medium tabular-nums ${
                delta > 0
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-amber-700 dark:text-amber-300"
              }`}
            >
              {deltaLabel}
            </p>
          ) : null}
        </div>

        <AdminFormSubmitButton
          pendingLabel="Guardando…"
          disabled={!canConfirm}
          className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400"
        >
          {movementMode === "add"
            ? quantity > 0
              ? `Sumar ${fmtQty(quantity)} a ${location === "local" ? "local" : "bodega"}`
              : "Ingresá una cantidad"
            : `Guardar stock en ${fmtQty(quantity)}`}
        </AdminFormSubmitButton>
      </section>
    </form>
  );
}
