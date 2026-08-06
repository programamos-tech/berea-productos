import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CashExpensesReadonly,
  CashStockOutReadonly,
} from "@/components/admin/CashRegisterForms";
import { StaticCopCents } from "@/components/admin/ReportsAnimatedFigures";
import { prettyReportDayShortLabel } from "@/lib/admin-report-range";
import { fetchCashSessionById } from "@/lib/cash-register";
import { formatCop } from "@/lib/money";
import { requireAdminAnyPermission } from "@/lib/require-admin-permission";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminCajaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAnyPermission(["caja_ver", "caja_gestionar"]);
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const session = await fetchCashSessionById(supabase, id);
  if (!session) notFound();

  // Mientras esté abierta, el detalle completo no se muestra (cierre a ciegas).
  if (session.status === "open") {
    redirect("/admin/caja");
  }

  const dayLabel = prettyReportDayShortLabel(session.business_day);
  const diff = session.cash_difference_cents;

  const moneyRows: { label: string; value: number | null }[] = [
    { label: "Fondo inicial", value: session.opening_float_cents },
    { label: "Ventas total", value: session.sales_total_cents },
    { label: "Ventas efectivo", value: session.sales_cash_cents },
    { label: "Ventas transferencia", value: session.sales_transfer_cents },
    {
      label: "Ventas mixtas / otras",
      value:
        session.sales_mixed_cents != null || session.sales_other_cents != null
          ? (session.sales_mixed_cents ?? 0) + (session.sales_other_cents ?? 0)
          : null,
    },
    { label: "Egresos efectivo", value: session.expenses_cash_cents },
    { label: "Egresos otros", value: session.expenses_other_cents },
    { label: "Efectivo esperado", value: session.expected_cash_cents },
    { label: "Efectivo contado", value: session.counted_cash_cents },
  ];

  return (
    <div className="w-full max-w-none space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <Link href="/admin/caja" className="hover:text-zinc-800 dark:hover:text-zinc-200">
              Cierre de caja
            </Link>
            <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">/</span>
            <span className="text-zinc-700 dark:text-zinc-300">{dayLabel}</span>
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Registro del {dayLabel}
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Cierre congelado — no se modifica.
          </p>
        </div>
        <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          Cerrada
        </span>
      </div>

      {diff != null ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            diff === 0
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100"
              : diff > 0
                ? "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
                : "border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100"
          }`}
        >
          {diff === 0
            ? "La caja cuadró."
            : diff > 0
              ? `Discrepancia: sobrante ${formatCop(diff)}`
              : `Discrepancia: faltante ${formatCop(Math.abs(diff))}`}
          {session.units_sold != null ? (
            <span className="ml-2 opacity-80">· {session.units_sold} ud vendidas</span>
          ) : null}
          {session.expense_lines.length > 0 ? (
            <span className="ml-2 opacity-80">
              · {session.expense_lines.length} egresos
            </span>
          ) : null}
          {session.notes ? (
            <p className="mt-2 text-sm opacity-90">
              <span className="font-medium">Nota: </span>
              {session.notes}
            </p>
          ) : null}
        </div>
      ) : null}

      <section className="rounded-xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-700/90 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Resumen monetario
        </h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {moneyRows.map((r) => (
            <div
              key={r.label}
              className="rounded-lg border border-zinc-200/80 bg-zinc-50/70 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950/40"
            >
              <dt className="text-xs text-zinc-500 dark:text-zinc-400">{r.label}</dt>
              <dd className="mt-1 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {r.value == null ? "—" : <StaticCopCents cents={r.value} />}
              </dd>
            </div>
          ))}
        </dl>
        {session.notes ? (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">Notas: </span>
            {session.notes}
          </p>
        ) : null}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <CashStockOutReadonly lines={session.stock_out_lines} />
        <CashExpensesReadonly lines={session.expense_lines} />
      </div>
    </div>
  );
}
