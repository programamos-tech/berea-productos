import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CashClosedMoneyGrid,
  CashDiscrepancyBanner,
  CashExpensesReadonly,
  CashStockOutReadonly,
} from "@/components/admin/CashRegisterForms";
import { prettyReportDayShortLabel } from "@/lib/admin-report-range";
import {
  enrichStockOutLinesRemaining,
  fetchCashSessionById,
} from "@/lib/cash-register";
import { resolveProfileName } from "@/lib/cash-close-report";
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
  await requireAdminAnyPermission(["caja_ver", "caja_gestionar"]);
  const { id } = await params;
  const sp = await searchParams;
  const reportRaw = typeof sp.report === "string" ? sp.report : undefined;

  const supabase = await createSupabaseServerClient();
  const session = await fetchCashSessionById(supabase, id);
  if (!session) notFound();

  if (session.status === "open") {
    redirect("/admin/caja");
  }

  const [stockOutLines, closedByLabel] = await Promise.all([
    enrichStockOutLinesRemaining(supabase, session.stock_out_lines),
    resolveProfileName(supabase, session.closed_by),
  ]);

  const dayLabel = prettyReportDayShortLabel(session.business_day);
  const diff = session.cash_difference_cents;

  const moneyRows = [
    {
      label: "Efectivo día anterior",
      value: session.opening_float_cents,
      kind: "fondo" as const,
    },
    {
      label: "Ventas totales",
      value: session.sales_total_cents,
      kind: "ventas" as const,
    },
    {
      label: "Ventas efectivo",
      value: session.sales_cash_cents,
      kind: "efectivo" as const,
    },
    {
      label: "Transferencias",
      value: session.sales_transfer_cents,
      kind: "transfer" as const,
    },
    {
      label: "Egresos",
      value:
        (session.expenses_cash_cents ?? 0) + (session.expenses_other_cents ?? 0),
      kind: "egreso" as const,
    },
    {
      label: "Efectivo esperado",
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
    <div className="flex w-full max-w-none flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2 gap-y-2">
        <div className="min-w-0">
          <p className="text-[11px] text-zinc-500">
            <Link
              href="/admin/caja"
              className="hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Caja
            </Link>
            <span className="mx-1.5 text-zinc-400">/</span>
            {dayLabel}
          </p>
          <h1 className="mt-0.5 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-xl">
            Registro del {dayLabel}
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            Cerrado por{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {closedByLabel ?? "—"}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href="/admin/caja"
            className="inline-flex size-8 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
            title="Volver"
            aria-label="Volver a caja"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="size-4"
              aria-hidden
            >
              <path
                d="m15 18-6-6 6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            Cerrada
          </span>
        </div>
      </header>

      {reportBanner ? (
        <p
          className={`text-sm ${
            reportRaw === "sent"
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-amber-700 dark:text-amber-300"
          }`}
        >
          {reportBanner}
        </p>
      ) : null}

      {diff != null ? (
        <CashDiscrepancyBanner
          diff={diff}
          notes={session.notes}
        />
      ) : session.notes ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            Nota:{" "}
          </span>
          {session.notes}
        </p>
      ) : null}

      <div className="border-t border-zinc-200/70 pt-4 dark:border-zinc-800">
        <CashClosedMoneyGrid
          rows={moneyRows}
          cashDifferenceCents={diff}
        />
      </div>

      <div className="grid gap-6 border-t border-zinc-200/70 pt-4 dark:border-zinc-800 lg:grid-cols-2 lg:gap-8">
        <CashStockOutReadonly lines={stockOutLines} />
        <div className="lg:border-l lg:border-zinc-200/70 lg:pl-8 dark:lg:border-zinc-800">
          <CashExpensesReadonly lines={session.expense_lines} />
        </div>
      </div>
    </div>
  );
}
