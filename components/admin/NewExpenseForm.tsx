"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createStoreExpense } from "@/app/actions/admin/expenses";
import {
  AdminFormSubmitButton,
  adminPrimarySubmitButtonClass,
} from "@/components/admin/AdminFormSubmitButton";
import { adminCreateFailedMessage } from "@/lib/admin-create-failed-messages";
import {
  AdminDateInput,
  ProductMoneyInput,
  productInputClass as inputClass,
  productLabelClass as labelClass,
} from "@/components/admin/product-form-primitives";
import { todayYmdInReportStore } from "@/lib/admin-report-range";
import { AdminPortalRoot } from "@/components/admin/AdminPortalRoot";
import { adminButtonCancelClass } from "@/lib/admin-ui";
import {
  EXPENSE_KIND_OPTIONS,
  EXPENSE_SCOPE_OPTIONS,
  type ExpenseKind,
  type ExpenseScope,
} from "@/lib/expenses-constants";
import {
  EXPENSE_CONCEPT_OPTIONS,
  EXPENSE_CONCEPT_OTHER,
  EXPENSE_CONCEPT_OTHER_TAX,
  EXPENSE_CONCEPT_PERSONAL_TURNOS,
  EXPENSE_EGRESO_TAX_OPTIONS,
  type ExpensePaymentMethod,
} from "@/lib/expense-concepts";

export type TurnWorkerOption = { id: string; label: string };

const choiceSelected =
  "border-rose-900/35 bg-rose-50 ring-1 ring-rose-900/15 dark:border-rose-400/40 dark:bg-rose-950/35 dark:ring-rose-400/20";
const choiceIdle =
  "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-600";

const payMethodsDiario: { value: ExpensePaymentMethod; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "otro", label: "Otro" },
];

const payMethodsMensual: { value: ExpensePaymentMethod; label: string }[] = [
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "efectivo_acumulado", label: "Efectivo acumulado" },
  { value: "otro", label: "Otro" },
];

function errorMessage(code: string | undefined) {
  switch (code) {
    case "concept":
      return "Ingresa un concepto.";
    case "amount":
      return "Monto inválido.";
    case "kind":
      return "Elegí si es gasto o egreso.";
    case "scope":
      return "Elegí si es caja del turno o cuenta mensual.";
    case "payment":
      return "En cuenta mensual usá transferencia, tarjeta, efectivo acumulado u otro.";
    case "db":
      return adminCreateFailedMessage("expense");
    default:
      return null;
  }
}

export function NewExpenseModal({
  open,
  onClose,
  initialError,
  turnWorkers = [],
}: {
  open: boolean;
  onClose: () => void;
  initialError?: string;
  turnWorkers?: TurnWorkerOption[];
}) {
  const gastoConceptOptions = useMemo(
    () =>
      turnWorkers.length > 0
        ? EXPENSE_CONCEPT_OPTIONS
        : EXPENSE_CONCEPT_OPTIONS.filter(
            (o) => o.concept !== EXPENSE_CONCEPT_PERSONAL_TURNOS,
          ),
    [turnWorkers.length],
  );

  const [expenseKind, setExpenseKind] = useState<ExpenseKind>("gasto");
  const [expenseScope, setExpenseScope] = useState<ExpenseScope>("diario");

  const conceptOptionsForSelect = useMemo(
    () =>
      expenseKind === "egreso" ? EXPENSE_EGRESO_TAX_OPTIONS : gastoConceptOptions,
    [expenseKind, gastoConceptOptions],
  );

  const [conceptSelection, setConceptSelection] = useState(
    () => gastoConceptOptions[0]?.concept ?? "",
  );
  const [conceptOther, setConceptOther] = useState("");
  const [turnWorkerId, setTurnWorkerId] = useState("");
  const [category, setCategory] = useState(
    () => gastoConceptOptions[0]?.category ?? "operativo",
  );
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>(
    () => gastoConceptOptions[0]?.paymentMethod ?? "transferencia",
  );
  const [notes, setNotes] = useState("");
  const [amountCents, setAmountCents] = useState(0);
  const [expenseDate, setExpenseDate] = useState(() => todayYmdInReportStore());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (conceptOptionsForSelect.some((o) => o.concept === conceptSelection)) return;
    const first = conceptOptionsForSelect[0];
    if (first) {
      setConceptSelection(first.concept);
      setCategory(first.category);
      setPaymentMethod(
        expenseScope === "mensual" && first.paymentMethod === "efectivo"
          ? "transferencia"
          : first.paymentMethod,
      );
      setTurnWorkerId("");
      setConceptOther("");
    }
  }, [conceptOptionsForSelect, conceptSelection, expenseScope]);

  const err = useMemo(() => errorMessage(initialError), [initialError]);
  const conceptValue = useMemo(() => {
    if (
      conceptSelection === EXPENSE_CONCEPT_OTHER ||
      conceptSelection === EXPENSE_CONCEPT_OTHER_TAX
    ) {
      return conceptOther.trim();
    }
    if (conceptSelection === EXPENSE_CONCEPT_PERSONAL_TURNOS) {
      const w = turnWorkers.find((t) => t.id === turnWorkerId);
      return w ? `${EXPENSE_CONCEPT_PERSONAL_TURNOS} — ${w.label}` : "";
    }
    return conceptSelection;
  }, [conceptSelection, conceptOther, turnWorkerId, turnWorkers]);

  const otroIncomplete =
    (conceptSelection === EXPENSE_CONCEPT_OTHER ||
      conceptSelection === EXPENSE_CONCEPT_OTHER_TAX) &&
    !conceptOther.trim();
  const turnoIncomplete =
    conceptSelection === EXPENSE_CONCEPT_PERSONAL_TURNOS &&
    (!turnWorkerId || !turnWorkers.some((t) => t.id === turnWorkerId));
  const amountIncomplete = amountCents <= 0;
  const submitBlocked = otroIncomplete || turnoIncomplete || amountIncomplete;

  const payOptions =
    expenseScope === "mensual" ? payMethodsMensual : payMethodsDiario;

  if (!open || !mounted) return null;

  return createPortal(
    <AdminPortalRoot>
      <>
      {/* Backdrop solo sobre el contenido (sidebar + navbar quedan nítidos). */}
      <button
        type="button"
        className="fixed inset-x-0 bottom-0 top-14 z-[100] bg-zinc-950/25 backdrop-blur-[1px] dark:bg-black/35 sm:top-16 lg:left-64"
        aria-label="Cerrar"
        onClick={onClose}
      />
      {/* Centrado en el workspace (derecha del sidebar en desktop). */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 top-14 z-[101] flex items-center justify-center p-3 sm:top-16 sm:p-6 lg:left-64">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-expense-title"
          className="pointer-events-auto flex max-h-[min(92dvh,880px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
        >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800 sm:px-6">
          <div className="min-w-0">
            <h2
              id="new-expense-title"
              className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
            >
              Nuevo gasto o egreso
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              Caja del turno o cuenta mensual · gasto u impuesto
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

        <form
          action={createStoreExpense}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4 sm:px-6">
            {err ? (
              <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/35 dark:text-red-100">
                {err}
              </p>
            ) : null}

            <fieldset>
              <legend className={labelClass}>Tipo</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {EXPENSE_KIND_OPTIONS.map((opt) => {
                  const selected = expenseKind === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`cursor-pointer rounded-xl border px-3 py-2.5 transition ${
                        selected ? choiceSelected : choiceIdle
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="expense_kind"
                          value={opt.value}
                          checked={selected}
                          onChange={() => {
                            setExpenseKind(opt.value);
                            setConceptOther("");
                            setTurnWorkerId("");
                          }}
                          className="size-3.5 border-zinc-300 text-rose-950 focus:ring-rose-900 dark:border-zinc-600"
                          required
                        />
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {opt.label}
                        </span>
                      </span>
                      <span className="mt-1 block pl-5 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                        {opt.value === "gasto"
                          ? "Operativo del negocio"
                          : "Impuestos SAS"}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className={labelClass}>Alcance</legend>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {EXPENSE_SCOPE_OPTIONS.map((opt) => {
                  const selected = expenseScope === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`cursor-pointer rounded-xl border px-3 py-2.5 transition ${
                        selected ? choiceSelected : choiceIdle
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="expense_scope"
                          value={opt.value}
                          checked={selected}
                          onChange={() => {
                            setExpenseScope(opt.value);
                            if (opt.value === "mensual" && paymentMethod === "efectivo") {
                              setPaymentMethod("transferencia");
                            }
                          }}
                          className="size-3.5 border-zinc-300 text-rose-950 focus:ring-rose-900 dark:border-zinc-600"
                          required
                        />
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {opt.label}
                        </span>
                      </span>
                      <span className="mt-1 block pl-5 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                        {opt.value === "diario"
                          ? "Si es efectivo, baja el cierre"
                          : "No toca el cierre de caja"}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label className={labelClass}>Monto</label>
              <div className="mt-1.5">
                <ProductMoneyInput
                  name="amount_cents"
                  required
                  value={amountCents}
                  onChange={setAmountCents}
                />
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Escribí solo números; se formatea solo.
              </p>
            </div>

            <div>
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
                    const nextPm =
                      expenseScope === "mensual" && hit.paymentMethod === "efectivo"
                        ? "transferencia"
                        : hit.paymentMethod;
                    setPaymentMethod(nextPm);
                  }
                }}
                className={`${inputClass} mt-1.5`}
              >
                {conceptOptionsForSelect.map((opt) => (
                  <option key={opt.concept} value={opt.concept}>
                    {opt.concept}
                  </option>
                ))}
              </select>
              {conceptSelection === EXPENSE_CONCEPT_PERSONAL_TURNOS ? (
                <select
                  value={turnWorkerId}
                  onChange={(e) => setTurnWorkerId(e.target.value)}
                  required
                  className={`${inputClass} mt-2`}
                  aria-label="Seleccionar a quién se le pagó el turno"
                >
                  <option value="">Elegí a quién se le pagó el turno…</option>
                  {turnWorkers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.label}
                    </option>
                  ))}
                </select>
              ) : null}
              {conceptSelection === EXPENSE_CONCEPT_OTHER ||
              conceptSelection === EXPENSE_CONCEPT_OTHER_TAX ? (
                <input
                  value={conceptOther}
                  onChange={(e) => setConceptOther(e.target.value)}
                  placeholder={
                    conceptSelection === EXPENSE_CONCEPT_OTHER_TAX
                      ? "Escribe el impuesto"
                      : "Escribe el concepto"
                  }
                  className={`${inputClass} mt-2`}
                />
              ) : null}
              <input type="hidden" name="concept" value={conceptValue} required />
              <input type="hidden" name="category" value={category} />
            </div>

            <fieldset>
              <legend className={labelClass}>Medio de pago</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {payOptions.map((opt) => {
                  const selected = paymentMethod === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentMethod(opt.value)}
                      className={`rounded-xl border px-2 py-2.5 text-center text-xs font-semibold transition sm:text-sm ${
                        selected ? choiceSelected : choiceIdle
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {expenseScope === "mensual" && paymentMethod === "efectivo_acumulado" ? (
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Sale del efectivo juntado de cajas anteriores. No baja el cierre de hoy.
                </p>
              ) : null}
              <input type="hidden" name="payment_method" value={paymentMethod} />
            </fieldset>

            <div>
              <label className={labelClass}>Fecha de registro</label>
              <div className="mt-1.5">
                <AdminDateInput
                  name="expense_date"
                  required
                  value={expenseDate}
                  onChange={setExpenseDate}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Nota (opcional)</label>
              <textarea
                name="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Detalle adicional…"
                className={`${inputClass} mt-1.5 min-h-[72px] resize-y`}
              />
            </div>
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-zinc-100 bg-zinc-50/80 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className={`${adminButtonCancelClass} w-full sm:w-auto`}
            >
              Cancelar
            </button>
            <AdminFormSubmitButton
              pendingLabel="Registrando…"
              disabled={submitBlocked}
              className={`w-full px-5 py-2.5 sm:w-auto ${adminPrimarySubmitButtonClass}`}
            >
              {expenseKind === "egreso" ? "Registrar egreso" : "Registrar gasto"}
            </AdminFormSubmitButton>
          </div>
        </form>
        </div>
      </div>
      </>
    </AdminPortalRoot>,
    document.body,
  );
}

/** Abre/cierra el modal según `?nuevo=1` en la URL del listado. */
export function NewExpenseModalHost({
  open,
  initialError,
  turnWorkers = [],
}: {
  open: boolean;
  initialError?: string;
  turnWorkers?: TurnWorkerOption[];
}) {
  const router = useRouter();

  const close = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("nuevo");
    url.searchParams.delete("expense_error");
    const qs = url.searchParams.toString();
    router.replace(qs ? `${url.pathname}?${qs}` : url.pathname, { scroll: false });
  };

  return (
    <NewExpenseModal
      open={open}
      onClose={close}
      initialError={initialError}
      turnWorkers={turnWorkers}
    />
  );
}
