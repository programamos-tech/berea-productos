import Link from "next/link";
import { notFound } from "next/navigation";
import { ExpenseDateEditForm } from "@/components/admin/ExpenseDateEditForm";
import { ExpenseDetailHeaderActions } from "@/components/admin/ExpenseDetailHeaderActions";
import { StaticCopCents } from "@/components/admin/ReportsAnimatedFigures";
import {
  expenseKindLabel,
  expensePaymentMethodLabel,
  expenseScopeLabel,
  parseExpenseKind,
  parseExpenseScope,
} from "@/lib/expenses-constants";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import { formatStoreDateTime } from "@/lib/store-datetime-format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const labelClass =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-500";

const metaSepClass = "text-zinc-300 dark:text-zinc-600";

function prettyDateTime(iso: string | null | undefined) {
  return formatStoreDateTime(iso, {
    dateStyle: "long",
    timeStyle: "short",
  });
}

type Props = { params: Promise<{ id: string }> };

export default async function AdminEgresoDetailPage({ params }: Props) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createSupabaseServerClient();
  const [perm, expenseRes] = await Promise.all([
    loadAdminPermissions(),
    supabase
      .from("store_expenses")
      .select(
        "id,concept,category,amount_cents,payment_method,notes,expense_date,created_at,is_cancelled,cancelled_at,cancellation_reason,supplier_invoice_payment_id,expense_kind,expense_scope",
      )
      .eq("id", id)
      .maybeSingle(),
  ]);

  const row = expenseRes.data;
  if (!row) notFound();

  let supplierLink: {
    supplierId: string;
    invoiceId: string;
    folio: string;
    supplierName: string;
  } | null = null;
  const payId = row.supplier_invoice_payment_id
    ? String(row.supplier_invoice_payment_id)
    : null;
  if (payId) {
    const { data: pay } = await supabase
      .from("supplier_invoice_payments")
      .select("id,invoice_id,supplier_invoices(supplier_id,folio,suppliers(name))")
      .eq("id", payId)
      .maybeSingle();
    const inv = pay?.supplier_invoices as
      | {
          supplier_id?: string;
          folio?: string;
          suppliers?: { name?: string } | { name?: string }[] | null;
        }
      | {
          supplier_id?: string;
          folio?: string;
          suppliers?: { name?: string } | { name?: string }[] | null;
        }[]
      | null;
    const invRow = Array.isArray(inv) ? inv[0] : inv;
    const suppliersRaw = invRow?.suppliers;
    const supplierRow = Array.isArray(suppliersRaw)
      ? suppliersRaw[0]
      : suppliersRaw;
    if (invRow?.supplier_id && pay?.invoice_id) {
      supplierLink = {
        supplierId: String(invRow.supplier_id),
        invoiceId: String(pay.invoice_id),
        folio: invRow.folio ? String(invRow.folio) : "",
        supplierName: supplierRow?.name ? String(supplierRow.name) : "Proveedor",
      };
    }
  }

  const canEdit = Boolean(perm?.permissions.egresos_crear);
  const isCancelled = row.is_cancelled === true;
  const expenseKind = parseExpenseKind(
    (row as { expense_kind?: unknown }).expense_kind,
  );
  const expenseScope = parseExpenseScope(
    (row as { expense_scope?: unknown }).expense_scope,
  );
  const kindLabel = expenseKindLabel(expenseKind);
  const scopeLabel = expenseScopeLabel(expenseScope);

  const concept = String(row.concept ?? kindLabel).trim() || kindLabel;
  const expenseDate =
    typeof row.expense_date === "string" && row.expense_date.length > 0
      ? row.expense_date
      : String(row.created_at ?? "").slice(0, 10);
  const createdAt = typeof row.created_at === "string" ? row.created_at : null;
  const paymentRaw = String(row.payment_method ?? "");
  const paymentPretty = expensePaymentMethodLabel(paymentRaw);
  const category = String(row.category ?? "operativo");
  const notes = row.notes ? String(row.notes).trim() : "";
  const amountCents = Number(row.amount_cents ?? 0);
  const docNoun = expenseKind === "egreso" ? "Egreso" : "Gasto";
  const categoryIsLegacy = category.toLowerCase() === "legacy";

  const metaItems = [
    kindLabel,
    scopeLabel,
    paymentPretty,
    expenseDate,
    category !== "operativo" ? category : null,
  ].filter(Boolean) as string[];

  return (
    <div className="flex w-full min-w-0 max-w-none flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-2 gap-y-2">
        <div className="min-w-0">
          <p className="text-[11px] text-zinc-500">
            <Link
              href="/admin/egresos"
              className="hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Gastos
            </Link>
            <span className="mx-1.5 text-zinc-400">/</span>
            {docNoun}
          </p>
          <h1
            className={`mt-0.5 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl ${
              isCancelled ? "line-through decoration-zinc-400" : ""
            }`}
          >
            {concept}
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500">
            {metaItems.map((item, i) => (
              <span key={`${item}-${i}`} className="inline-flex items-center gap-2">
                {i > 0 ? (
                  <span className={metaSepClass} aria-hidden>
                    ·
                  </span>
                ) : null}
                <span
                  className={
                    i === 0
                      ? "font-medium text-zinc-800 dark:text-zinc-200"
                      : "tabular-nums"
                  }
                >
                  {item}
                </span>
              </span>
            ))}
            {isCancelled ? (
              <>
                <span className={metaSepClass} aria-hidden>
                  ·
                </span>
                <span className="font-medium text-[var(--admin-loss)] dark:text-[var(--admin-loss-dark)]">
                  Anulado
                </span>
              </>
            ) : null}
            {supplierLink ? (
              <>
                <span className={metaSepClass} aria-hidden>
                  ·
                </span>
                <Link
                  href={`/admin/proveedores/${supplierLink.supplierId}/facturas/${supplierLink.invoiceId}`}
                  className="font-medium text-zinc-800 underline-offset-2 hover:underline dark:text-zinc-200"
                >
                  {supplierLink.supplierName}
                  {supplierLink.folio ? ` · ${supplierLink.folio}` : ""}
                </Link>
              </>
            ) : null}
          </p>
          {isCancelled && row.cancellation_reason?.trim() ? (
            <p className="mt-2 max-w-2xl text-sm text-[var(--admin-loss)] dark:text-[var(--admin-loss-dark)]">
              Motivo: {String(row.cancellation_reason).trim()}
              {row.cancelled_at
                ? ` · ${prettyDateTime(String(row.cancelled_at))}`
                : ""}
            </p>
          ) : null}
        </div>
        <ExpenseDetailHeaderActions
          expenseId={String(row.id)}
          conceptLabel={concept}
          isCancelled={isCancelled}
          canCancel={canEdit}
        />
      </header>

      <div className="flex flex-col gap-6 border-t border-zinc-200/70 pt-4 dark:border-zinc-800 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(16rem,18rem)] lg:items-start lg:gap-10 xl:gap-12">
        <section className="min-w-0 space-y-8">
          <div>
            <h2 className={labelClass}>Notas adicionales</h2>
            {notes.length > 0 ? (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                {notes}
              </p>
            ) : (
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                Sin notas adicionales.
              </p>
            )}
          </div>

          <div>
            <h2 className={labelClass}>Trazabilidad</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className={labelClass}>Registrado en el sistema</dt>
                <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                  {prettyDateTime(createdAt)}
                </dd>
              </div>
              <div>
                <dt className={labelClass}>Método de pago (código)</dt>
                <dd className="mt-1 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                  {paymentRaw || "—"}
                </dd>
              </div>
            </dl>
            {supplierLink ? (
              <p className="mt-5 text-sm text-zinc-600 dark:text-zinc-400">
                Vinculado a abono de proveedor ·{" "}
                <Link
                  href={`/admin/proveedores/${supplierLink.supplierId}/facturas/${supplierLink.invoiceId}`}
                  className="font-semibold text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
                >
                  Ver factura
                  {supplierLink.folio ? ` ${supplierLink.folio}` : ""}
                </Link>
              </p>
            ) : (
              <p className="mt-5 text-sm text-zinc-500 dark:text-zinc-400">
                Sin vínculo con pedidos. En Reportes se descuenta según el método
                de pago registrado.
              </p>
            )}
          </div>
        </section>

        <aside className="shrink-0 space-y-5 border-t border-zinc-200/70 pt-4 dark:border-zinc-800 lg:sticky lg:top-3 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0 xl:pl-10 dark:lg:border-zinc-800">
          <div>
            <p className={labelClass}>Total</p>
            <p
              className={`mt-2 text-3xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50 ${
                isCancelled ? "line-through decoration-zinc-400" : ""
              }`}
            >
              <StaticCopCents cents={amountCents} />
            </p>
            {isCancelled ? (
              <p className="mt-1 text-xs text-zinc-500">No cuenta en reportes</p>
            ) : null}
          </div>

          <div>
            <p className={labelClass}>Método de pago</p>
            <p className="mt-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {paymentPretty}
            </p>
          </div>

          <div>
            <p className={labelClass}>Estado</p>
            <p
              className={`mt-1.5 text-sm font-medium ${
                isCancelled
                  ? "text-[var(--admin-loss)] dark:text-[var(--admin-loss-dark)]"
                  : "text-[var(--admin-profit)] dark:text-[var(--admin-profit-dark)]"
              }`}
            >
              {isCancelled ? "Anulado" : "Registrado"}
            </p>
          </div>

          <div>
            <p className={labelClass}>Fecha del gasto</p>
            <div className="mt-1.5">
              {isCancelled || !canEdit ? (
                <p className="text-sm font-medium tabular-nums text-zinc-800 dark:text-zinc-200">
                  {expenseDate}
                </p>
              ) : (
                <ExpenseDateEditForm
                  expenseId={String(row.id)}
                  initialDate={expenseDate}
                  canEdit
                  compact
                />
              )}
            </div>
          </div>

          <div>
            <p className={labelClass}>Categoría</p>
            <p
              className={`mt-1.5 text-sm font-medium ${
                categoryIsLegacy
                  ? "text-violet-600 dark:text-violet-400"
                  : "text-zinc-800 dark:text-zinc-200"
              }`}
            >
              {category}
            </p>
          </div>

          <div>
            <p className={labelClass}>Alcance</p>
            <p className="mt-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {scopeLabel}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
