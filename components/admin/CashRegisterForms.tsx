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
import { formatCop } from "@/lib/money";

function newSubmissionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `caja_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

const cardClass =
  "rounded-xl border border-zinc-200/90 bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 sm:p-5 dark:border-zinc-700/90 dark:bg-zinc-900 dark:shadow-none dark:ring-white/[0.06]";

type Tone = "rose" | "emerald" | "amber" | "sky" | "violet" | "zinc";

const toneBox: Record<Tone, string> = {
  rose: "border-rose-200/80 bg-rose-50/80 dark:border-rose-900/40 dark:bg-rose-950/25",
  emerald:
    "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-900/40 dark:bg-emerald-950/25",
  amber:
    "border-amber-200/80 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/25",
  sky: "border-sky-200/80 bg-sky-50/80 dark:border-sky-900/40 dark:bg-sky-950/25",
  violet:
    "border-violet-200/80 bg-violet-50/70 dark:border-violet-900/40 dark:bg-violet-950/25",
  zinc: "border-zinc-200/80 bg-zinc-50/80 dark:border-zinc-700 dark:bg-zinc-950/50",
};

const toneIcon: Record<Tone, string> = {
  rose: "text-rose-700 dark:text-rose-300",
  emerald: "text-emerald-700 dark:text-emerald-300",
  amber: "text-amber-700 dark:text-amber-300",
  sky: "text-sky-700 dark:text-sky-300",
  violet: "text-violet-700 dark:text-violet-300",
  zinc: "text-zinc-500 dark:text-zinc-400",
};

const toneLabel: Record<Tone, string> = {
  rose: "text-rose-800/80 dark:text-rose-200/80",
  emerald: "text-emerald-800/80 dark:text-emerald-200/80",
  amber: "text-amber-900/80 dark:text-amber-200/80",
  sky: "text-sky-800/80 dark:text-sky-200/80",
  violet: "text-violet-800/80 dark:text-violet-200/80",
  zinc: "text-zinc-500 dark:text-zinc-400",
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
  tone = "zinc",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div className={`rounded-xl border px-3 py-3 ${toneBox[tone]}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 shrink-0 ${toneIcon[tone]}`} aria-hidden />
        <p className={`text-[11px] font-medium ${toneLabel[tone]}`}>{label}</p>
      </div>
      <p className="mt-1.5 text-lg font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  tone,
  children,
  hint,
}: {
  icon: LucideIcon;
  tone: Tone;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${toneBox[tone]}`}
      >
        <Icon className={`h-4 w-4 ${toneIcon[tone]}`} aria-hidden />
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
    >
      <input type="hidden" name="submission_id" value={submissionId} />
      <div className="min-w-0 md:col-span-1">
        <div className="flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-rose-700 dark:text-rose-300" aria-hidden />
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
              <td className="py-2 text-right tabular-nums font-semibold text-rose-800 dark:text-rose-200">
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
                <td className="py-2 text-right tabular-nums font-medium text-amber-900 dark:text-amber-100">
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
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Actividad del día · {businessDayLabel}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
              Acá ves <span className="font-medium text-zinc-800 dark:text-zinc-100">qué
              vendiste</span> (productos y unidades). Los montos de efectivo se revelan recién al
              confirmar el cierre.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard
            label="Facturas"
            value={String(blind.salesCount)}
            icon={Receipt}
            tone="sky"
          />
          <MetricCard
            label="Unidades vendidas"
            value={String(blind.unitsSold)}
            icon={Package}
            tone="rose"
          />
          <MetricCard
            label="Productos distintos"
            value={String(blind.stockOutLines.length)}
            icon={ShoppingBag}
            tone="violet"
          />
          <MetricCard
            label="Egresos"
            value={String(blind.expenseLines.length)}
            icon={ArrowDownLeft}
            tone="amber"
          />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)_minmax(300px,380px)] xl:items-start">
        <section
          className={`${cardClass} border-rose-200/70 ring-rose-950/5 dark:border-rose-900/40`}
        >
          <SectionTitle
            icon={Package}
            tone="rose"
            hint="Listado de lo que salió por ventas hoy — revisalo antes de cerrar."
          >
            Lo vendido hoy · {blind.unitsSold} ud
          </SectionTitle>
          <div className="mt-4">
            <StockOutTable lines={blind.stockOutLines} />
          </div>
        </section>

        <section
          className={`${cardClass} border-amber-200/70 ring-amber-950/5 dark:border-amber-900/40`}
        >
          <SectionTitle
            icon={ArrowDownLeft}
            tone="amber"
            hint="Conceptos del día (sin montos hasta cerrar)."
          >
            Egresos · {blind.expenseLines.length}
          </SectionTitle>
          <div className="mt-4">
            <ExpensesTable lines={blind.expenseLines} hideAmounts />
          </div>
        </section>

        <section
          className={`${cardClass} border-emerald-200/70 ring-emerald-950/5 dark:border-emerald-900/40`}
        >
          <SectionTitle
            icon={Wallet}
            tone="emerald"
            hint="Contá billetes y monedas. El sistema calcula el esperado."
          >
            Cerrar caja
          </SectionTitle>
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

            <div className="flex gap-2 rounded-lg border border-sky-200/80 bg-sky-50/80 px-3 py-2.5 text-sm text-sky-950 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-100">
              <Scale className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                Al confirmar comparamos con el sistema. Si hay diferencia, la nota es
                obligatoria.
              </span>
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
                placeholder="Obligatoria si no cuadra (ej. cambio mal entregado)"
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
    <section
      className={`${cardClass} border-rose-200/70 ring-rose-950/5 dark:border-rose-900/40`}
    >
      <SectionTitle icon={Package} tone="rose" hint="Productos que salieron por ventas.">
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
    <section
      className={`${cardClass} border-amber-200/70 ring-amber-950/5 dark:border-amber-900/40`}
    >
      <SectionTitle
        icon={ArrowDownLeft}
        tone="amber"
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
  { tone: Tone; icon: LucideIcon }
> = {
  fondo: { tone: "violet", icon: PiggyBank },
  ventas: { tone: "rose", icon: ShoppingBag },
  efectivo: { tone: "emerald", icon: Banknote },
  transfer: { tone: "sky", icon: Receipt },
  mixtas: { tone: "zinc", icon: ClipboardList },
  egreso: { tone: "amber", icon: ArrowDownLeft },
  esperado: { tone: "rose", icon: Scale },
  contado: { tone: "emerald", icon: Wallet },
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
      <SectionTitle icon={ClipboardList} tone="zinc" hint="Totales congelados al cerrar.">
        Resumen monetario
      </SectionTitle>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {rows.map((r) => {
          const meta = moneyToneMeta[r.kind];
          const Icon = meta.icon;
          return (
            <div
              key={r.label}
              className={`rounded-xl border px-3 py-2.5 ${toneBox[meta.tone]}`}
            >
              <dt className={`flex items-center gap-1.5 text-xs font-medium ${toneLabel[meta.tone]}`}>
                <Icon className={`h-3.5 w-3.5 ${toneIcon[meta.tone]}`} aria-hidden />
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
  const Icon = ok ? CheckCircle2 : AlertTriangle;
  return (
    <div
      className={`flex gap-3 rounded-xl border px-4 py-3 text-sm ${
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100"
          : diff > 0
            ? "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
            : "border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100"
      }`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div>
        <p className="font-medium">
          {ok
            ? "La caja cuadró."
            : diff > 0
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
