import Link from "next/link";
import { notFound } from "next/navigation";
import {
  cancelStockTransfer,
  receiveStockTransfer,
} from "@/app/actions/admin/stock-transfers";
import {
  AdminFormSubmitButton,
  adminPrimarySubmitButtonClass,
} from "@/components/admin/AdminFormSubmitButton";
import { requireAdminAnyPermission } from "@/lib/require-admin-permission";
import {
  formatTransferWhen,
  isStockTransferStatus,
  stockTransferCode,
  stockTransferErrorMessage,
  stockTransferStatusLabel,
  type StockTransferStatus,
} from "@/lib/stock-transfers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminButtonCancelClass } from "@/lib/admin-ui";

export const dynamic = "force-dynamic";

function statusClass(status: StockTransferStatus) {
  if (status === "in_transit") return "text-amber-700 dark:text-amber-300";
  if (status === "received") return "text-emerald-700 dark:text-emerald-300";
  return "text-zinc-500";
}

function personName(
  names: Map<string, string>,
  id: string | null | undefined,
): string {
  if (!id) return "Sin registro";
  return names.get(id) || "Sin nombre";
}

export default async function AdminTrasladoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const perm = await requireAdminAnyPermission([
    "stock_transferir",
    "inventario_ver",
  ]);
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: transfer } = await supabase
    .from("stock_transfers")
    .select(
      "id,status,notes,sent_at,received_at,cancelled_at,created_by,received_by,cancelled_by,from_branch_id,to_branch_id,from_branch_name,to_branch_name,stock_transfer_items(quantity,product_id,products(name,reference))",
    )
    .eq("id", id)
    .maybeSingle();
  if (!transfer || !isStockTransferStatus(transfer.status)) notFound();

  const personIds = [
    transfer.created_by,
    transfer.received_by,
    transfer.cancelled_by,
  ].filter((value): value is string => Boolean(value));
  const names = new Map<string, string>();
  if (personIds.length > 0) {
    const { data: people } = await supabase
      .from("profiles")
      .select("id,display_name")
      .in("id", personIds);
    for (const person of people ?? []) {
      const label = String(person.display_name ?? "").trim();
      if (label) names.set(String(person.id), label);
    }
  }

  const accessible = new Set(perm.branchContext.available.map((branch) => branch.id));
  const canReceive =
    transfer.status === "in_transit" && accessible.has(String(transfer.to_branch_id));
  const canCancel =
    transfer.status === "in_transit" &&
    (accessible.has(String(transfer.from_branch_id)) ||
      accessible.has(String(transfer.to_branch_id)));
  const items = Array.isArray(transfer.stock_transfer_items)
    ? transfer.stock_transfer_items
    : [];
  const units = items.reduce(
    (sum, item) => sum + Math.max(0, Number(item.quantity) || 0),
    0,
  );
  const errorMessage =
    sp.message?.trim() ||
    (sp.error ? stockTransferErrorMessage(sp.error) : null);
  const submissionId = crypto.randomUUID();
  const sender = personName(names, transfer.created_by ? String(transfer.created_by) : null);
  const receiver = transfer.received_by
    ? personName(names, String(transfer.received_by))
    : null;
  const canceller = transfer.cancelled_by
    ? personName(names, String(transfer.cancelled_by))
    : null;
  const code = stockTransferCode(String(transfer.id), String(transfer.sent_at));
  const meta = [
    stockTransferStatusLabel(transfer.status),
    sender !== "Sin registro" ? `envió ${sender}` : null,
    `enviado ${formatTransferWhen(String(transfer.sent_at))}`,
    receiver && transfer.received_at
      ? `recibió ${receiver}`
      : null,
    transfer.received_at ? `cerrado ${formatTransferWhen(String(transfer.received_at))}` : null,
    canceller && transfer.cancelled_at ? `anuló ${canceller}` : null,
    transfer.cancelled_at && !transfer.received_at
      ? `anulado ${formatTransferWhen(String(transfer.cancelled_at))}`
      : null,
    `${units} u.`,
  ].filter(Boolean);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <header className="min-w-0">
        <p className="text-[11px] text-zinc-500">
          <Link
            href="/admin/traslados"
            className="hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            Traslados
          </Link>
        </p>
        <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
          {code}
        </h1>
        <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-100">
          {transfer.from_branch_name} → {transfer.to_branch_name}
        </p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm text-zinc-500">
          {meta.map((part, index) => (
            <span key={`${part}-${index}`} className="inline-flex items-center gap-x-2.5">
              {index > 0 ? (
                <span className="text-zinc-300 dark:text-zinc-600" aria-hidden>
                  ·
                </span>
              ) : (
                <span className={statusClass(transfer.status)}>{part}</span>
              )}
              {index > 0 ? <span>{part}</span> : null}
            </span>
          ))}
        </p>
      </header>

      {errorMessage ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMessage}
        </p>
      ) : null}

      {transfer.notes ? (
        <p className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-center text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
          {transfer.notes}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {items.map((item) => {
          const product = Array.isArray(item.products) ? item.products[0] : item.products;
          const name = product?.name ? String(product.name) : "Producto";
          const reference = product?.reference ? String(product.reference) : "";
          return (
            <div
              key={String(item.product_id)}
              className="flex items-center justify-between gap-4 border-b border-zinc-100 px-4 py-3.5 last:border-b-0 dark:border-zinc-800"
            >
              <div className="min-w-0">
                <Link
                  href={`/admin/products/${item.product_id}`}
                  className="block truncate text-sm font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
                >
                  {name}
                </Link>
                {reference ? (
                  <p className="mt-0.5 font-mono text-xs text-zinc-500">{reference}</p>
                ) : null}
              </div>
              <p className="shrink-0 text-sm tabular-nums text-zinc-900 dark:text-zinc-100">
                {item.quantity} u.
              </p>
            </div>
          );
        })}
      </div>

      {transfer.status === "in_transit" ? (
        <div className="flex flex-wrap gap-2">
          {canReceive ? (
            <form action={receiveStockTransfer}>
              <input type="hidden" name="transfer_id" value={transfer.id} />
              <input type="hidden" name="submission_id" value={`${submissionId}-receive`} />
              <AdminFormSubmitButton
                pendingLabel="Recibiendo…"
                className={adminPrimarySubmitButtonClass}
              >
                Confirmar llegada
              </AdminFormSubmitButton>
            </form>
          ) : (
            <p className="text-sm text-zinc-500">
              La sucursal de destino confirma la llegada para sumar el stock.
            </p>
          )}
          {canCancel ? (
            <form action={cancelStockTransfer}>
              <input type="hidden" name="transfer_id" value={transfer.id} />
              <input type="hidden" name="submission_id" value={`${submissionId}-cancel`} />
              <AdminFormSubmitButton
                pendingLabel="Anulando…"
                className={adminButtonCancelClass}
              >
                Anular y devolver
              </AdminFormSubmitButton>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
