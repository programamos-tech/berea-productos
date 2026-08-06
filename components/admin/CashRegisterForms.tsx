"use client";

import { useState } from "react";
import {
  closeCashRegisterSession,
  openCashRegisterSession,
} from "@/app/actions/admin/cash-register";
import {
  AdminFormSubmitButton,
  adminPrimarySubmitButtonClass,
  adminPrimarySubmitButtonFullWidthClass,
} from "@/components/admin/AdminFormSubmitButton";
import {
  ProductMoneyInput,
  productInputClass,
  productLabelClass as labelClass,
} from "@/components/admin/product-form-primitives";
import type {
  CashDayBlindSummary,
  CashExpenseLine,
  CashStockOutLine,
} from "@/lib/cash-register";
import { formatCop } from "@/lib/money";

function newSubmissionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `caja_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

const cardClass =
  "rounded-xl border border-zinc-200/90 bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 sm:p-5 dark:border-zinc-700/90 dark:bg-zinc-900 dark:shadow-none dark:ring-white/[0.06]";

function paymentLabel(pm: string) {
  switch (pm) {
    case "efectivo":
      return "Efectivo";
    case "transferencia":
      return "Transferencia";
    case "tarjeta":
      return "Tarjeta";
    default:
      return pm || "Otro";
  }
}

export function CashRegisterOpenForm({
  businessDayLabel,
}: {
  businessDayLabel: string;
}) {
  const [floatCents, setFloatCents] = useState(0);
  const [submissionId] = useState(newSubmissionId);

  return (
    <form
      action={openCashRegisterSession}
      className={`${cardClass} grid gap-4 md:grid-cols-[1fr_minmax(240px,320px)_auto] md:items-end`}
    >
      <input type="hidden" name="submission_id" value={submissionId} />
      <div className="min-w-0 md:col-span-1">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Abrir caja · {businessDayLabel}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          Ingresá el fondo inicial. Al cerrar, la vendedora cuenta el efectivo a ciegas; el sistema
          compara solo después de confirmar.
        </p>
      </div>
      <div>
        <span className={labelClass}>Fondo inicial (efectivo)</span>
        <div className="mt-2">
          <ProductMoneyInput
            name="opening_float_cents"
            value={floatCents}
            onChange={setFloatCents}
            required
          />
        </div>
      </div>
      <AdminFormSubmitButton
        pendingLabel="Abriendo…"
        className={`${adminPrimarySubmitButtonClass} w-full px-6 md:w-auto`}
      >
        Abrir caja del día
      </AdminFormSubmitButton>
    </form>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/80 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950/50">
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
    </div>
  );
}

function StockOutTable({ lines }: { lines: CashStockOutLine[] }) {
  if (lines.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Sin unidades vendidas registradas hoy.
      </p>
    );
  }
  return (
    <div className="max-h-72 overflow-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="sticky top-0 bg-white dark:bg-zinc-900">
          <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            <th className="py-2 pr-3 font-medium">Producto</th>
            <th className="py-2 pr-3 font-medium">Ref</th>
            <th className="py-2 text-right font-medium">Ud</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr
              key={l.product_id}
              className="border-b border-zinc-100 dark:border-zinc-800"
            >
              <td className="py-2 pr-3 text-zinc-900 dark:text-zinc-100">{l.name}</td>
              <td className="py-2 pr-3 font-mono text-xs text-zinc-500">
                {l.reference ?? "—"}
              </td>
              <td className="py-2 text-right tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
                {l.quantity}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExpensesTable({
  lines,
  hideAmounts,
}: {
  lines: Array<{
    id: string;
    concept: string;
    payment_method: string;
    amount_cents?: number;
  }>;
  hideAmounts?: boolean;
}) {
  if (lines.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No hay egresos cargados para este día. Si registrás uno en Egresos, aparece acá.
      </p>
    );
  }
  return (
    <div className="max-h-72 overflow-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="sticky top-0 bg-white dark:bg-zinc-900">
          <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            <th className="py-2 pr-3 font-medium">Concepto</th>
            <th className="py-2 pr-3 font-medium">Medio</th>
            {hideAmounts ? null : (
              <th className="py-2 text-right font-medium">Monto</th>
            )}
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.id} className="border-b border-zinc-100 dark:border-zinc-800">
              <td className="py-2 pr-3 text-zinc-900 dark:text-zinc-100">{l.concept}</td>
              <td className="py-2 pr-3 text-zinc-600 dark:text-zinc-300">
                {paymentLabel(l.payment_method)}
              </td>
              {hideAmounts ? null : (
                <td className="py-2 text-right tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
                  {formatCop(l.amount_cents ?? 0)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Cierre a ciegas: sin montos de efectivo / esperado hasta confirmar. */
export function CashRegisterClosePanel({
  sessionId,
  businessDayLabel,
  blind,
}: {
  sessionId: string;
  businessDayLabel: string;
  blind: CashDayBlindSummary;
}) {
  const [countedCents, setCountedCents] = useState(0);
  const [notes, setNotes] = useState("");
  const [submissionId] = useState(newSubmissionId);

  return (
    <div className="space-y-5">
      <section className={cardClass}>
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Actividad del día · {businessDayLabel}
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Conteo a ciegas: no se muestran montos de caja. Contá el efectivo físico e ingresalo;
            el sistema compara al confirmar y, si no cuadra, pide una nota.
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Metric label="Facturas del día" value={String(blind.salesCount)} />
          <Metric label="Unidades vendidas" value={String(blind.unitsSold)} />
          <Metric
            label="Egresos registrados"
            value={String(blind.expenseLines.length)}
          />
          <Metric
            label="Productos distintos"
            value={String(blind.stockOutLines.length)}
          />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(300px,400px)] xl:items-start">
        <section className={cardClass}>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Stock que salió (ventas) · {blind.unitsSold} ud
          </h3>
          <div className="mt-3">
            <StockOutTable lines={blind.stockOutLines} />
          </div>
        </section>

        <section className={cardClass}>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Egresos del día · {blind.expenseLines.length}
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Conceptos del día (sin montos hasta cerrar). Revisá que estén todos registrados.
          </p>
          <div className="mt-3">
            <ExpensesTable lines={blind.expenseLines} hideAmounts />
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Cerrar caja
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Contá billetes y monedas e ingresá el total. No hace falta calcular el esperado: eso lo
            hace el sistema.
          </p>
          <form action={closeCashRegisterSession} className="mt-4 space-y-4">
            <input type="hidden" name="session_id" value={sessionId} />
            <input type="hidden" name="submission_id" value={submissionId} />

            <div>
              <span className={labelClass}>Efectivo contado en caja</span>
              <div className="mt-2">
                <ProductMoneyInput
                  name="counted_cash_cents"
                  value={countedCents}
                  onChange={setCountedCents}
                  required
                />
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-300">
              Al confirmar, el sistema compara con ventas y egresos en efectivo. Si hay diferencia,
              tenés que dejar una nota con el motivo.
            </div>

            <div>
              <label htmlFor="caja-notes" className={labelClass}>
                Nota / motivo
              </label>
              <textarea
                id="caja-notes"
                name="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Obligatoria si no cuadra (ej. cambio mal entregado, faltante, etc.)"
                className={`${productInputClass} mt-2 resize-none`}
              />
            </div>

            <AdminFormSubmitButton
              pendingLabel="Cerrando…"
              className={adminPrimarySubmitButtonFullWidthClass}
            >
              Confirmar cierre de caja
            </AdminFormSubmitButton>
          </form>
        </section>
      </div>
    </div>
  );
}

export function CashStockOutReadonly({ lines }: { lines: CashStockOutLine[] }) {
  return (
    <div className={cardClass}>
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Stock que salió ese día
      </h2>
      <div className="mt-4">
        <StockOutTable lines={lines} />
      </div>
    </div>
  );
}

export function CashExpensesReadonly({ lines }: { lines: CashExpenseLine[] }) {
  const total = lines.reduce((s, l) => s + l.amount_cents, 0);
  return (
    <div className={cardClass}>
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Egresos del día · {formatCop(total)}
      </h2>
      <div className="mt-4">
        <ExpensesTable lines={lines} />
      </div>
    </div>
  );
}
