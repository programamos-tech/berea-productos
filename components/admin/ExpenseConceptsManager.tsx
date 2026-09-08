"use client";

import { useMemo, useState } from "react";
import { CircleSlash2, Pencil, Power, Trash2 } from "lucide-react";
import {
  createExpenseConcept,
  deleteExpenseConcept,
  toggleExpenseConceptActive,
  updateExpenseConcept,
} from "@/app/actions/admin/expense-concepts";
import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import type { StoreExpenseConceptRow } from "@/lib/store-expense-concepts";
import {
  adminButtonCancelClass,
  adminToolbarBtnActiveClass,
  adminToolbarBtnBaseClass,
} from "@/lib/admin-ui";
import type { ExpensePaymentMethod } from "@/lib/expense-concepts";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
const labelClass =
  "mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";

const iconBtnClass =
  "inline-flex size-8 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";
const iconDangerBtnClass =
  "inline-flex size-8 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300";

const payOptions: { value: ExpensePaymentMethod; label: string }[] = [
  { value: "transferencia", label: "Transferencia" },
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "efectivo_acumulado", label: "Efectivo acumulado" },
  { value: "otro", label: "Otro" },
];

function kindsLabel(row: StoreExpenseConceptRow): string {
  const parts: string[] = [];
  if (row.applies_to_gasto) parts.push("Gasto");
  if (row.applies_to_egreso) parts.push("Egreso");
  return parts.join(" · ") || "—";
}

function ConceptFormFields({
  row,
}: {
  row?: StoreExpenseConceptRow | null;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor="concept_name">
          Nombre
        </label>
        <input
          id="concept_name"
          name="name"
          required
          minLength={2}
          maxLength={120}
          defaultValue={row?.name ?? ""}
          className={inputClass}
          placeholder="Ej. Arriendo bodega"
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="concept_category">
          Categoría
        </label>
        <input
          id="concept_category"
          name="category"
          defaultValue={row?.category ?? "operativo"}
          className={inputClass}
          placeholder="operativo"
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="concept_payment">
          Medio por defecto
        </label>
        <select
          id="concept_payment"
          name="default_payment_method"
          defaultValue={row?.default_payment_method ?? "transferencia"}
          className={inputClass}
        >
          {payOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="concept_sort">
          Orden
        </label>
        <input
          id="concept_sort"
          name="sort_order"
          type="number"
          defaultValue={row?.sort_order ?? 100}
          className={inputClass}
        />
      </div>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <label className="inline-flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-100">
          <input
            type="checkbox"
            name="applies_to_gasto"
            value="1"
            defaultChecked={row ? row.applies_to_gasto : true}
            className="size-4 rounded border-zinc-300 text-[var(--admin-coral)]"
          />
          Usar como gasto
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-100">
          <input
            type="checkbox"
            name="applies_to_egreso"
            value="1"
            defaultChecked={row ? row.applies_to_egreso : false}
            className="size-4 rounded border-zinc-300 text-[var(--admin-coral)]"
          />
          Usar como egreso
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-100">
          <input
            type="checkbox"
            name="allows_custom_text"
            defaultChecked={row?.allows_custom_text ?? false}
            disabled={
              row?.special_key === "other_gasto" ||
              row?.special_key === "other_egreso"
            }
            className="size-4 rounded border-zinc-300 text-[var(--admin-coral)]"
          />
          Permite texto libre (tipo “Otro”)
        </label>
      </div>
      {row ? (
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="concept_active">
            Estado
          </label>
          <select
            id="concept_active"
            name="is_active"
            defaultValue={row.is_active ? "1" : "0"}
            className={inputClass}
          >
            <option value="1">Activo</option>
            <option value="0">Inactivo</option>
          </select>
        </div>
      ) : null}
    </div>
  );
}

export function ExpenseConceptsManager({
  rows,
}: {
  rows: StoreExpenseConceptRow[];
}) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = useMemo(
    () => rows.find((r) => r.id === editingId) ?? null,
    [rows, editingId],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Definí qué conceptos salen al registrar un gasto o un egreso.
        </p>
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setCreating((v) => !v);
          }}
          className={`${adminToolbarBtnBaseClass} ${adminToolbarBtnActiveClass}`}
        >
          {creating ? "Cerrar" : "+ Nuevo concepto"}
        </button>
      </div>

      {creating ? (
        <form
          action={createExpenseConcept}
          className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Nuevo concepto
          </h2>
          <ConceptFormFields />
          <div className="mt-4 flex flex-wrap gap-2">
            <AdminFormSubmitButton pendingLabel="Guardando…">
              Crear
            </AdminFormSubmitButton>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className={adminButtonCancelClass}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      {editing ? (
        <form
          action={updateExpenseConcept}
          className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <input type="hidden" name="id" value={editing.id} />
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Editar: {editing.name}
          </h2>
          <ConceptFormFields row={editing} />
          <div className="mt-4 flex flex-wrap gap-2">
            <AdminFormSubmitButton pendingLabel="Guardando…">
              Guardar cambios
            </AdminFormSubmitButton>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className={adminButtonCancelClass}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60">
            <tr>
              <th className="px-3 py-2">Concepto</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/80"
              >
                <td className="px-3 py-2.5">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {row.name}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {row.category}
                    {row.allows_custom_text ? " · texto libre" : ""}
                    {row.is_system ? " · sistema" : ""}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-zinc-700 dark:text-zinc-300">
                  {kindsLabel(row)}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={
                      row.is_active
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-zinc-400"
                    }
                  >
                    {row.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap items-center justify-end gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCreating(false);
                        setEditingId(row.id);
                      }}
                      className={iconBtnClass}
                      title="Editar"
                      aria-label={`Editar ${row.name}`}
                    >
                      <Pencil className="size-4" strokeWidth={2} aria-hidden />
                    </button>
                    <form action={toggleExpenseConceptActive}>
                      <input type="hidden" name="id" value={row.id} />
                      <input
                        type="hidden"
                        name="is_active"
                        value={row.is_active ? "0" : "1"}
                      />
                      <button
                        type="submit"
                        className={iconBtnClass}
                        title={row.is_active ? "Desactivar" : "Activar"}
                        aria-label={
                          row.is_active
                            ? `Desactivar ${row.name}`
                            : `Activar ${row.name}`
                        }
                      >
                        {row.is_active ? (
                          <CircleSlash2
                            className="size-4"
                            strokeWidth={2}
                            aria-hidden
                          />
                        ) : (
                          <Power className="size-4" strokeWidth={2} aria-hidden />
                        )}
                      </button>
                    </form>
                    {!row.is_system ? (
                      <form action={deleteExpenseConcept}>
                        <input type="hidden" name="id" value={row.id} />
                        <button
                          type="submit"
                          className={iconDangerBtnClass}
                          title="Eliminar"
                          aria-label={`Eliminar ${row.name}`}
                          onClick={(e) => {
                            if (
                              !window.confirm(
                                `¿Eliminar “${row.name}”? Si ya se usó en gastos, solo se desactiva.`,
                              )
                            ) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <Trash2 className="size-4" strokeWidth={2} aria-hidden />
                        </button>
                      </form>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-8 text-center text-sm text-zinc-500"
                >
                  No hay conceptos todavía.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
