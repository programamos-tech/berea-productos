"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAdminActivity } from "@/lib/admin-activity-log";
import {
  claimAdminFormToken,
  readSubmissionToken,
} from "@/lib/admin-form-token";
import {
  requireAdminAnyPermission,
  requireAdminPermission,
} from "@/lib/require-admin-permission";
import { stockTransferErrorMessage } from "@/lib/stock-transfers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const LIST_PATH = "/admin/traslados";

function revalidateTransfer(id?: string) {
  revalidatePath(LIST_PATH);
  revalidatePath("/admin/products");
  if (id) revalidatePath(`${LIST_PATH}/${id}`);
}

function parseItems(
  raw: string,
  minQuantity: number,
): { product_id: string; quantity: number }[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length < 1) return null;
  const seen = new Set<string>();
  const items: { product_id: string; quantity: number }[] = [];
  for (const row of parsed) {
    if (!row || typeof row !== "object") return null;
    const productId = String((row as { product_id?: unknown }).product_id ?? "").trim();
    const quantity = Math.floor(Number((row as { quantity?: unknown }).quantity));
    if (
      !/^[0-9a-f-]{36}$/i.test(productId) ||
      !Number.isFinite(quantity) ||
      quantity < minQuantity ||
      quantity > 100000 ||
      seen.has(productId)
    ) {
      return null;
    }
    seen.add(productId);
    items.push({ product_id: productId, quantity });
  }
  return items.slice(0, 40);
}

export async function sendStockTransfer(formData: FormData) {
  const perm = await requireAdminPermission("stock_transferir");
  const supabase = await createSupabaseServerClient();
  const fromId = String(formData.get("from_branch_id") ?? "").trim();
  const toId = String(formData.get("to_branch_id") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 500);
  const items = parseItems(String(formData.get("items_json") ?? ""), 1);
  const back = `${LIST_PATH}/nuevo`;

  const claim = await claimAdminFormToken(
    supabase,
    readSubmissionToken(formData),
    "stock_transfer_send",
  );
  if (claim === "duplicate") redirect(LIST_PATH);
  if (claim === "error" || !items || fromId === toId) {
    redirect(`${back}?error=invalid`);
  }

  const accessible = new Set(perm.branchContext.available.map((branch) => branch.id));
  if (!accessible.has(fromId) || !accessible.has(toId)) {
    redirect(`${back}?error=invalid`);
  }

  const { data: transferId, error } = await supabase.rpc("send_stock_transfer", {
    p_from_branch_id: fromId,
    p_to_branch_id: toId,
    p_items: items,
    p_notes: notes,
  });

  if (error || !transferId) {
    console.error("send_stock_transfer", error);
    const message = stockTransferErrorMessage(error?.message);
    redirect(`${back}?error=send&message=${encodeURIComponent(message)}`);
  }

  const fromName =
    perm.branchContext.available.find((branch) => branch.id === fromId)?.name ?? "Origen";
  const toName =
    perm.branchContext.available.find((branch) => branch.id === toId)?.name ?? "Destino";
  const units = items.reduce((sum, item) => sum + item.quantity, 0);
  await logAdminActivity(supabase, {
    actorId: perm.userId,
    actionType: "stock_transferred",
    entityType: "stock_transfer",
    entityId: String(transferId),
    summary: `Traslado enviado · ${fromName} → ${toName} · ${units} u.`,
    metadata: {
      from_branch_id: fromId,
      to_branch_id: toId,
      from_branch_name: fromName,
      to_branch_name: toName,
      quantity: units,
      lines: items.length,
      status: "in_transit",
    },
  });

  revalidateTransfer(String(transferId));
  redirect(`${LIST_PATH}/${transferId}`);
}

async function closeTransfer(
  formData: FormData,
  kind: "receive" | "cancel",
) {
  const perm = await requireAdminAnyPermission([
    "stock_transferir",
    "inventario_ver",
  ]);
  const supabase = await createSupabaseServerClient();
  const id = String(formData.get("transfer_id") ?? "").trim();
  const requested = String(formData.get("return_to") ?? "");
  const detail = /^[0-9a-f-]{36}$/i.test(id) ? `${LIST_PATH}/${id}` : LIST_PATH;
  const page =
    requested === LIST_PATH || requested.startsWith(`${LIST_PATH}?`) || requested === detail
      ? requested
      : detail;
  const claim = await claimAdminFormToken(
    supabase,
    readSubmissionToken(formData),
    `stock_transfer_${kind}:${id}`,
  );
  if (claim === "duplicate") redirect(page);
  if (claim === "error") redirect(`${page}?error=invalid`);

  const receivedItems =
    kind === "receive" ? parseItems(String(formData.get("items_json") ?? ""), 0) : null;
  const cancelNote =
    kind === "cancel" ? String(formData.get("notes") ?? "").trim().slice(0, 500) : "";
  if (kind === "receive" && !receivedItems) redirect(`${page}?error=invalid`);
  if (kind === "cancel" && cancelNote.length < 1) {
    redirect(`${page}?error=cancel&message=${encodeURIComponent("Escribe la nota para anular el traslado.")}`);
  }

  const rpc = kind === "receive" ? "receive_stock_transfer" : "cancel_stock_transfer";
  const { error } = await supabase.rpc(
    rpc,
    kind === "receive"
      ? { p_transfer_id: id, p_items: receivedItems }
      : { p_transfer_id: id, p_notes: cancelNote },
  );
  if (error) {
    console.error(rpc, error);
    const message = stockTransferErrorMessage(error.message);
    redirect(`${page}?error=${kind}&message=${encodeURIComponent(message)}`);
  }

  const { data: row } = await supabase
    .from("stock_transfers")
    .select("from_branch_name,to_branch_name,stock_transfer_items(quantity,received_quantity)")
    .eq("id", id)
    .maybeSingle();
  const sent = Array.isArray(row?.stock_transfer_items)
    ? row.stock_transfer_items.reduce(
        (sum, item) => sum + Math.max(0, Number(item.quantity) || 0),
        0,
      )
    : 0;
  const received = Array.isArray(row?.stock_transfer_items)
    ? row.stock_transfer_items.reduce(
        (sum, item) => sum + Math.max(0, Number(item.received_quantity) || 0),
        0,
      )
    : 0;
  const fromName = String(row?.from_branch_name ?? "Origen");
  const toName = String(row?.to_branch_name ?? "Destino");
  const receivedLabel = received === sent ? `${received} u.` : `${received} de ${sent} u.`;
  await logAdminActivity(supabase, {
    actorId: perm.userId,
    actionType: "stock_transferred",
    entityType: "stock_transfer",
    entityId: id,
    summary:
      kind === "receive"
        ? `Traslado recibido · ${fromName} → ${toName} · ${receivedLabel}`
        : `Traslado anulado · ${fromName} → ${toName} · ${sent} u. devueltas`,
    metadata: {
      from_branch_name: fromName,
      to_branch_name: toName,
      quantity: kind === "receive" ? received : sent,
      status: kind === "receive" ? "received" : "cancelled",
      ...(kind === "cancel" ? { cancel_notes: cancelNote } : {}),
    },
  });

  revalidateTransfer(id);
  redirect(page);
}

export async function receiveStockTransfer(formData: FormData) {
  await closeTransfer(formData, "receive");
}

export async function cancelStockTransfer(formData: FormData) {
  await closeTransfer(formData, "cancel");
}
