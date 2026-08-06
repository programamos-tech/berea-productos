"use client";

import { useState } from "react";
import {
  closeCashRegisterSession,
  openCashRegisterSession,
} from "@/app/actions/admin/cash-register";
import {
  AdminFormSubmitButton,
  adminPrimarySubmitButtonFullWidthClass,
} from "@/components/admin/AdminFormSubmitButton";
import {
  ProductMoneyInput,
  productInputClass,
  productLabelClass as labelClass,
} from "@/components/admin/product-form-primitives";
import { formatCop } from "@/lib/money";
import type { CashDayLiveTotals, CashStockOutLine } from "@/lib/cash-register";

function newSubmissionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `caja_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

const cardClass =
  "rounded-xl border border-zinc-200/90 bg-white p-5 shadow-sm ring-1 ring-zinc-950/5 dark:border-zinc-700/90 dark:bg-zinc-900 dark:shadow-none dark:ring-white/[0.06]";

export function CashRegisterOpenForm({
  businessDayLabel,
}: {
  businessDayLabel: string;
}) {
  const [floatCents, setFloatCents] = useState(0);
  const [submissionId] = useState(newSubmissionId);

  return (
    <form action={openCashRegisterSession} className={cardClass}>
      <input type="hidden" name="submission_id" value={submissionId} />
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Abrir caja · {businessDayLabel}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
        Ingresá el dinero base (fondo) con el que arranca el mostrador. Durante el día el sistema
        suma ventas en efectivo y resta egresos en efectivo para calcular lo esperado al cierre.
      </p>
      <div className="mt-6">
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
        className={`${adminPrimarySubmitButtonFullWidthClass} mt-6`}
      >
        Abrir caja del día
      </AdminFormSubmitButton>
    </form>
  );
}

function TotalsGrid({
  live,
  openingFloatCents,
}: {
  live: CashDayLiveTotals;
  openingFloatCents: number;
}) {
  const rows: { label: string; value: string }[] = [
    { label: "Fondo inicial", value: formatCop(openingFloatCents) },
    { label: "Ventas (total)", value: formatCop(live.salesTotalCents) },
    { label: "Ventas en efectivo", value: formatCop(live.salesCashCents) },
    { label: "Ventas transferencia", value: formatCop(live.salesTransferCents) },
    {
      label: "Ventas mixtas / otras",
      value: formatCop(live.salesMixedCents + live.salesOtherCents),
    },
    { label: "Egresos en efectivo", value: formatCop(live.expensesCashCents) },
    { label: "Egresos otros medios", value: formatCop(live.expensesOtherCents) },
    { label: "Facturas del día", value: String(live.salesCount) },
    { label: "Unidades vendidas", value: String(live.unitsSold) },
  ];

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {rows.map((r) => (
        <div
          key={r.label}
          className="rounded-lg border border-zinc-200/80 bg-zinc-50/80 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950/50"
        >
          <dt className="text-xs text-zinc-500 dark:text-zinc-400">{r.label}</dt>
          <dd className="mt-1 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            {r.value}
          </dd>
        </div>
      ))}
      <div className="rounded-lg border border-rose-200/80 bg-rose-50/70 px-3 py-2.5 sm:col-span-2 dark:border-rose-900/50 dark:bg-rose-950/30">
        <dt className="text-xs font-medium text-rose-800 dark:text-rose-200">
          Efectivo esperado en caja
        </dt>
        <dd className="mt-1 text-lg font-semibold tabular-nums text-rose-950 dark:text-rose-100">
          {formatCop(live.expectedCashCents)}
        </dd>
        <p className="mt-1 text-xs text-rose-800/80 dark:text-rose-200/80">
          Fondo + ventas efectivo − egresos efectivo
        </p>
      </div>
    </dl>
  );
}

function StockOutTable({ lines }: { lines: CashStockOutLine[] }) {
  if (lines.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Aún no hay unidades vendidas registradas en este día.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <section className={cardClass}>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Movimiento del día · {businessDayLabel}
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Totales en vivo según ventas pagadas y egresos del día calendario (Bogotá). Al cerrar se
          congelan en el registro.
        </p>
        <div className="mt-5">
          <TotalsGrid live={live} openingFloatCents={openingFloatCents} />
        </div>
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Stock que salió (ventas)
          </h3>
          <div className="mt-3">
            <StockOutTable lines={live.stockOutLines} />
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Cerrar caja
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          Contá el efectivo físico del cajón e ingresalo acá. El sistema compara contra el esperado
          y deja la diferencia registrada.
        </p>
        <form action={closeCashRegisterSession} className="mt-6 space-y-5">
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
              rows={3}
              placeholder="Ej. Faltante por cambio mal entregado"
              className={`${productInputClass} mt-2 resize-none`}
            />
          </div>

          <AdminFormSubmitButton pendingLabel="Cerrando…">
            Confirmar cierre de caja
          </AdminFormSubmitButton>
        </form>
      </section>
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
