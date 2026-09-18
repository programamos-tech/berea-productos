"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createCashRegisterAction,
  setCashRegisterActiveAction,
  updateCashRegisterAction,
} from "@/app/actions/admin/cash-register";
import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import { AdminPortalRoot } from "@/components/admin/AdminPortalRoot";
import {
  productInputClass,
  productLabelClass,
} from "@/components/admin/product-form-primitives";
import type { CashRegisterAssignee, CashRegisterRow } from "@/lib/cash-registers";
import { adminButtonCancelClass } from "@/lib/admin-ui";

function nextCajaName(registers: CashRegisterRow[]): string {
  let max = 0;
  for (const row of registers) {
    const match = /^caja\s+(\d+)$/i.exec(row.name.trim());
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `Caja ${max + 1}`;
}

function CashierSelect({
  id,
  name,
  assignees,
  takenIds,
  defaultValue,
  required = true,
}: {
  id: string;
  name: string;
  assignees: CashRegisterAssignee[];
  takenIds: Set<string>;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <select
      id={id}
      name={name}
      required={required}
      defaultValue={defaultValue ?? ""}
      className={`${productInputClass} mt-1.5`}
    >
      <option value="" disabled>
        Elegí cajera…
      </option>
      {assignees.map((person) => {
        const taken = takenIds.has(person.id) && person.id !== defaultValue;
        return (
          <option key={person.id} value={person.id} disabled={taken}>
            {person.label}
            {taken ? " · ya tiene caja" : ""}
          </option>
        );
      })}
    </select>
  );
}

export function CashRegisterManageModal({
  open,
  registers,
  assignees,
  openRegisterIds,
  errorBanner,
  onClose,
}: {
  open: boolean;
  registers: CashRegisterRow[];
  assignees: CashRegisterAssignee[];
  openRegisterIds: string[];
  errorBanner?: string | null;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const takenIds = useMemo(() => {
    const ids = new Set<string>();
    for (const row of registers) {
      if (row.is_active && row.assigned_user_id) ids.add(row.assigned_user_id);
    }
    return ids;
  }, [registers]);

  const openIds = useMemo(() => new Set(openRegisterIds), [openRegisterIds]);
  const defaultName = nextCajaName(registers);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

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
            aria-labelledby="nueva-caja-title"
            className="pointer-events-auto flex max-h-[min(92dvh,880px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-950"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-200/70 px-5 py-4 dark:border-zinc-800 sm:px-6">
              <div className="min-w-0">
                <h2
                  id="nueva-caja-title"
                  className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
                >
                  Nueva caja
                </h2>
                <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                  Siempre asignada a una cajera o vendedora
                </p>
              </div>
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

            <div className="admin-panel-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
              {errorBanner ? (
                <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/35 dark:text-red-100">
                  {errorBanner}
                </p>
              ) : null}

              <form
                action={createCashRegisterAction}
                className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/40 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
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
                    defaultValue={defaultName}
                    className={`${productInputClass} mt-1.5`}
                  />
                </div>
                <div>
                  <label className={productLabelClass} htmlFor="new_cash_register_user">
                    Cajera
                  </label>
                  <CashierSelect
                    id="new_cash_register_user"
                    name="assigned_user_id"
                    assignees={assignees}
                    takenIds={takenIds}
                  />
                </div>
                <AdminFormSubmitButton
                  pendingLabel="Creando…"
                  className="h-10 rounded-lg border border-zinc-900 bg-zinc-900 px-4 text-sm font-semibold text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  Crear
                </AdminFormSubmitButton>
              </form>

              <h3 className="mt-6 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Cajas creadas
              </h3>
              {registers.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">Todavía no hay puntos de caja.</p>
              ) : (
                <ul className="mt-2 grid gap-2">
                  {registers.map((row) => {
                    const isOpen = openIds.has(row.id);
                    return (
                      <li
                        key={row.id}
                        className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span
                            className={
                              row.is_active
                                ? "text-xs font-medium text-emerald-700 dark:text-emerald-300"
                                : "text-xs font-medium text-zinc-400"
                            }
                          >
                            {row.is_active ? "Activa" : "Desactivada"}
                            {isOpen ? " · abierta" : ""}
                          </span>
                          <form action={setCashRegisterActiveAction}>
                            <input type="hidden" name="cash_register_id" value={row.id} />
                            <input
                              type="hidden"
                              name="is_active"
                              value={row.is_active ? "0" : "1"}
                            />
                            <button
                              type="submit"
                              disabled={row.is_active && isOpen}
                              title={
                                row.is_active && isOpen
                                  ? "Cerrá la caja antes de desactivarla"
                                  : row.is_active
                                    ? "Desactivar"
                                    : "Activar"
                              }
                              className="text-xs font-medium text-zinc-600 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-40 dark:text-zinc-300"
                            >
                              {row.is_active ? "Desactivar" : "Activar"}
                            </button>
                          </form>
                        </div>
                        <form
                          action={updateCashRegisterAction}
                          className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
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
                            <CashierSelect
                              id={`user-${row.id}`}
                              name="assigned_user_id"
                              assignees={assignees}
                              takenIds={takenIds}
                              defaultValue={row.assigned_user_id ?? ""}
                            />
                          </div>
                          <AdminFormSubmitButton
                            pendingLabel="Guardando…"
                            className="h-10 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                          >
                            Guardar
                          </AdminFormSubmitButton>
                        </form>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex shrink-0 justify-end border-t border-zinc-100 px-5 py-3 dark:border-zinc-800 sm:px-6">
              <button type="button" onClick={onClose} className={adminButtonCancelClass}>
                Listo
              </button>
            </div>
          </div>
        </div>
      </>
    </AdminPortalRoot>,
    document.body,
  );
}

export function CashRegisterManageModalHost({
  open,
  registers,
  assignees,
  openRegisterIds,
  errorBanner,
}: {
  open: boolean;
  registers: CashRegisterRow[];
  assignees: CashRegisterAssignee[];
  openRegisterIds: string[];
  errorBanner?: string | null;
}) {
  const router = useRouter();

  function close() {
    const url = new URL(window.location.href);
    url.searchParams.delete("nuevo");
    url.searchParams.delete("error");
    const qs = url.searchParams.toString();
    router.replace(qs ? `${url.pathname}?${qs}` : url.pathname, { scroll: false });
  }

  return (
    <CashRegisterManageModal
      open={open}
      registers={registers}
      assignees={assignees}
      openRegisterIds={openRegisterIds}
      errorBanner={errorBanner}
      onClose={close}
    />
  );
}
