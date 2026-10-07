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
} from "@/lib/stock-transfers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  adminButtonCancelClass,
  adminPageSubtitleClass,
  adminPageTitleClass,
} from "@/lib/admin-ui";

export const dynamic = "force-dynamic";

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
      "id,status,notes,sent_at,received_at,cancelled_at,from_branch_id,to_branch_id,from_branch_name,to_branch_name,stock_transfer_items(quantity,product_id,products(name,reference))",
    )
    .eq("id", id)
    .maybeSingle();
  if (!transfer || !isStockTransferStatus(transfer.status)) notFound();

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
  const closedAt =
    transfer.status === "received"
      ? transfer.received_at
      : transfer.status === "cancelled"
        ? transfer.cancelled_at
        : null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link
          href="/admin/traslados"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Traslados
        </Link>
        <h1 className={`${adminPageTitleClass} mt-2`}>
          {stockTransferCode(String(transfer.id), String(transfer.sent_at))}
        </h1>
        <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-100">
          {transfer.from_branch_name} → {transfer.to_branch_name}
        </p>
        <p className={adminPageSubtitleClass}>
          {stockTransferStatusLabel(transfer.status)} · enviado{" "}
          {formatTransferWhen(String(transfer.sent_at))}
          {closedAt ? ` · cerrado ${formatTransferWhen(String(closedAt))}` : ""}
          {" · "}
          {units} u.
        </p>
      </div>

      {errorMessage ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMessage}
        </p>
      ) : null}
      {transfer.notes ? (
        <p className="rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
          {transfer.notes}
        </p>
      ) : null}

      <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-700">
        {items.map((item) => {
          const product = Array.isArray(item.products) ? item.products[0] : item.products;
          const name = product?.name ? String(product.name) : "Producto";
          const reference = product?.reference ? String(product.reference) : "";
          return (
            <li key={String(item.product_id)} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {name}
                </p>
                {reference ? (
                  <p className="truncate text-xs text-zinc-500">{reference}</p>
                ) : null}
              </div>
              <p className="shrink-0 text-sm tabular-nums text-zinc-700 dark:text-zinc-200">
                {item.quantity} u.
              </p>
            </li>
          );
        })}
      </ul>

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
