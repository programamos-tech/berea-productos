import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { resendCashCloseReport } from "@/app/actions/admin/cash-register";
import {
  AdminFormSubmitButton,
} from "@/components/admin/AdminFormSubmitButton";
import {
  CashClosedMoneyGrid,
  CashDiscrepancyBanner,
  CashExpensesReadonly,
  CashStockOutReadonly,
} from "@/components/admin/CashRegisterForms";
import { prettyReportDayShortLabel } from "@/lib/admin-report-range";
import { fetchCashSessionById } from "@/lib/cash-register";
import { cashCloseReportRecipientsLabel } from "@/lib/email/send";
import { requireAdminAnyPermission } from "@/lib/require-admin-permission";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminCajaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const perm = await requireAdminAnyPermission(["caja_ver", "caja_gestionar"]);
  const canManage = Boolean(perm.permissions.caja_gestionar);
  const { id } = await params;
  const sp = await searchParams;
  const reportRaw = typeof sp.report === "string" ? sp.report : undefined;

  const supabase = await createSupabaseServerClient();
  const session = await fetchCashSessionById(supabase, id);
  if (!session) notFound();

  // Mientras esté abierta, el detalle completo no se muestra (cierre a ciegas).
  if (session.status === "open") {
    redirect("/admin/caja");
  }

  const dayLabel = prettyReportDayShortLabel(session.business_day);
  const diff = session.cash_difference_cents;

  const moneyRows = [
    { label: "Fondo inicial", value: session.opening_float_cents, kind: "fondo" as const },
    { label: "Ventas total", value: session.sales_total_cents, kind: "ventas" as const },
    { label: "Ventas efectivo", value: session.sales_cash_cents, kind: "efectivo" as const },
    {
      label: "Ventas transferencia",
      value: session.sales_transfer_cents,
      kind: "transfer" as const,
    },
    {
      label: "Ventas mixtas / otras",
      value:
        session.sales_mixed_cents != null || session.sales_other_cents != null
          ? (session.sales_mixed_cents ?? 0) + (session.sales_other_cents ?? 0)
          : null,
      kind: "mixtas" as const,
    },
    {
      label: "Egresos efectivo",
      value: session.expenses_cash_cents,
      kind: "egreso" as const,
    },
    {
      label: "Egresos otros",
      value: session.expenses_other_cents,
      kind: "egreso" as const,
    },
    {
      label: "Neto del turno (efectivo)",
      value: session.expected_cash_cents,
      kind: "esperado" as const,
    },
    {
      label: "Efectivo contado",
      value: session.counted_cash_cents,
      kind: "contado" as const,
    },
  ];

  const reportBanner =
    reportRaw === "sent"
      ? `Reporte enviado a ${cashCloseReportRecipientsLabel()}.`
      : reportRaw === "error"
        ? "No se pudo enviar el reporte. Revisá EMAIL_FROM / dominio en Resend."
        : reportRaw === "missing"
          ? "No hay cierre para reenviar."
          : null;

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
        <div className="flex flex-wrap items-center gap-2">
          {canManage ? (
            <form action={resendCashCloseReport}>
              <input type="hidden" name="session_id" value={session.id} />
              <AdminFormSubmitButton
                pendingLabel="Enviando…"
                className="inline-flex items-center justify-center rounded-lg border border-rose-950 bg-rose-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:border-rose-900 hover:bg-rose-900 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-200 disabled:text-zinc-500 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:disabled:border-zinc-700 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
              >
                Enviar reporte por correo
              </AdminFormSubmitButton>
            </form>
          ) : null}
          <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            Cerrada
          </span>
        </div>
      </div>

      {reportBanner ? (
        <p
          className={`rounded-xl border px-4 py-3 text-sm ${
            reportRaw === "sent"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100"
              : "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
          }`}
        >
          {reportBanner}
        </p>
      ) : null}

      {diff != null ? (
        <CashDiscrepancyBanner
          diff={diff}
          unitsSold={session.units_sold}
          expenseCount={session.expense_lines.length}
          notes={session.notes}
        />
      ) : null}

      <CashClosedMoneyGrid rows={moneyRows} />

      <div className="grid gap-5 lg:grid-cols-2">
        <CashStockOutReadonly
          lines={session.stock_out_lines}
          unitsSold={session.units_sold}
        />
        <CashExpensesReadonly lines={session.expense_lines} />
      </div>
    </div>
  );
}
