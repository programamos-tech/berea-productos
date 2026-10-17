"use client";

import { useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { createSupplierFromOrderAction } from "@/app/actions/admin/suppliers";
import {
  productInputClass as inputClass,
  productLabelClass as labelClass,
} from "@/components/admin/product-form-primitives";

function ModalSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--admin-coral)] bg-[var(--admin-coral)] py-2.5 text-sm font-semibold text-white transition hover:border-[var(--admin-coral-hover)] hover:bg-[var(--admin-coral-hover)] disabled:pointer-events-none disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 shrink-0 animate-spin" strokeWidth={2.25} aria-hidden />
          Creando…
        </>
      ) : (
        "Crear proveedor"
      )}
    </button>
  );
}

export function FirstSupplierModal({
  onClose,
  errorMessage,
  dismissLabel = "Cancelar",
  returnTo = "orden",
}: {
  onClose: () => void;
  errorMessage: string | null;
  dismissLabel?: string;
  returnTo?: "lista" | "orden";
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/45"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-supplier-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900 sm:p-6"
      >
        <h2 id="first-supplier-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Todavía no tienes proveedores
        </h2>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          Crea el primero para registrar la orden de compra.
        </p>
        {errorMessage ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/35 dark:text-amber-100">
            {errorMessage}
          </p>
        ) : null}
        <form action={createSupplierFromOrderAction} className="mt-4 space-y-3">
          <input type="hidden" name="return_to" value={returnTo} />
          <div>
            <label htmlFor="supplier-name" className={labelClass}>
              Nombre
            </label>
            <input
              id="supplier-name"
              name="name"
              required
              autoFocus
              autoComplete="organization"
              placeholder="Ej. Distribuidora American"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="supplier-nit" className={labelClass}>
              NIT
            </label>
            <input
              id="supplier-nit"
              name="document_id"
              placeholder="Ej. 900123456-7"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="supplier-phone" className={labelClass}>
              Teléfono
            </label>
            <input
              id="supplier-phone"
              name="phone"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Ej. 300 000 0000"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="supplier-address" className={labelClass}>
              Dirección
            </label>
            <input
              id="supplier-address"
              name="address"
              autoComplete="street-address"
              placeholder="Ej. Calle 20 # 15-30"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-2 pt-1">
            <ModalSubmitButton />
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {dismissLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
