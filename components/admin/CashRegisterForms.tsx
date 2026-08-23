"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowDownLeft,
  Banknote,
  CheckCircle2,
  ClipboardList,
  Package,
  PiggyBank,
  Receipt,
  Scale,
  ShoppingBag,
  Wallet,
} from "lucide-react";
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
import { StaticCopCents } from "@/components/admin/ReportsAnimatedFigures";
import type {
  CashDayBlindSummary,
  CashExpenseLine,
  CashStockOutLine,
} from "@/lib/cash-register";
import { adminButtonCancelClass } from "@/lib/admin-ui";
import { formatCop } from "@/lib/money";

function newSubmissionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `caja_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

const cardClass =
  "rounded-xl border border-zinc-200/90 bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 sm:p-5 dark:border-zinc-700/90 dark:bg-zinc-900 dark:shadow-none dark:ring-white/[0.06]";

const metricShell =
  "rounded-lg border border-zinc-200/80 bg-zinc-50/60 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950/40";

/** Acento solo en el ícono — fondos siempre neutros. */
type Accent = "neutral" | "brand" | "ok" | "warn" | "info";

const accentIcon: Record<Accent, string> = {
  neutral: "text-zinc-500 dark:text-zinc-400",
  brand: "text-rose-800/70 dark:text-rose-300/80",
  ok: "text-emerald-700/80 dark:text-emerald-400/80",
  warn: "text-amber-700/75 dark:text-amber-400/75",
  info: "text-sky-700/75 dark:text-sky-400/75",
};

function paymentLabel(pm: string) {
  switch (pm) {
    case "efectivo":
    case "cash":
      return "Efectivo";
    case "transferencia":
    case "transfer":
      return "Transferencia";
    case "tarjeta":
      return "Tarjeta";
    default:
      return pm || "Otro";
  }
}

function MetricCard({
  label,
  value,
  icon: Icon,
  accent = "neutral",
  emphasize,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: Accent;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`${metricShell} ${
        emphasize ? "ring-1 ring-rose-900/10 dark:ring-rose-100/10" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 shrink-0 ${accentIcon[accent]}`} aria-hidden />
        <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
      </div>
      <p className="mt-1.5 text-lg font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  accent = "neutral",
  children,
  hint,
}: {
  icon: LucideIcon;
  accent?: Accent;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950/50">
        <Icon className={`h-4 w-4 ${accentIcon[accent]}`} aria-hidden />
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {children}
        </h3>
        {hint ? (
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

export function CashRegisterOpenForm() {
  const [floatCents, setFloatCents] = useState(0);
  const [submissionId] = useState(newSubmissionId);

  return (
    <form
      action={openCashRegisterSession}
      className="grid gap-5"
      onSubmit={(e) => {
        if (floatCents !== 0) return;
        const ok = window.confirm(
          "El fondo inicial está en $0.\n\n¿Estás segura de que la caja va a comenzar en 0?",
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="submission_id" value={submissionId} />
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
        Ingresá el fondo inicial. Al cerrar, la vendedora cuenta el efectivo a
        ciegas; el sistema compara solo después de confirmar.
      </p>
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
        className={`${adminPrimarySubmitButtonClass} w-full px-6`}
      >
        Abrir caja del día
      </AdminFormSubmitButton>
    </form>
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
    <div className="max-h-80 overflow-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="sticky top-0 bg-white/95 backdrop-blur dark:bg-zinc-900/95">
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
        <thead className="sticky top-0 bg-white/95 backdrop-blur dark:bg-zinc-900/95">
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

/** Cierre a ciegas: resumen del turno + conteo; esperado solo tras cerrar. */
export function CashRegisterClosePanel({
  sessionId,
  businessDayLabel,
  openedAtLabel,
  openedByLabel,
  blind,
  errorBanner,
  onDismiss,
}: {
  sessionId: string;
  businessDayLabel: string;
  openedAtLabel?: string | null;
  openedByLabel?: string | null;
  blind: CashDayBlindSummary;
  errorBanner?: string | null;
  onDismiss?: () => void;
}) {
  const [countedCents, setCountedCents] = useState(0);
  const [notes, setNotes] = useState("");
  const [submissionId] = useState(newSubmissionId);

  const subtitleParts = [
    "Turno abierto",
    openedAtLabel || businessDayLabel,
    openedByLabel || null,
  ].filter(Boolean);

  const moneyInRows: { label: string; cents: number }[] = [
    { label: "Efectivo", cents: blind.salesCashCents },
    { label: "Transferencia", cents: blind.salesTransferCents },
    { label: "Mixto", cents: blind.salesMixedCents },
    { label: "Otros / web", cents: blind.salesOtherCents },
  ].filter((r) => r.cents > 0);

  const moneyOutRows: { label: string; cents: number }[] = [
    { label: "En efectivo", cents: blind.expensesCashCents },
    { label: "Otros medios", cents: blind.expensesOtherCents },
  ].filter((r) => r.cents > 0);

  const cashDrawerExpenses = blind.expenseLines.filter((l) => l.affects_cash_drawer);
  const turnNet = blind.turnCashNetCents;

  return (
    <form
      action={closeCashRegisterSession}
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(e) => {
        if (countedCents !== 0) return;
        const ok = window.confirm(
          "El efectivo contado está en $0.\n\n¿Cerrás la caja en 0? El resultado (esperado y diferencia) se ve después, ya cerrada.",
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="submission_id" value={submissionId} />

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
        {errorBanner ? (
          <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/35 dark:text-red-100">
            {errorBanner}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
            Caja abierta
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {subtitleParts.join(" · ")}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-200/90 bg-zinc-50/80 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950/50">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Fondo inicial
            </p>
            <p className="mt-1 text-base font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
              {formatCop(blind.openingFloatCents)}
            </p>
            <p className="mt-1 text-[10px] leading-snug text-zinc-500 dark:text-zinc-400">
              Ya estaba al abrir
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-3 py-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/30">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
              Cobros en efectivo
            </p>
            <p className="mt-1 text-base font-semibold tabular-nums text-emerald-900 dark:text-emerald-100">
              {formatCop(blind.salesCashCents)}
            </p>
          </div>
          <div className="rounded-xl border border-rose-200/70 bg-rose-50/70 px-3 py-2.5 dark:border-rose-900/40 dark:bg-rose-950/30">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-800 dark:text-rose-200">
              Egresos en efectivo
            </p>
            <p className="mt-1 text-base font-semibold tabular-nums text-rose-900 dark:text-rose-100">
              {formatCop(blind.expensesCashCents)}
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-sky-200/70 bg-sky-50/70 px-3 py-2.5 dark:border-sky-900/40 dark:bg-sky-950/30">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-800 dark:text-sky-200">
              Neto del turno en efectivo
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-sky-950 dark:text-sky-100">
              {formatCop(turnNet)}
            </p>
            <p className="mt-1 text-[11px] font-medium leading-snug text-sky-900/80 dark:text-sky-100/80">
              {formatCop(blind.salesCashCents)} − {formatCop(blind.expensesCashCents)}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200/90 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Total en gaveta (al contar)
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
              {formatCop(blind.expectedCashCents)}
            </p>
            <p className="mt-1 text-[11px] font-medium leading-snug text-zinc-600 dark:text-zinc-300">
              {formatCop(blind.openingFloatCents)} + {formatCop(turnNet)}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <section className="rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
                Entra dinero
              </h3>
              <p className="text-sm font-semibold tabular-nums text-emerald-900 dark:text-emerald-100">
                {formatCop(blind.salesTotalCents)}
              </p>
            </div>
            <ul className="mt-2.5 space-y-1.5">
              {moneyInRows.length === 0 ? (
                <li className="text-xs text-emerald-800/70 dark:text-emerald-200/70">
                  Sin cobros registrados hoy.
                </li>
              ) : (
                moneyInRows.map((r) => (
                  <li
                    key={r.label}
                    className="flex items-center justify-between gap-2 text-xs text-emerald-950 dark:text-emerald-100"
                  >
                    <span>{r.label}</span>
                    <span className="font-medium tabular-nums">
                      {formatCop(r.cents)}
                    </span>
                  </li>
                ))
              )}
            </ul>
            <p className="mt-3 border-t border-emerald-200/60 pt-2 text-[11px] text-emerald-800/80 dark:border-emerald-900/40 dark:text-emerald-200/80">
              Ventas cobradas: {blind.salesCount}
            </p>
          </section>

          <section className="rounded-xl border border-rose-200/60 bg-rose-50/40 p-3.5 dark:border-rose-900/40 dark:bg-rose-950/20">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-rose-800 dark:text-rose-200">
                Sale dinero
              </h3>
              <p className="text-sm font-semibold tabular-nums text-rose-900 dark:text-rose-100">
                {formatCop(blind.expensesTotalCents)}
              </p>
            </div>
            <ul className="mt-2.5 space-y-1.5">
              {moneyOutRows.length === 0 ? (
                <li className="text-xs text-rose-800/70 dark:text-rose-200/70">
                  Sin egresos de caja del turno.
                </li>
              ) : (
                moneyOutRows.map((r) => (
                  <li
                    key={r.label}
                    className="flex items-center justify-between gap-2 text-xs text-rose-950 dark:text-rose-100"
                  >
                    <span>{r.label}</span>
                    <span className="font-medium tabular-nums">
                      {formatCop(r.cents)}
                    </span>
                  </li>
                ))
              )}
            </ul>
            {cashDrawerExpenses.length > 0 ? (
              <ul className="mt-2 space-y-1 border-t border-rose-200/60 pt-2 dark:border-rose-900/40">
                {cashDrawerExpenses.map((line) => (
                  <li
                    key={line.id}
                    className="flex items-start justify-between gap-2 text-[11px] text-rose-950/90 dark:text-rose-100/90"
                  >
                    <span className="min-w-0 truncate">{line.concept}</span>
                    <span className="shrink-0 font-medium tabular-nums">
                      {formatCop(line.amount_cents)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          <p className="mt-3 border-t border-rose-200/60 pt-2 text-[11px] text-rose-800/80 dark:border-rose-900/40 dark:text-rose-200/80">
            Movimientos: {blind.expenseLines.length}
            {blind.expensesOtherCents > 0
              ? " · otros medios no restan del efectivo"
              : null}
          </p>
          </section>

          <section className="rounded-xl border border-zinc-200/90 bg-zinc-50/50 p-3.5 dark:border-zinc-700 dark:bg-zinc-950/40">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Contar efectivo
            </h3>
            <div className="mt-2">
              <ProductMoneyInput
                name="counted_cash_cents"
                value={countedCents}
                onChange={setCountedCents}
                required
              />
            </div>
            <p className="mt-2 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
              Contá todo el efectivo en la gaveta (fondo + neto del turno ≈{" "}
              {formatCop(blind.expectedCashCents)}).
            </p>
            <label htmlFor="caja-notes" className={`${labelClass} mt-3 block`}>
              Nota / motivo (obligatoria si no cuadra)
            </label>
            <textarea
              id="caja-notes"
              name="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Si ya sabés un motivo, anotalo ahora…"
              className={`${productInputClass} mt-1.5 resize-none`}
            />
          </section>
        </div>
      </div>

      <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-zinc-100 bg-zinc-50/80 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <button
          type="button"
          onClick={onDismiss}
          className={`${adminButtonCancelClass} w-full sm:w-auto`}
        >
          Cerrar
        </button>
        <AdminFormSubmitButton
          pendingLabel="Cerrando…"
          className={`w-full px-5 py-2.5 sm:w-auto ${adminPrimarySubmitButtonClass}`}
        >
          Cerrar caja
        </AdminFormSubmitButton>
      </div>
    </form>
  );
}

export function CashStockOutReadonly({
  lines,
  unitsSold,
}: {
  lines: CashStockOutLine[];
  unitsSold?: number | null;
}) {
  const ud =
    unitsSold != null
      ? unitsSold
      : lines.reduce((s, l) => s + l.quantity, 0);
  return (
    <section className={cardClass}>
      <SectionTitle icon={Package} accent="brand" hint="Productos que salieron por ventas.">
        Lo vendido ese día · {ud} ud
      </SectionTitle>
      <div className="mt-4">
        <StockOutTable lines={lines} />
      </div>
    </section>
  );
}

export function CashExpensesReadonly({ lines }: { lines: CashExpenseLine[] }) {
  const total = lines.reduce((s, l) => s + l.amount_cents, 0);
  return (
    <section className={cardClass}>
      <SectionTitle
        icon={ArrowDownLeft}
        accent="warn"
        hint={lines.length === 0 ? undefined : `${lines.length} movimientos`}
      >
        Egresos del día · {formatCop(total)}
      </SectionTitle>
      <div className="mt-4">
        <ExpensesTable lines={lines} />
      </div>
    </section>
  );
}

type MoneyToneKey =
  | "fondo"
  | "ventas"
  | "efectivo"
  | "transfer"
  | "mixtas"
  | "egreso"
  | "esperado"
  | "contado";

const moneyToneMeta: Record<
  MoneyToneKey,
  { accent: Accent; icon: LucideIcon; emphasize?: boolean }
> = {
  fondo: { accent: "neutral", icon: PiggyBank },
  ventas: { accent: "brand", icon: ShoppingBag },
  efectivo: { accent: "ok", icon: Banknote },
  transfer: { accent: "info", icon: Receipt },
  mixtas: { accent: "neutral", icon: ClipboardList },
  egreso: { accent: "warn", icon: ArrowDownLeft },
  esperado: { accent: "brand", icon: Scale, emphasize: true },
  contado: { accent: "ok", icon: Wallet, emphasize: true },
};

export function CashClosedMoneyGrid({
  rows,
  notes,
  hint = "Totales congelados al cerrar.",
}: {
  rows: Array<{
    label: string;
    value: number | null;
    kind: MoneyToneKey;
  }>;
  notes?: string | null;
  hint?: string;
}) {
  return (
    <section className={cardClass}>
      <SectionTitle icon={ClipboardList} hint={hint}>
        Resumen monetario
      </SectionTitle>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {rows.map((r) => {
          const meta = moneyToneMeta[r.kind];
          const Icon = meta.icon;
          return (
            <div
              key={r.label}
              className={`${metricShell} ${
                meta.emphasize
                  ? "ring-1 ring-rose-900/10 dark:ring-rose-100/10"
                  : ""
              }`}
            >
              <dt className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <Icon
                  className={`h-3.5 w-3.5 ${accentIcon[meta.accent]}`}
                  aria-hidden
                />
                {r.label}
              </dt>
              <dd className="mt-1.5 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {r.value == null ? "—" : <StaticCopCents cents={r.value} />}
              </dd>
            </div>
          );
        })}
      </dl>
      {notes ? (
        <p className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-300">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">Notas: </span>
          {notes}
        </p>
      ) : null}
    </section>
  );
}

export function CashDiscrepancyBanner({
  diff,
  unitsSold,
  expenseCount,
  notes,
}: {
  diff: number;
  unitsSold?: number | null;
  expenseCount?: number;
  notes?: string | null;
}) {
  const ok = diff === 0;
  const surplus = diff > 0;
  const Icon = ok || surplus ? CheckCircle2 : AlertTriangle;
  return (
    <div
      className={`flex gap-3 rounded-xl border px-4 py-3 text-sm ${
        ok || surplus
          ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100"
          : "border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100"
      }`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div>
        <p className="font-medium">
          {ok
            ? "La caja cuadró."
            : surplus
              ? `Discrepancia: sobrante ${formatCop(diff)}`
              : `Discrepancia: faltante ${formatCop(Math.abs(diff))}`}
          {unitsSold != null ? (
            <span className="ml-2 font-normal opacity-80">· {unitsSold} ud vendidas</span>
          ) : null}
          {expenseCount && expenseCount > 0 ? (
            <span className="ml-2 font-normal opacity-80">· {expenseCount} egresos</span>
          ) : null}
        </p>
        {notes ? (
          <p className="mt-1.5 opacity-90">
            <span className="font-medium">Nota: </span>
            {notes}
          </p>
        ) : null}
      </div>
    </div>
  );
}
