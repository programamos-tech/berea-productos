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
      return "Efectivo";
    case "transferencia":
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
      onSubmit={(e) => {
        if (floatCents !== 0) return;
        const ok = window.confirm(
          "El fondo inicial está en $0.\n\n¿Estás segura de que la caja va a comenzar en 0?",
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="submission_id" value={submissionId} />
      <div className="min-w-0 md:col-span-1">
        <div className="flex items-center gap-2">
          <PiggyBank className={`h-5 w-5 ${accentIcon.brand}`} aria-hidden />
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Abrir caja · {businessDayLabel}
          </h2>
        </div>
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

/** Cierre: conteo a ciegas → revisar (revela esperado) → confirmar. */
export function CashRegisterClosePanel({
  sessionId,
  businessDayLabel,
  blind,
  live,
  openingFloatCents,
}: {
  sessionId: string;
  businessDayLabel: string;
  blind: CashDayBlindSummary;
  live: CashDayLiveTotals;
  openingFloatCents: number;
}) {
  const [phase, setPhase] = useState<"count" | "review">("count");
  const [countedCents, setCountedCents] = useState(0);
  const [notes, setNotes] = useState("");
  const [submissionId] = useState(newSubmissionId);

  const expected = live.expectedCashCents;
  const diff = countedCents - expected;
  const needsNote = diff !== 0;
  const mixedOther =
    live.salesMixedCents + live.salesOtherCents;

  const moneyRows: Array<{
    label: string;
    value: number | null;
    kind: MoneyToneKey;
  }> = [
    { label: "Fondo inicial", value: openingFloatCents, kind: "fondo" },
    { label: "Ventas total", value: live.salesTotalCents, kind: "ventas" },
    { label: "Ventas efectivo", value: live.salesCashCents, kind: "efectivo" },
    {
      label: "Ventas transferencia",
      value: live.salesTransferCents,
      kind: "transfer",
    },
    {
      label: "Ventas mixtas / otras",
      value: mixedOther > 0 ? mixedOther : null,
      kind: "mixtas",
    },
    { label: "Egresos efectivo", value: live.expensesCashCents, kind: "egreso" },
    {
      label: "Egresos otros",
      value: live.expensesOtherCents > 0 ? live.expensesOtherCents : null,
      kind: "egreso",
    },
    { label: "Efectivo esperado", value: expected, kind: "esperado" },
    { label: "Efectivo contado", value: countedCents, kind: "contado" },
  ];

  if (phase === "review") {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">
          <p className="font-semibold">Cierre revelado — resumen completo</p>
          <p className="mt-1 opacity-90">
            Acá ves lo mismo que administración: esperado, diferencia y todos los totales.
            Revisá y confirmá para congelar el cierre.
          </p>
        </div>

        <CashDiscrepancyBanner
          diff={diff}
          unitsSold={blind.unitsSold}
          expenseCount={live.expenseLines.length}
          notes={notes.trim() || null}
        />

        <CashClosedMoneyGrid rows={moneyRows} />

        <div className="grid gap-5 lg:grid-cols-2">
          <CashStockOutReadonly
            lines={blind.stockOutLines}
            unitsSold={blind.unitsSold}
          />
          <CashExpensesReadonly lines={live.expenseLines} />
        </div>

        <section className={cardClass}>
          <SectionTitle
            icon={Wallet}
            accent="ok"
            hint="Si no cuadra, la nota es obligatoria antes de confirmar."
          >
            Confirmar cierre · {businessDayLabel}
          </SectionTitle>
          <form action={closeCashRegisterSession} className="mt-4 space-y-4">
            <input type="hidden" name="session_id" value={sessionId} />
            <input type="hidden" name="submission_id" value={submissionId} />
            <input type="hidden" name="counted_cash_cents" value={countedCents} />

            <div>
              <label htmlFor="caja-notes-review" className={labelClass}>
                Nota / motivo{needsNote ? " (obligatoria)" : " (opcional)"}
              </label>
              <textarea
                id="caja-notes-review"
                name="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required={needsNote}
                placeholder="Obligatoria si no cuadra (ej. cambio mal entregado)"
                className={`${productInputClass} mt-2 resize-none`}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <AdminFormSubmitButton
                pendingLabel="Cerrando…"
                className={`${adminPrimarySubmitButtonClass} w-full px-6 sm:flex-1`}
                disabled={needsNote && notes.trim().length === 0}
              >
                Confirmar y congelar cierre
              </AdminFormSubmitButton>
              <button
                type="button"
                onClick={() => setPhase("count")}
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 sm:w-auto dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Volver a contar
              </button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className={cardClass}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Actividad del día · {businessDayLabel}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
              Contá el efectivo{" "}
              <span className="font-medium text-zinc-800 dark:text-zinc-100">sin ver el
              esperado</span>
              . Al revisar se revela el resumen completo (igual que administración).
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard
            label="Facturas"
            value={String(blind.salesCount)}
            icon={Receipt}
            accent="info"
          />
          <MetricCard
            label="Unidades vendidas"
            value={String(blind.unitsSold)}
            icon={Package}
            accent="brand"
            emphasize
          />
          <MetricCard
            label="Productos distintos"
            value={String(blind.stockOutLines.length)}
            icon={ShoppingBag}
          />
          <MetricCard
            label="Egresos"
            value={String(blind.expenseLines.length)}
            icon={ArrowDownLeft}
            accent="warn"
          />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)_minmax(300px,380px)] xl:items-start">
        <section className={cardClass}>
          <SectionTitle
            icon={Package}
            accent="brand"
            hint="Listado de lo que salió por ventas hoy — revisalo antes de cerrar."
          >
            Lo vendido hoy · {blind.unitsSold} ud
          </SectionTitle>
          <div className="mt-4">
            <StockOutTable lines={blind.stockOutLines} />
          </div>
        </section>

        <section className={cardClass}>
          <SectionTitle
            icon={ArrowDownLeft}
            accent="warn"
            hint="Conceptos del día (montos al revelar)."
          >
            Egresos · {blind.expenseLines.length}
          </SectionTitle>
          <div className="mt-4">
            <ExpensesTable lines={blind.expenseLines} hideAmounts />
          </div>
        </section>

        <section className={cardClass}>
          <SectionTitle
            icon={Wallet}
            accent="ok"
            hint="Contá billetes y monedas. Después ves el esperado y la diferencia."
          >
            Contar efectivo
          </SectionTitle>
          <div className="mt-4 space-y-4">
            <div>
              <span className={labelClass}>Efectivo contado en caja</span>
              <div className="mt-2">
                <ProductMoneyInput
                  name="counted_cash_cents_ui"
                  value={countedCents}
                  onChange={setCountedCents}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-300">
              <Scale className={`mt-0.5 h-4 w-4 shrink-0 ${accentIcon.neutral}`} aria-hidden />
              <span>
                Todavía no se cierra. Al revisar vas a ver esperado, diferencia y todos los
                totales.
              </span>
            </div>

            <div>
              <label htmlFor="caja-notes" className={labelClass}>
                Nota / motivo (opcional por ahora)
              </label>
              <textarea
                id="caja-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Si ya sabés un motivo, podés anotarlo"
                className={`${productInputClass} mt-2 resize-none`}
              />
            </div>

            <button
              type="button"
              onClick={() => setPhase("review")}
              className={`${adminPrimarySubmitButtonFullWidthClass}`}
            >
              Revisar cierre (revelar totales)
            </button>
          </div>
        </section>
      </div>
    </div>
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
}: {
  rows: Array<{
    label: string;
    value: number | null;
    kind: MoneyToneKey;
  }>;
  notes?: string | null;
}) {
  return (
    <section className={cardClass}>
      <SectionTitle icon={ClipboardList} hint="Totales congelados al cerrar.">
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
