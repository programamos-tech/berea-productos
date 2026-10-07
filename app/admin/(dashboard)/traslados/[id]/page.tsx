import Link from "next/link";
import { Building2, Clock, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import {
  cancelStockTransfer,
  receiveStockTransfer,
} from "@/app/actions/admin/stock-transfers";
import { StockTransferOpenDetail } from "@/components/admin/StockTransferOpenDetail";
import { requireAdminAnyPermission } from "@/lib/require-admin-permission";
import {
  isStockTransferStatus,
  stockTransferCode,
  stockTransferErrorMessage,
  stockTransferStatusLabel,
  type StockTransferStatus,
} from "@/lib/stock-transfers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatStoreInvoiceDateTime } from "@/lib/store-datetime-format";

const labelClass =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";
const metaIconClass = "size-4 shrink-0 text-zinc-400 dark:text-zinc-500";
const metaSepClass = "text-zinc-300 dark:text-zinc-600";
const metaTextClass = "text-zinc-700 dark:text-zinc-300";
const th =
  "pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";

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
      "id,status,notes,cancel_notes,sent_at,received_at,cancelled_at,created_by,received_by,cancelled_by,from_branch_id,to_branch_id,from_branch_name,to_branch_name,stock_transfer_items(quantity,received_quantity,product_id,products(name,reference))",
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
  const receivedUnits = items.reduce(
    (sum, item) => sum + Math.max(0, Number(item.received_quantity) || 0),
    0,
  );
  const showReceived = transfer.status === "received";
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
  const sentLabel = formatStoreInvoiceDateTime(String(transfer.sent_at));
  const closedLabel = transfer.received_at
    ? formatStoreInvoiceDateTime(String(transfer.received_at))
    : transfer.cancelled_at
      ? formatStoreInvoiceDateTime(String(transfer.cancelled_at))
      : null;

  return (
    <div className="flex w-full min-w-0 max-w-none flex-col gap-4">
      {errorMessage ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100"
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}

      <header className="flex flex-wrap items-center justify-between gap-2 gap-y-2">
        <div className="min-w-0">
          <p className="text-[11px] text-zinc-500">
            <Link
              href="/admin/traslados"
              className="hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Traslados
            </Link>
            <span className="mx-1.5 text-zinc-400">/</span>
            {code}
          </p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            Traslado {code}
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <Clock className={metaIconClass} aria-hidden />
              <span className={`tabular-nums ${metaTextClass}`}>{sentLabel}</span>
            </span>
            <span className={metaSepClass} aria-hidden>
              ·
            </span>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Building2 className={metaIconClass} aria-hidden />
              <span className={`min-w-0 truncate ${metaTextClass}`}>
                {transfer.from_branch_name} → {transfer.to_branch_name}
              </span>
            </span>
            {sender !== "Sin registro" ? (
              <>
                <span className={metaSepClass} aria-hidden>
                  ·
                </span>
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <UserRound className={metaIconClass} aria-hidden />
                  <span className={`min-w-0 truncate ${metaTextClass}`}>
                    <span className="text-zinc-500">Envió </span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {sender}
                    </span>
                  </span>
                </span>
              </>
            ) : null}
            {receiver ? (
              <>
                <span className={metaSepClass} aria-hidden>
                  ·
                </span>
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <UserRound className={metaIconClass} aria-hidden />
                  <span className={`min-w-0 truncate ${metaTextClass}`}>
                    <span className="text-zinc-500">Recibió </span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {receiver}
                    </span>
                  </span>
                </span>
              </>
            ) : null}
          </p>
          {transfer.status === "cancelled" && canceller ? (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
              <span className="font-medium">Anulación: </span>
              {canceller}
              {closedLabel ? ` · ${closedLabel}` : ""}
            </p>
          ) : null}
        </div>
        <Link
          href="/admin/traslados"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          title="Volver"
          aria-label="Volver a traslados"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="size-4"
            aria-hidden
          >
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </header>

      {transfer.status === "in_transit" ? (
        <StockTransferOpenDetail
          lines={items.map((item) => {
            const product = Array.isArray(item.products) ? item.products[0] : item.products;
            return {
              productId: String(item.product_id),
              name: product?.name ? String(product.name) : "Producto",
              reference: product?.reference ? String(product.reference).trim() : "",
              sent: Math.max(0, Number(item.quantity) || 0),
            };
          })}
          canReceive={canReceive}
          canCancel={canCancel}
          transferId={String(transfer.id)}
          submissionId={submissionId}
          fromName={String(transfer.from_branch_name)}
          units={units}
          receiveAction={receiveStockTransfer}
          cancelAction={cancelStockTransfer}
        >
          <TransferAsideMeta
            units={units}
            status={transfer.status}
            sender={sender}
            sentLabel={sentLabel}
            fromName={String(transfer.from_branch_name)}
            receiver={receiver}
            closedLabel={closedLabel}
            toName={String(transfer.to_branch_name)}
            notes={transfer.notes ? String(transfer.notes) : null}
            cancelNotes={null}
          />
        </StockTransferOpenDetail>
      ) : (
      <div className="flex flex-col gap-6 border-t border-zinc-200/70 pt-4 dark:border-zinc-800 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,20rem)] lg:items-start lg:gap-10 xl:gap-12">
        <section className="min-w-0">
          {items.length === 0 ? (
            <p className="text-sm text-zinc-500">No hay productos en este traslado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] table-fixed text-left text-sm leading-relaxed sm:text-[15px]">
                <colgroup>
                  <col />
                  <col className="w-24" />
                  {showReceived ? <col className="w-24" /> : null}
                </colgroup>
                <thead>
                  <tr className="border-b border-zinc-200/70 dark:border-zinc-800">
                    <th className={th}>Producto</th>
                    <th className={`${th} text-right`}>{showReceived ? "Enviadas" : "Ud"}</th>
                    {showReceived ? <th className={`${th} text-right`}>Recibidas</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const product = Array.isArray(item.products) ? item.products[0] : item.products;
                    const name = product?.name ? String(product.name) : "Producto";
                    const reference = product?.reference ? String(product.reference).trim() : "";
                    return (
                      <tr
                        key={String(item.product_id)}
                        className="border-b border-zinc-100/80 last:border-0 dark:border-zinc-800/80"
                      >
                        <td className="py-3 pr-5 align-middle text-zinc-800 dark:text-zinc-200">
                          <Link
                            href={`/admin/products/${item.product_id}`}
                            className="block font-medium leading-snug hover:underline"
                          >
                            {name}
                          </Link>
                          {reference ? (
                            <span className="mt-1 block font-mono text-xs text-zinc-500">
                              Ref. {reference}
                            </span>
                          ) : null}
                        </td>
                        <td className="py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                          {item.quantity}
                        </td>
                        {showReceived ? (
                          <td className="py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                            {Number(item.received_quantity) || 0}
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="shrink-0 space-y-5 border-t border-zinc-200/70 pt-4 dark:border-zinc-800 lg:sticky lg:top-3 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0 xl:pl-10 dark:lg:border-zinc-800">
          <TransferAsideMeta
            units={showReceived ? receivedUnits : units}
            status={transfer.status}
            sender={sender}
            sentLabel={sentLabel}
            fromName={String(transfer.from_branch_name)}
            receiver={receiver}
            closedLabel={closedLabel}
            toName={String(transfer.to_branch_name)}
            notes={transfer.notes ? String(transfer.notes) : null}
            cancelNotes={transfer.cancel_notes ? String(transfer.cancel_notes) : null}
          />
        </aside>
      </div>
      )}
    </div>
  );
}

function TransferAsideMeta({
  units,
  status,
  sender,
  sentLabel,
  fromName,
  receiver,
  closedLabel,
  toName,
  notes,
  cancelNotes,
}: {
  units: number;
  status: StockTransferStatus;
  sender: string;
  sentLabel: string;
  fromName: string;
  receiver: string | null;
  closedLabel: string | null;
  toName: string;
  notes: string | null;
  cancelNotes: string | null;
}) {
  return (
    <>
      <div>
        <p className={labelClass}>{status === "received" ? "Recibidas" : "Unidades"}</p>
        <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
          {units}
        </p>
      </div>
      <div>
        <p className={labelClass}>Estado</p>
        <p className={`mt-1.5 text-sm font-medium ${statusClass(status)}`}>
          {stockTransferStatusLabel(status)}
        </p>
      </div>
      <div>
        <p className={labelClass}>Envió</p>
        <p className="mt-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">{sender}</p>
        <p className="text-sm text-zinc-500">
          {fromName} · {sentLabel}
        </p>
      </div>
      <div>
        <p className={labelClass}>Recibió</p>
        {receiver && closedLabel && status === "received" ? (
          <>
            <p className="mt-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">{receiver}</p>
            <p className="text-sm text-zinc-500">
              {toName} · {closedLabel}
            </p>
          </>
        ) : (
          <p className="mt-1.5 text-sm text-zinc-500">
            {status === "cancelled" ? "No se recibió" : `Pendiente en ${toName}`}
          </p>
        )}
      </div>
      {notes ? (
        <div>
          <p className={labelClass}>Nota</p>
          <p className="mt-1.5 text-sm text-zinc-700 dark:text-zinc-200">{notes}</p>
        </div>
      ) : null}
      {cancelNotes ? (
        <div>
          <p className={labelClass}>Nota de anulación</p>
          <p className="mt-1.5 text-sm text-zinc-700 dark:text-zinc-200">{cancelNotes}</p>
        </div>
      ) : null}
    </>
  );
}
