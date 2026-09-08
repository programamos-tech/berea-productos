"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import {
  createExpenseConcept,
  deleteExpenseConcept,
  toggleExpenseConceptActive,
  updateExpenseConcept,
} from "@/app/actions/admin/expense-concepts";
import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import { AdminPortalRoot } from "@/components/admin/AdminPortalRoot";
import type { StoreExpenseConceptRow } from "@/lib/store-expense-concepts";
import {
  adminButtonCancelClass,
  adminToolbarBtnActiveClass,
  adminToolbarBtnBaseClass,
} from "@/lib/admin-ui";
import type { ExpensePaymentMethod } from "@/lib/expense-concepts";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
const labelClass =
  "mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";

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

type ConceptRole = "gasto" | "egreso" | "otro";

function conceptRole(row: StoreExpenseConceptRow): ConceptRole {
  if (row.allows_custom_text || row.special_key === "other_gasto" || row.special_key === "other_egreso") {
    return "otro";
  }
  if (row.applies_to_egreso) return "egreso";
  return "gasto";
}

function roleLabel(row: StoreExpenseConceptRow): string {
  const role = conceptRole(row);
  if (role === "otro") return "Otro";
  if (role === "egreso") return "Egreso";
  return "Gasto";
}

function ConceptModal({
  mode,
  row,
  onClose,
}: {
  mode: "create" | "edit";
  row?: StoreExpenseConceptRow | null;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
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
  }, [onClose]);

  if (!mounted) return null;

  const title = mode === "create" ? "Nuevo concepto" : `Editar: ${row?.name ?? ""}`;
  const action = mode === "create" ? createExpenseConcept : updateExpenseConcept;
  const defaultRole: ConceptRole = row ? conceptRole(row) : "gasto";

  return createPortal(
    <AdminPortalRoot>
      <>
        <button
          type="button"
          className="fixed inset-x-0 bottom-0 top-14 z-[100] bg-zinc-950/25 backdrop-blur-[1px] dark:bg-black/35 sm:top-16 lg:left-64"
          aria-label="Cerrar"
          onClick={onClose}
        />
        <div className="pointer-events-none fixed inset-x-0 bottom-0 top-14 z-[101] flex items-center justify-center p-3 sm:top-16 sm:p-6 lg:left-64">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="concept-modal-title"
            className="pointer-events-auto flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <h2
                id="concept-modal-title"
                className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                aria-label="Cerrar"
              >
                <span className="text-xl leading-none" aria-hidden>
                  ×
                </span>
              </button>
            </div>

            <form action={action} className="flex flex-col">
              {mode === "edit" && row ? (
                <input type="hidden" name="id" value={row.id} />
              ) : null}
              <div className="space-y-4 px-5 py-4">
                <div>
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
                    placeholder="Ej. Arriendo"
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
                  <label className={labelClass} htmlFor="concept_kind">
                    Tipo
                  </label>
                  <select
                    id="concept_kind"
                    name="concept_kind"
                    required
                    defaultValue={defaultRole}
                    className={inputClass}
                  >
                    <option value="gasto">Gasto</option>
                    <option value="egreso">Egreso</option>
                    <option value="otro">Otro (texto libre)</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass} htmlFor="concept_active">
                    Estado
                  </label>
                  <select
                    id="concept_active"
                    name="is_active"
                    defaultValue={row && !row.is_active ? "0" : "1"}
                    className={inputClass}
                  >
                    <option value="1">Activo</option>
                    <option value="0">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-zinc-100 px-5 py-4 dark:border-zinc-800">
                <AdminFormSubmitButton pendingLabel="Guardando…">
                  {mode === "create" ? "Guardar" : "Guardar cambios"}
                </AdminFormSubmitButton>
                <button
                  type="button"
                  onClick={onClose}
                  className={adminButtonCancelClass}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </>
    </AdminPortalRoot>,
    document.body,
  );
}

export function ExpenseConceptsManager({
  rows,
}: {
  rows: StoreExpenseConceptRow[];
}) {
  const [modal, setModal] = useState<
    null | { mode: "create" } | { mode: "edit"; id: string }
  >(null);

  const editing = useMemo(() => {
    if (!modal || modal.mode !== "edit") return null;
    return rows.find((r) => r.id === modal.id) ?? null;
  }, [modal, rows]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setModal({ mode: "create" })}
          className={`${adminToolbarBtnBaseClass} ${adminToolbarBtnActiveClass}`}
        >
          + Nuevo concepto
        </button>
      </div>

      {modal?.mode === "create" ? (
        <ConceptModal mode="create" onClose={() => setModal(null)} />
      ) : null}
      {modal?.mode === "edit" && editing ? (
        <ConceptModal
          mode="edit"
          row={editing}
          onClose={() => setModal(null)}
        />
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
                </td>
                <td className="px-3 py-2.5 text-zinc-700 dark:text-zinc-300">
                  {roleLabel(row)}
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
                      onClick={() => setModal({ mode: "edit", id: row.id })}
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
                          <EyeOff
                            className="size-4"
                            strokeWidth={2}
                            aria-hidden
                          />
                        ) : (
                          <Eye className="size-4" strokeWidth={2} aria-hidden />
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
