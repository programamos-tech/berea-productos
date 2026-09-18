"use client";

import { useState } from "react";
import {
  createCashRegisterAction,
  updateCashRegisterAction,
} from "@/app/actions/admin/cash-register";
import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import {
  productInputClass,
  productLabelClass,
} from "@/components/admin/product-form-primitives";
import type { CashRegisterAssignee, CashRegisterRow } from "@/lib/cash-registers";

export function CashRegisterManagePanel({
  registers,
  assignees,
}: {
  registers: CashRegisterRow[];
  assignees: CashRegisterAssignee[];
}) {
  const [creating, setCreating] = useState(false);

  return (
    <section className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Puntos de caja
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Cada punto se asigna a una cajera. Ella abre, opera y cierra el suyo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="inline-flex h-8 items-center rounded-lg border border-zinc-300 px-3 text-xs font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          {creating ? "Cancelar" : "+ Nueva caja"}
        </button>
      </div>

      {creating ? (
        <form
          action={createCashRegisterAction}
          className="mb-4 grid gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <div>
            <label className={productLabelClass} htmlFor="new_cash_register_name">
              Nombre
            </label>
            <input
              id="new_cash_register_name"
              name="name"
              required
              minLength={2}
              maxLength={40}
              defaultValue={`Caja ${registers.length + 1}`}
              className={`${productInputClass} mt-1.5`}
            />
          </div>
          <div>
            <label className={productLabelClass} htmlFor="new_cash_register_user">
              Cajera
            </label>
            <select
              id="new_cash_register_user"
              name="assigned_user_id"
              className={`${productInputClass} mt-1.5`}
              defaultValue=""
            >
              <option value="">Sin asignar</option>
              {assignees.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.label}
                </option>
              ))}
            </select>
          </div>
          <AdminFormSubmitButton
            pendingLabel="Creando…"
            className="h-10 rounded-lg border border-zinc-900 bg-zinc-900 px-4 text-sm font-semibold text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Crear
          </AdminFormSubmitButton>
        </form>
      ) : null}

      <div className="grid gap-2">
        {registers.map((row) => (
          <form
            key={row.id}
            action={updateCashRegisterAction}
            className="grid gap-2 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          >
            <input type="hidden" name="cash_register_id" value={row.id} />
            <div>
              <label className={productLabelClass} htmlFor={`name-${row.id}`}>
                Nombre
              </label>
              <input
                id={`name-${row.id}`}
                name="name"
                required
                minLength={2}
                maxLength={40}
                defaultValue={row.name}
                className={`${productInputClass} mt-1.5`}
              />
            </div>
            <div>
              <label className={productLabelClass} htmlFor={`user-${row.id}`}>
                Cajera
              </label>
              <select
                id={`user-${row.id}`}
                name="assigned_user_id"
                className={`${productInputClass} mt-1.5`}
                defaultValue={row.assigned_user_id ?? ""}
              >
                <option value="">Sin asignar</option>
                {assignees.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.label}
                  </option>
                ))}
              </select>
            </div>
            <AdminFormSubmitButton
              pendingLabel="Guardando…"
              className="h-10 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            >
              Guardar
            </AdminFormSubmitButton>
          </form>
        ))}
      </div>
    </section>
  );
}
