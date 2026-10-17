"use client";

import Link from "next/link";
import { useState } from "react";
import { createSupplierDebtAction } from "@/app/actions/admin/suppliers";
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
  const selected =
    defaultSupplierId && suppliers.some((s) => s.id === defaultSupplierId)
      ? defaultSupplierId
      : (suppliers[0]?.id ?? "");

  const errorMessage =
    errorCode === "validation"
      ? "Elegí un proveedor y un monto mayor a cero."
      : errorCode === "db"
        ? "No se pudo guardar la deuda. Intentá de nuevo."
        : null;

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-5">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <Link href="/admin/proveedores" className="hover:text-zinc-800 dark:hover:text-zinc-200">
            Proveedores
          </Link>
          <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">/</span>
          <span className="text-zinc-700 dark:text-zinc-300">Nueva deuda</span>
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
          Nueva deuda
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          Registrá cuánto le debés al proveedor. Después podés ir abonando hasta saldarla.
        </p>
      </div>

      {errorMessage ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/35 dark:text-amber-100">
          {errorMessage}
        </p>
      ) : null}

      {suppliers.length === 0 ? (
        <div className={cardClass}>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Todavía no hay proveedores. Creá uno y volvé a registrar la deuda.
          </p>
          <Link
            href="/admin/proveedores/nuevo"
            className="mt-4 inline-flex items-center justify-center rounded-lg border border-[var(--admin-coral)] bg-[var(--admin-coral)] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Nuevo proveedor
          </Link>
        </div>
      ) : (
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
              <Link href="/admin/proveedores/nuevo" className="font-medium text-zinc-800 underline dark:text-zinc-200">
                Crear proveedor
              </Link>
            </p>
          </div>
          <div>
            <label className={labelClass}>Monto que debés (COP)</label>
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
              placeholder="Pedido, factura del proveedor…"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <AdminFormSubmitButton className={`${adminPrimarySubmitButtonClass} px-4 py-2.5`}>
              Guardar deuda
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
    </div>
  );
}
