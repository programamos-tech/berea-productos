import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { verifyWompiEventIntegrity } from "@/lib/wompi";

export const runtime = "nodejs";

function mapTxnStatus(
  status: string | undefined,
): "paid" | "failed" | null {
  if (!status) return null;
  const u = status.toUpperCase();
  if (u === "APPROVED") return "paid";
  if (
    u === "DECLINED" ||
    u === "VOIDED" ||
    u === "ERROR" ||
    u === "CANCELED" ||
    u === "CANCELLED"
  ) {
    return "failed";
  }
  return null;
}

export async function POST(request: Request) {
  const raw = await request.text();
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  if (!verifyWompiEventIntegrity(body)) {
    return new Response("invalid signature", { status: 401 });
  }

  const data = (body as { data?: Record<string, unknown> }).data;
  const transaction = data?.transaction as
    | Record<string, unknown>
    | undefined;
  if (!transaction) {
    return new Response("ok", { status: 200 });
  }

  const txnId = transaction.id != null ? String(transaction.id) : null;
  const reference =
    transaction.reference != null ? String(transaction.reference) : null;
  const paymentLinkId =
    transaction.payment_link_id != null
      ? String(transaction.payment_link_id)
      : transaction.payment_link != null &&
          typeof transaction.payment_link === "object" &&
          "id" in (transaction.payment_link as object)
        ? String((transaction.payment_link as { id: unknown }).id)
        : null;

  const mapped = mapTxnStatus(
    transaction.status != null ? String(transaction.status) : undefined,
  );
  if (!mapped) {
    return new Response("ok", { status: 200 });
  }

  const supabase = createSupabaseServiceClient();

  let orderId: string | null = null;
  if (reference && /^[0-9a-f-]{36}$/i.test(reference)) {
    orderId = reference;
  }
  if (!orderId && paymentLinkId) {
    const { data: row } = await supabase
      .from("orders")
      .select("id")
      .eq("wompi_payment_link_id", paymentLinkId)
      .maybeSingle();
    orderId = (row?.id as string | undefined) ?? null;
  }

  if (!orderId) {
    return new Response("ok", { status: 200 });
  }

  const { error } = await supabase.rpc("process_wompi_order_status", {
    p_order_id: orderId,
    p_status: mapped,
    p_transaction_id: txnId,
    p_reference: reference,
  });
  if (error) {
    console.error("[wompi webhook] atomic status update", error, orderId);
    return new Response("db error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
