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
  CashDayLiveTotals,
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
          Ingresá el fondo inicial. El esperado al cierre será fondo + ventas en efectivo − egresos
          en efectivo del día.
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

function Metric({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={
        emphasize
          ? "rounded-lg border border-rose-200/80 bg-rose-50/70 px-3 py-2.5 dark:border-rose-900/50 dark:bg-rose-950/30"
          : "rounded-lg border border-zinc-200/80 bg-zinc-50/80 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950/50"
      }
    >
      <p
        className={
          emphasize
            ? "text-[11px] font-medium text-rose-800 dark:text-rose-200"
            : "text-[11px] text-zinc-500 dark:text-zinc-400"
        }
      >
        {label}
      </p>
      <p
        className={
          emphasize
            ? "mt-1 text-base font-semibold tabular-nums text-rose-950 dark:text-rose-100"
            : "mt-1 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100"
        }
      >
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

function ExpensesTable({ lines }: { lines: CashExpenseLine[] }) {
  if (lines.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No hay egresos cargados para este día. Si registrás uno en Egresos, aparece acá y baja el
        efectivo esperado (si es en efectivo).
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
            <th className="py-2 text-right font-medium">Monto</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.id} className="border-b border-zinc-100 dark:border-zinc-800">
              <td className="py-2 pr-3 text-zinc-900 dark:text-zinc-100">{l.concept}</td>
              <td className="py-2 pr-3 text-zinc-600 dark:text-zinc-300">
                {paymentLabel(l.payment_method)}
              </td>
              <td className="py-2 text-right tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
                {formatCop(l.amount_cents)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CashRegisterClosePanel({
  sessionId,
  businessDayLabel,
  openingFloatCents,
  live,
}: {
  sessionId: string;
  businessDayLabel: string;
  openingFloatCents: number;
  live: CashDayLiveTotals;
}) {
  const [countedCents, setCountedCents] = useState(Math.max(0, live.expectedCashCents));
  const [submissionId] = useState(newSubmissionId);
  const diff = countedCents - live.expectedCashCents;

  return (
    <div className="space-y-5">
      <section className={cardClass}>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Movimiento del día · {businessDayLabel}
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              Totales en vivo (Bogotá). Al cerrar se congelan ventas, egresos y stock.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          <Metric label="Fondo inicial" value={formatCop(openingFloatCents)} />
          <Metric label="Ventas (total)" value={formatCop(live.salesTotalCents)} />
          <Metric label="Ventas efectivo" value={formatCop(live.salesCashCents)} />
          <Metric label="Ventas transferencia" value={formatCop(live.salesTransferCents)} />
          <Metric
            label="Ventas mixtas / otras"
            value={formatCop(live.salesMixedCents + live.salesOtherCents)}
          />
          <Metric label="Egresos efectivo" value={formatCop(live.expensesCashCents)} />
          <Metric label="Egresos otros medios" value={formatCop(live.expensesOtherCents)} />
          <Metric label="Facturas" value={String(live.salesCount)} />
          <Metric label="Unidades vendidas" value={String(live.unitsSold)} />
          <Metric label="Egresos (#)" value={String(live.expenseLines.length)} />
          <div className="col-span-2 sm:col-span-3 lg:col-span-2 xl:col-span-2">
            <Metric
              label="Efectivo esperado (fondo + efectivo − egresos efectivo)"
              value={formatCop(live.expectedCashCents)}
              emphasize
            />
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(300px,400px)] xl:items-start">
        <section className={cardClass}>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Stock que salió (ventas) · {live.unitsSold} ud
          </h3>
          <div className="mt-3">
            <StockOutTable lines={live.stockOutLines} />
          </div>
        </section>

        <section className={cardClass}>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Egresos del día · {live.expenseLines.length} ·{" "}
            {formatCop(live.expensesCashCents + live.expensesOtherCents)}
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Efectivo {formatCop(live.expensesCashCents)} · otros{" "}
            {formatCop(live.expensesOtherCents)}. Los de efectivo ya restan del esperado.
          </p>
          <div className="mt-3">
            <ExpensesTable lines={live.expenseLines} />
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Cerrar caja
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Contá el efectivo físico. La diferencia queda en el registro del día.
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

            <div
              className={`rounded-lg border px-3 py-2.5 text-sm ${
                diff === 0
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100"
                  : diff > 0
                    ? "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
                    : "border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100"
              }`}
            >
              {diff === 0
                ? "Cuadra con el esperado"
                : diff > 0
                  ? `Sobrante: ${formatCop(diff)}`
                  : `Faltante: ${formatCop(Math.abs(diff))}`}
            </div>

            <div>
              <label htmlFor="caja-notes" className={labelClass}>
                Notas (opcional)
              </label>
              <textarea
                id="caja-notes"
                name="notes"
                rows={2}
                placeholder="Ej. Faltante por cambio mal entregado"
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
