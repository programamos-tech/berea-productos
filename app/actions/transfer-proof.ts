"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const BUCKET = "order-payment-proofs";
const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

/** Mientras el pedido no esté cancelado/fallido, se puede subir comprobante. */
function transferProofUploadAllowed(status: string): boolean {
  return status !== "cancelled" && status !== "failed";
}

function inferMime(file: File): string {
  const fromType = (file.type || "").toLowerCase();
  if (fromType) return fromType;
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".pdf")) return "application/pdf";
  return "";
}

function extFromMime(mime: string): string | null {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "application/pdf") return "pdf";
  return null;
}

export type TransferProofActionResult =
  | { ok: true; deadlineIso: string | null }
  | { ok: false; error: string };

/** Abre el flujo de subida (sin ventana de tiempo). */
export async function openTransferProofUploadWindow(
  orderId: string,
  token: string,
): Promise<TransferProofActionResult> {
  const tid = token.trim();
  if (!orderId || !tid) {
    return { ok: false, error: "Datos incompletos." };
  }

  const supabase = createSupabaseServiceClient();
  const { data: row, error } = await supabase
    .from("orders")
    .select("id, checkout_payment_method, transfer_session_token, status")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !row) {
    return { ok: false, error: "Pedido no encontrado." };
  }
  if (String(row.checkout_payment_method) !== "transfer") {
    return { ok: false, error: "Este pedido no admite comprobante por transferencia." };
  }
  if (String(row.transfer_session_token) !== tid) {
    return { ok: false, error: "Enlace inválido o vencido." };
  }
  if (!transferProofUploadAllowed(String(row.status))) {
    return { ok: false, error: "Este pedido está cancelado y no admite comprobante." };
  }

  return { ok: true, deadlineIso: null };
}

export type UploadTransferProofResult =
  | { ok: true; proofCount: number }
  | { ok: false; error: string };

export type ParsedTransferProof =
  | {
      ok: true;
      buf: Buffer;
      mime: string;
      ext: string;
      filename: string;
    }
  | { ok: false; error: string };

/** Lee y valida el archivo antes de crear el pedido. */
export async function parseTransferProofFile(
  file: FormDataEntryValue | null,
): Promise<ParsedTransferProof> {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecciona el comprobante de la transferencia." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "El archivo supera 5 MB." };
  }
  const mime = inferMime(file);
  if (!ALLOWED_TYPES.has(mime)) {
    return { ok: false, error: "Solo se permiten JPG, PNG, WebP o PDF." };
  }
  const ext = extFromMime(mime);
  if (!ext) {
    return { ok: false, error: "Tipo de archivo no admitido." };
  }
  return {
    ok: true,
    buf: Buffer.from(await file.arrayBuffer()),
    mime,
    ext,
    filename: file.name?.slice(0, 240) || `comprobante.${ext}`,
  };
}

export async function getTransferProofDeadline(
  orderId: string,
  token: string,
): Promise<{ deadlineIso: string | null } | { error: string }> {
  const tid = token.trim();
  if (!orderId || !tid) return { error: "Datos incompletos." };

  const supabase = createSupabaseServiceClient();
  const { data: row, error } = await supabase
    .from("orders")
    .select("transfer_session_token, checkout_payment_method, status")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !row) return { error: "Pedido no encontrado." };
  if (String(row.transfer_session_token) !== tid) return { error: "Enlace inválido." };
  if (String(row.checkout_payment_method) !== "transfer") {
    return { error: "Pedido no válido." };
  }
  if (!transferProofUploadAllowed(String(row.status))) {
    return { deadlineIso: null };
  }

  // Ya no usamos deadline; el cliente solo verifica acceso.
  return { deadlineIso: null };
}

export async function uploadTransferProof(
  _prev: UploadTransferProofResult | null,
  formData: FormData,
): Promise<UploadTransferProofResult> {
  const orderId = String(formData.get("orderId") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();
  const tid = token.trim();
  if (!orderId || !tid) {
    return { ok: false, error: "Datos incompletos." };
  }

  const proofFile = await parseTransferProofFile(formData.get("file"));
  if (!proofFile.ok) return proofFile;

  const supabase = createSupabaseServiceClient();
  const { data: row, error } = await supabase
    .from("orders")
    .select(
      "id, checkout_payment_method, transfer_session_token, status, fulfillment_status",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !row) {
    return { ok: false, error: "Pedido no encontrado." };
  }
  if (String(row.checkout_payment_method) !== "transfer") {
    return { ok: false, error: "Este pedido no admite comprobante por transferencia." };
  }
  if (String(row.transfer_session_token) !== tid) {
    return { ok: false, error: "Enlace inválido." };
  }
  if (!transferProofUploadAllowed(String(row.status))) {
    return { ok: false, error: "Este pedido está cancelado y no admite comprobante." };
  }

  const objectPath = `${orderId}/${randomUUID()}.${proofFile.ext}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, proofFile.buf, {
      contentType: proofFile.mime,
      upsert: false,
    });

  if (upErr) {
    if (process.env.NODE_ENV === "development") {
      console.error("[transfer-proof] storage upload:", upErr.message);
    }
    return { ok: false, error: "No se pudo guardar el archivo. Intenta de nuevo." };
  }

  const { error: insErr } = await supabase.from("order_transfer_proofs").insert({
    order_id: orderId,
    storage_path: objectPath,
    original_filename: proofFile.filename,
  });

  if (insErr) {
    await supabase.storage.from(BUCKET).remove([objectPath]);
    return { ok: false, error: "No se pudo registrar el comprobante." };
  }

  const status = String(row.status);
  const fulfillment =
    row.fulfillment_status != null ? String(row.fulfillment_status) : null;

  // Primera confirmación: marcar pagado. Si ya estaba pagado, no tocar el fulfillment avanzado.
  const patch: Record<string, unknown> = {
    transfer_upload_deadline_at: null,
  };
  if (status === "pending") {
    patch.status = "paid";
    if (!fulfillment || fulfillment === "awaiting_payment") {
      patch.fulfillment_status = "preparing";
    }
  }

  await supabase
    .from("orders")
    .update(patch)
    .eq("id", orderId)
    .eq("transfer_session_token", tid);

  const { count: proofCount } = await supabase
    .from("order_transfer_proofs")
    .select("id", { count: "exact", head: true })
    .eq("order_id", orderId);

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/ventas");
  revalidatePath("/pedido");
  revalidatePath("/cuenta/pedidos");
  revalidatePath(`/cuenta/pedidos/${orderId}`);

  return { ok: true, proofCount: proofCount ?? 1 };
}

/** Guarda el comprobante de un pedido recién creado. Si falla, no deja archivo suelto. */
export async function saveOrderTransferProof(
  orderId: string,
  proof: Extract<ParsedTransferProof, { ok: true }>,
): Promise<{ ok: true; objectPath: string } | { ok: false; error: string }> {
  const supabase = createSupabaseServiceClient();
  const objectPath = `${orderId}/${randomUUID()}.${proof.ext}`;
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(objectPath, proof.buf, {
    contentType: proof.mime,
    upsert: false,
  });
  if (upErr) {
    return { ok: false, error: "No se pudo guardar el comprobante." };
  }
  const { error: insErr } = await supabase.from("order_transfer_proofs").insert({
    order_id: orderId,
    storage_path: objectPath,
    original_filename: proof.filename,
  });
  if (insErr) {
    await supabase.storage.from(BUCKET).remove([objectPath]);
    return { ok: false, error: "No se pudo registrar el comprobante." };
  }
  return { ok: true, objectPath };
}

export async function removeOrderTransferProofObject(objectPath: string): Promise<void> {
  if (!objectPath) return;
  const supabase = createSupabaseServiceClient();
  await supabase.storage.from(BUCKET).remove([objectPath]);
}
