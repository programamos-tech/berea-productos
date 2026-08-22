"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createStoreExpense } from "@/app/actions/admin/expenses";
import { AdminFormSubmitButton, adminPrimarySubmitButtonClass } from "@/components/admin/AdminFormSubmitButton";
import { adminCreateFailedMessage } from "@/lib/admin-create-failed-messages";
import {
  AdminDateInput,
  ProductMoneyInput,
  productInputClass as inputClass,
  productLabelClass as labelClass,
  productSectionTitle as sectionTitle,
} from "@/components/admin/product-form-primitives";
import { todayYmdInReportStore } from "@/lib/admin-report-range";
import {
  EXPENSE_KIND_OPTIONS,
  type ExpenseKind,
} from "@/lib/expenses-constants";
import {
  EXPENSE_CONCEPT_OPTIONS,
  EXPENSE_CONCEPT_OTHER,
  EXPENSE_CONCEPT_PERSONAL_TURNOS,
  type ExpensePaymentMethod,
} from "@/lib/expense-concepts";

const cardSectionClass =
  "rounded-xl border border-zinc-200/90 bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 sm:p-6 dark:border-zinc-700/90 dark:bg-zinc-900 dark:shadow-none dark:ring-white/[0.06]";

export type TurnWorkerOption = { id: string; label: string };

export function NewExpenseHeader() {
  return (
    <div className="mb-6 flex min-w-0 flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <Link href="/admin/egresos" className="hover:text-zinc-800 dark:hover:text-zinc-200">
            Gastos y egresos
          </Link>
          <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">/</span>
          <span className="text-zinc-700 dark:text-zinc-300">Nuevo registro</span>
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl md:text-3xl">
          Nuevo gasto o egreso
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          Elegí si es un gasto operativo o un egreso (proveedores / impuestos). El método de pago
          define en Reportes si el monto se descuenta del efectivo o de la transferencia.
        </p>
      </div>
      <Link
        href="/admin/egresos"
        className="inline-flex size-10 shrink-0 items-center justify-center self-start rounded-lg border border-zinc-200/90 bg-white text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 sm:self-auto"
        aria-label="Volver a gastos y egresos"
      >
        <span className="text-lg leading-none" aria-hidden>
          ←
        </span>
      </Link>
    </div>
  );
}

function errorMessage(code: string | undefined) {
  switch (code) {
    case "concept":
      return "Ingresa un concepto.";
    case "amount":
      return "Monto inválido.";
    case "kind":
      return "Elegí si es gasto o egreso.";
    case "db":
      return adminCreateFailedMessage("expense");
    default:
      return null;
  }
}

export function NewExpenseForm({
  initialError,
  turnWorkers = [],
}: {
  initialError?: string;
  turnWorkers?: TurnWorkerOption[];
}) {
  const conceptOptionsForSelect = useMemo(
    () =>
      turnWorkers.length > 0
        ? EXPENSE_CONCEPT_OPTIONS
        : EXPENSE_CONCEPT_OPTIONS.filter(
            (o) => o.concept !== EXPENSE_CONCEPT_PERSONAL_TURNOS,
          ),
    [turnWorkers.length],
  );

  const [expenseKind, setExpenseKind] = useState<ExpenseKind>("gasto");
  const [conceptSelection, setConceptSelection] = useState(
    () => conceptOptionsForSelect[0]?.concept ?? "",
  );
  const [conceptOther, setConceptOther] = useState("");
  const [turnWorkerId, setTurnWorkerId] = useState("");
  const [category, setCategory] = useState(
    () => conceptOptionsForSelect[0]?.category ?? "operativo",
  );
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>(
    () => conceptOptionsForSelect[0]?.paymentMethod ?? "transferencia",
  );
  const [notes, setNotes] = useState("");
  const [amountCents, setAmountCents] = useState(0);
  const [expenseDate, setExpenseDate] = useState(() => todayYmdInReportStore());

  useEffect(() => {
    if (conceptOptionsForSelect.some((o) => o.concept === conceptSelection)) return;
    const first = conceptOptionsForSelect[0];
    if (first) {
      setConceptSelection(first.concept);
      setCategory(first.category);
      setPaymentMethod(first.paymentMethod);
      setTurnWorkerId("");
    }
  }, [conceptOptionsForSelect, conceptSelection]);

  const err = useMemo(() => errorMessage(initialError), [initialError]);
  const conceptValue = useMemo(() => {
    if (conceptSelection === EXPENSE_CONCEPT_OTHER) return conceptOther.trim();
    if (conceptSelection === EXPENSE_CONCEPT_PERSONAL_TURNOS) {
      const w = turnWorkers.find((t) => t.id === turnWorkerId);
      return w ? `${EXPENSE_CONCEPT_PERSONAL_TURNOS} — ${w.label}` : "";
    }
    return conceptSelection;
  }, [conceptSelection, conceptOther, turnWorkerId, turnWorkers]);

  const otroIncomplete = conceptSelection === EXPENSE_CONCEPT_OTHER && !conceptOther.trim();
  const turnoIncomplete =
    conceptSelection === EXPENSE_CONCEPT_PERSONAL_TURNOS &&
    (!turnWorkerId || !turnWorkers.some((t) => t.id === turnWorkerId));
  const submitBlocked = otroIncomplete || turnoIncomplete;

  return (
    <form action={createStoreExpense} className="space-y-6">
      {err ? (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/35 dark:text-red-100">
          {err}
        </p>
      ) : null}

      <section className={cardSectionClass}>
        <h2 className={sectionTitle}>Tipo de registro</h2>
        <fieldset className="mt-4">
          <legend className="sr-only">Elegí gasto o egreso</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {EXPENSE_KIND_OPTIONS.map((opt) => {
              const selected = expenseKind === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer flex-col gap-1 rounded-xl border px-4 py-3 transition ${
                    selected
                      ? "border-rose-900/40 bg-rose-50/80 ring-1 ring-rose-900/20 dark:border-rose-400/40 dark:bg-rose-950/30 dark:ring-rose-400/20"
                      : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-600"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="expense_kind"
                      value={opt.value}
                      checked={selected}
                      onChange={() => setExpenseKind(opt.value)}
                      className="size-4 border-zinc-300 text-rose-950 focus:ring-rose-900 dark:border-zinc-600 dark:text-rose-400"
                      required
                    />
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {opt.label}
                    </span>
                  </span>
                  <span className="pl-6 text-xs leading-snug text-zinc-500 dark:text-zinc-400">
                    {opt.hint}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </section>

      <section className={cardSectionClass}>
        <h2 className={sectionTitle}>Información del registro</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Concepto</label>
            <select
              value={conceptSelection}
              onChange={(e) => {
                const next = e.target.value;
                setConceptSelection(next);
                setTurnWorkerId("");
                const hit = conceptOptionsForSelect.find((c) => c.concept === next);
                if (hit) {
                  setCategory(hit.category);
                  setPaymentMethod(hit.paymentMethod);
                }
              }}
              className={inputClass}
            >
              {conceptOptionsForSelect.map((opt) => (
                <option key={opt.concept} value={opt.concept}>
                  {opt.concept}
                </option>
              ))}
            </select>
            {conceptSelection === EXPENSE_CONCEPT_PERSONAL_TURNOS ? (
              <div className="mt-3">
                <label className={`${labelClass} text-zinc-600 dark:text-zinc-400`}>
                  Trabajador
                </label>
                <select
                  value={turnWorkerId}
                  onChange={(e) => setTurnWorkerId(e.target.value)}
                  required
                  className={`${inputClass} mt-1.5`}
                  aria-label="Seleccionar a quién se le pagó el turno"
                >
                  <option value="">Elegí a quién se le pagó el turno…</option>
                  {turnWorkers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            {conceptSelection === EXPENSE_CONCEPT_OTHER ? (
              <input
                value={conceptOther}
                onChange={(e) => setConceptOther(e.target.value)}
                placeholder="Escribe el concepto"
                className={`${inputClass} mt-3`}
              />
            ) : null}
            <input type="hidden" name="concept" value={conceptValue} required />
          </div>
          <div>
            <label className={labelClass}>Monto (COP)</label>
            <ProductMoneyInput
              name="amount_cents"
              required
              value={amountCents}
              onChange={setAmountCents}
            />
          </div>
          <div>
            <div>
              <label className={labelClass}>Fecha</label>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Elegí el día contable con el calendario.
              </p>
              <div className="mt-1.5">
                <AdminDateInput
                  name="expense_date"
                  required
                  value={expenseDate}
                  onChange={setExpenseDate}
                />
              </div>
            </div>
          </div>
          <div>
            <label className={labelClass}>Categoría</label>
            <input
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="operativo"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Método de pago</label>
            <select
              name="payment_method"
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as ExpensePaymentMethod)
              }
              className={inputClass}
            >
              <option value="transferencia">Transferencia</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Nota (opcional)</label>
            <input
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalle adicional"
              className={inputClass}
            />
          </div>
        </div>
        <AdminFormSubmitButton
          pendingLabel="Registrando…"
          disabled={submitBlocked}
          className={`mt-5 px-4 py-2.5 ${adminPrimarySubmitButtonClass}`}
        >
          {expenseKind === "egreso" ? "Registrar egreso" : "Registrar gasto"}
        </AdminFormSubmitButton>
      </section>
    </form>
  );
}
