"use client";

import Link from "next/link";
import { useState } from "react";
import { createSupplierDebtAction } from "@/app/actions/admin/suppliers";
import { FirstSupplierModal } from "@/components/admin/FirstSupplierModal";
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
  const [supplierModal, setSupplierModal] = useState(errorCode === "proveedor");
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

      {supplierModal ? (
        <FirstSupplierModal
          returnTo="orden"
          onClose={() => setSupplierModal(false)}
          errorMessage={supplierError}
        />
      ) : null}
    </div>
  );
}
