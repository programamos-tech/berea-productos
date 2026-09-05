"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowDownLeft,
  Banknote,
  PiggyBank,
  Receipt,
  Scale,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import {
  adminButtonCancelClass,
  adminCashNegativeTextClass,
  adminCashOkTextClass,
} from "@/lib/admin-ui";
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
  brand: "text-zinc-500 dark:text-zinc-400",
  ok: "text-zinc-500 dark:text-zinc-400",
  warn: "text-zinc-500 dark:text-zinc-400",
  info: "text-zinc-500 dark:text-zinc-400",
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
        emphasize ? "ring-1 ring-red-900/10 dark:ring-red-100/10" : ""
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

export function CashRegisterOpenForm({
  suggestedOpeningFloatCents = 0,
}: {
  suggestedOpeningFloatCents?: number;
}) {
  const [floatCents, setFloatCents] = useState(
    Math.max(0, Math.floor(suggestedOpeningFloatCents)),
  );
  const [submissionId] = useState(newSubmissionId);

  useEffect(() => {
    setFloatCents(Math.max(0, Math.floor(suggestedOpeningFloatCents)));
  }, [suggestedOpeningFloatCents]);

  return (
    <form
      action={openCashRegisterSession}
      className="grid gap-5"
      onSubmit={(e) => {
        if (floatCents !== 0) return;
        const ok = window.confirm(
          "El arrastre está en $0.\n\n¿Abrir caja en 0? (El cambio de $100.000 no se carga acá.)",
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="submission_id" value={submissionId} />
      <p className="text-sm leading-snug text-zinc-600 dark:text-zinc-300">
        Confirmá el arrastre del cierre anterior. El cambio de $100.000 no se
        carga acá.
      </p>
      <div>
        <span className={labelClass}>Efectivo del día anterior</span>
        <div className="mt-2">
          <ProductMoneyInput
            name="opening_float_cents"
            value={floatCents}
            onChange={setFloatCents}
            required
          />
        </div>
        {suggestedOpeningFloatCents > 0 ? (
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            Último cierre: {formatCop(suggestedOpeningFloatCents)}
          </p>
        ) : null}
      </div>
      <AdminFormSubmitButton
        pendingLabel="Abriendo…"
        className={`${adminPrimarySubmitButtonClass} w-full px-6`}
      >
        Abrir caja
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
    <table className="min-w-full text-left text-sm">
      <thead>
        <tr className="border-b border-zinc-200/70 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:border-zinc-800">
          <th className="pb-2 pr-3 font-semibold">Productos</th>
          <th className="pb-2 pr-3 font-semibold">Ref</th>
          <th className="pb-2 pr-3 text-right font-semibold">Ud</th>
          <th className="pb-2 text-right font-semibold">Stock</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((l) => (
          <tr
            key={l.product_id}
            className="border-b border-zinc-100/80 last:border-0 dark:border-zinc-800/80"
          >
            <td className="py-2 pr-3 text-zinc-900 dark:text-zinc-100">{l.name}</td>
            <td className="py-2 pr-3 font-mono text-xs text-zinc-500">
              {l.reference ?? "—"}
            </td>
            <td className="py-2 pr-3 text-right tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
              {l.quantity}
            </td>
            <td className="py-2 text-right tabular-nums text-zinc-600 dark:text-zinc-300">
              {l.stock_remaining == null ? "—" : l.stock_remaining}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
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
    <table className="min-w-full text-left text-sm">
      <thead>
        <tr className="border-b border-zinc-200/70 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:border-zinc-800">
          <th className="pb-2 pr-3 font-semibold">Conceptos</th>
          <th className="pb-2 pr-3 font-semibold">Medio</th>
          {hideAmounts ? null : (
            <th className="pb-2 text-right font-semibold">Monto</th>
          )}
        </tr>
      </thead>
      <tbody>
        {lines.map((l) => (
          <tr
            key={l.id}
            className="border-b border-zinc-100/80 last:border-0 dark:border-zinc-800/80"
          >
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
  preview = false,
}: {
  sessionId: string;
  businessDayLabel: string;
  openedAtLabel?: string | null;
  openedByLabel?: string | null;
  blind: CashDayBlindSummary;
  errorBanner?: string | null;
  onDismiss?: () => void;
  /** Solo UI: no envía el cierre. */
  preview?: boolean;
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

  const cashDrawerExpenses = blind.expenseLines.filter(
    (l) => l.affects_cash_drawer,
  );

  const metricRows: {
    label: string;
    value: number;
    icon: LucideIcon;
  }[] = [
    {
      label: "Efectivo día anterior",
      value: blind.openingFloatCents,
      icon: PiggyBank,
    },
    {
      label: "Cobros efectivo",
      value: blind.salesCashCents,
      icon: Banknote,
    },
    {
      label: "Transferencias",
      value: blind.salesTransferCents,
      icon: Receipt,
    },
    {
      label: "Egresos efectivo",
      value: blind.expensesCashCents,
      icon: ArrowDownLeft,
    },
    {
      label: "Efectivo esperado",
      value: blind.expectedCashCents,
      icon: Scale,
    },
  ];

  return (
    <form
      action={preview ? undefined : closeCashRegisterSession}
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(e) => {
        if (preview) {
          e.preventDefault();
          return;
        }
        if (countedCents !== 0) return;
        const ok = window.confirm(
          "El efectivo contado está en $0.\n\n¿Cerrás la caja en 0? El resultado (esperado y diferencia) se ve después, ya cerrada.",
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="submission_id" value={submissionId} />

      <div className="admin-panel-scroll min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5 sm:px-8 sm:py-6">
        {errorBanner ? (
          <p className="text-sm text-red-700 dark:text-red-400">{errorBanner}</p>
        ) : null}

        {preview ? (
          <p className="text-sm text-zinc-500">
            Vista previa del modal · el cierre real de hoy no se modifica.
          </p>
        ) : (
          <p className="text-sm text-zinc-500">{subtitleParts.join(" · ")}</p>
        )}

        <dl className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
          {metricRows.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.label} className="min-w-0">
                <dt className="inline-flex min-w-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  <Icon
                    className="size-3.5 shrink-0 text-zinc-500 dark:text-zinc-400"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  <span className="truncate">{r.label}</span>
                </dt>
                <dd className="mt-1.5 text-xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
                  {formatCop(r.value)}
                </dd>
              </div>
            );
          })}
        </dl>

        <div className="grid gap-8 border-t border-zinc-200/70 pt-5 dark:border-zinc-800 md:grid-cols-3 md:gap-x-10">
          <section className="min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Ingresos del día
              </h3>
              <p className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {formatCop(blind.salesTotalCents)}
              </p>
            </div>
            <ul className="mt-4 space-y-2.5">
              {moneyInRows.length === 0 ? (
                <li className="text-xs text-zinc-500">Sin cobros registrados hoy.</li>
              ) : (
                moneyInRows.map((r) => (
                  <li
                    key={r.label}
                    className="flex items-center justify-between gap-2 text-sm text-zinc-800 dark:text-zinc-200"
                  >
                    <span>{r.label}</span>
                    <span className="font-medium tabular-nums">
                      {formatCop(r.cents)}
                    </span>
                  </li>
                ))
              )}
            </ul>
            <p className="mt-4 text-[11px] text-zinc-500">
              Se realizaron {blind.salesCount} venta
              {blind.salesCount === 1 ? "" : "s"}
            </p>
          </section>

          <section className="min-w-0 md:border-l md:border-zinc-200/70 md:pl-8 dark:md:border-zinc-800">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Egresos del día
              </h3>
              <p className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {formatCop(blind.expensesTotalCents)}
              </p>
            </div>
            <ul className="mt-4 space-y-2.5">
              {moneyOutRows.length === 0 ? (
                <li className="text-xs text-zinc-500">Sin egresos del turno.</li>
              ) : (
                moneyOutRows.map((r) => (
                  <li
                    key={r.label}
                    className="flex items-center justify-between gap-2 text-sm text-zinc-800 dark:text-zinc-200"
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
              <ul className="mt-4 space-y-2 border-t border-zinc-200/70 pt-4 dark:border-zinc-800">
                {cashDrawerExpenses.map((line) => (
                  <li
                    key={line.id}
                    className="flex items-start justify-between gap-3 text-[12px] text-zinc-600 dark:text-zinc-300"
                  >
                    <span className="min-w-0 break-words">{line.concept}</span>
                    <span className="shrink-0 font-medium tabular-nums">
                      {formatCop(line.amount_cents)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="min-w-0 md:border-l md:border-zinc-200/70 md:pl-8 dark:md:border-zinc-800">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Ingresa efectivo contado
            </h3>
            <div className="mt-4">
              <ProductMoneyInput
                name="counted_cash_cents"
                value={countedCents}
                onChange={setCountedCents}
                required={!preview}
                disabled={preview}
              />
            </div>
            <label htmlFor="caja-notes" className={`${labelClass} mt-5 block`}>
              Nota del cierre (obligatoria)
            </label>
            <textarea
              id="caja-notes"
              name="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Resumen del día, novedades o motivo si no cuadra…"
              required={!preview}
              disabled={preview}
              className={`${productInputClass} mt-1.5 resize-none`}
            />
          </section>
        </div>
      </div>

      <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-zinc-200/70 px-6 py-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <button
          type="button"
          onClick={onDismiss}
          className={`${adminButtonCancelClass} w-full sm:w-auto`}
        >
          {preview ? "Cerrar vista" : "Cerrar"}
        </button>
        {preview ? (
          <span className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-500 dark:border-zinc-700 sm:w-auto">
            Solo vista previa
          </span>
        ) : (
          <AdminFormSubmitButton
            pendingLabel="Cerrando…"
            className={`w-full px-5 py-2.5 sm:w-auto ${adminPrimarySubmitButtonClass}`}
          >
            Cerrar caja
          </AdminFormSubmitButton>
        )}
      </div>
    </form>
  );
}

export function CashStockOutReadonly({
  lines,
}: {
  lines: CashStockOutLine[];
}) {
  return (
    <section className="min-h-0">
      <div className="admin-panel-scroll max-h-80 overflow-y-auto">
        <StockOutTable lines={lines} />
      </div>
    </section>
  );
}

export function CashExpensesReadonly({ lines }: { lines: CashExpenseLine[] }) {
  return (
    <section className="min-h-0">
      <div className="admin-panel-scroll max-h-72 overflow-y-auto">
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
  egreso: { accent: "warn", icon: ArrowDownLeft },
  esperado: { accent: "brand", icon: Scale, emphasize: true },
  contado: { accent: "ok", icon: Wallet, emphasize: true },
};

export function CashClosedMoneyGrid({
  rows,
  notes,
  cashDifferenceCents,
}: {
  rows: Array<{
    label: string;
    value: number | null;
    kind: MoneyToneKey;
  }>;
  notes?: string | null;
  /** Diferencia contado − esperado: colorea “Efectivo contado”. */
  cashDifferenceCents?: number | null;
  hint?: string;
}) {
  return (
    <div>
      <dl className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4 xl:grid-cols-7">
        {rows.map((r) => {
          const meta = moneyToneMeta[r.kind];
          const Icon = meta.icon;
          const contadoTone =
            r.kind === "contado" && cashDifferenceCents != null
              ? cashDifferenceCents < 0
                ? adminCashNegativeTextClass
                : adminCashOkTextClass
              : "text-zinc-900 dark:text-zinc-50";
          return (
            <div key={r.label} className="min-w-0">
              <dt className="inline-flex min-w-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                <Icon
                  className={`size-3.5 shrink-0 ${accentIcon[meta.accent]}`}
                  strokeWidth={2.25}
                  aria-hidden
                />
                <span className="truncate">{r.label}</span>
              </dt>
              <dd
                className={`mt-1 text-xl font-semibold tabular-nums tracking-tight sm:text-2xl ${contadoTone}`}
              >
                {r.value == null ? "—" : <StaticCopCents cents={r.value} />}
              </dd>
            </div>
          );
        })}
      </dl>
      {notes ? (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            Nota:{" "}
          </span>
          {notes}
        </p>
      ) : null}
    </div>
  );
}

export function CashDiscrepancyBanner({
  diff,
  notes,
}: {
  diff: number;
  notes?: string | null;
}) {
  const ok = diff === 0;
  const surplus = diff > 0;
  const note = String(notes ?? "").trim();
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
      <p
        className={`shrink-0 font-medium ${
          ok || surplus ? adminCashOkTextClass : adminCashNegativeTextClass
        }`}
      >
        {ok
          ? "La caja cuadró"
          : surplus
            ? `Sobrante ${formatCop(diff)}`
            : `Faltante ${formatCop(Math.abs(diff))}`}
      </p>
      {note ? (
        <p className="min-w-0 text-zinc-600 dark:text-zinc-400">
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            Nota:
          </span>{" "}
          {note}
        </p>
      ) : null}
    </div>
  );
}
