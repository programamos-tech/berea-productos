"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import {
  createSupplierDebtAction,
  createSupplierFromOrderAction,
} from "@/app/actions/admin/suppliers";
import {
  AdminFormSubmitButton,
  adminPrimarySubmitButtonClass,
} from "@/components/admin/AdminFormSubmitButton";
import {
  AdminDateInput,
  ProductMoneyInput,
  productInputClass as inputClass,
  productLabelClass as labelClass,
} from "@/components/admin/product-form-primitives";

export type SupplierDebtOption = { id: string; name: string };

const cardClass =
  "rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700/90 dark:bg-zinc-900 dark:shadow-none sm:p-6";

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

function FirstSupplierModal({
  required,
  onClose,
  errorMessage,
}: {
  required: boolean;
  onClose: () => void;
  errorMessage: string | null;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !required) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, required]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      {required ? (
        <Link href="/admin/proveedores" className="absolute inset-0 bg-zinc-950/45" aria-label="Volver a proveedores" />
      ) : (
        <button
          type="button"
          className="absolute inset-0 bg-zinc-950/45"
          aria-label="Cerrar"
          onClick={onClose}
        />
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-supplier-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900 sm:p-6"
      >
        <h2 id="first-supplier-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {required ? "Todavía no tienes proveedores" : "Nuevo proveedor"}
        </h2>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          {required
            ? "Crea el primero para registrar la orden de compra."
            : "Nombre, NIT, teléfono y dirección. Con eso alcanza para la orden."}
        </p>
        {errorMessage ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/35 dark:text-amber-100">
            {errorMessage}
          </p>
        ) : null}
        <form action={createSupplierFromOrderAction} className="mt-4 space-y-3">
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
            {required ? (
              <Link
                href="/admin/proveedores"
                className="rounded-lg px-3 py-2 text-center text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Ahora no
              </Link>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export function SupplierNewDebtForm({
  suppliers,
  defaultSupplierId,
  defaultDate,
  errorCode,
}: {
  suppliers: SupplierDebtOption[];
  defaultSupplierId: string | null;
  defaultDate: string;
  errorCode?: string | null;
}) {
  const [amountCents, setAmountCents] = useState(0);
  const [issueDate, setIssueDate] = useState(defaultDate);
  const needsFirst = suppliers.length === 0;
  const [supplierModal, setSupplierModal] = useState(needsFirst || errorCode === "proveedor");
  const selected =
    defaultSupplierId && suppliers.some((s) => s.id === defaultSupplierId)
      ? defaultSupplierId
      : (suppliers[0]?.id ?? "");

  const orderError =
    errorCode === "validation"
      ? "Elegí un proveedor y un monto mayor a cero."
      : errorCode === "db"
        ? "No se pudo guardar la orden. Intentá de nuevo."
        : null;
  const supplierError =
    errorCode === "proveedor" ? "No se pudo crear el proveedor. Revisá el nombre e intentá de nuevo." : null;

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-5">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <Link href="/admin/proveedores" className="hover:text-zinc-800 dark:hover:text-zinc-200">
            Proveedores
          </Link>
          <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">/</span>
          <span className="text-zinc-700 dark:text-zinc-300">Nueva orden de compra</span>
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
          Nueva orden de compra
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          Registrá el total de la orden. Después podés ir abonando hasta saldarla.
        </p>
      </div>

      {orderError ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/35 dark:text-amber-100">
          {orderError}
        </p>
      ) : null}

      {needsFirst ? null : (
        <form action={createSupplierDebtAction} className={`${cardClass} space-y-4`}>
          <div>
            <label htmlFor="supplier_id" className={labelClass}>
              Proveedor
            </label>
            <select
              id="supplier_id"
              name="supplier_id"
              required
              defaultValue={selected}
              className={inputClass}
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-zinc-500">
              ¿No está?{" "}
              <button
                type="button"
                onClick={() => setSupplierModal(true)}
                className="font-medium text-zinc-800 underline dark:text-zinc-200"
              >
                Crear proveedor
              </button>
            </p>
          </div>
          <div>
            <label className={labelClass}>Total de la orden (COP)</label>
            <ProductMoneyInput
              name="amount_cents"
              value={amountCents}
              required
              onChange={setAmountCents}
            />
          </div>
          <div>
            <label htmlFor="issue_date" className={labelClass}>
              Fecha
            </label>
            <AdminDateInput
              id="issue_date"
              name="issue_date"
              value={issueDate}
              onChange={setIssueDate}
              required
            />
          </div>
          <div>
            <label htmlFor="notes" className={labelClass}>
              Nota (opcional)
            </label>
            <input
              id="notes"
              name="notes"
              type="text"
              className={inputClass}
              placeholder="Número de factura del proveedor, pedido…"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <AdminFormSubmitButton className={`${adminPrimarySubmitButtonClass} px-4 py-2.5`}>
              Guardar orden
            </AdminFormSubmitButton>
            <Link
              href="/admin/proveedores"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
            >
              Cancelar
            </Link>
          </div>
        </form>
      )}

      {supplierModal ? (
        <FirstSupplierModal
          required={needsFirst}
          onClose={() => setSupplierModal(false)}
          errorMessage={supplierError}
        />
      ) : null}
    </div>
  );
}
