"use server";

import { logAdminActivity } from "@/lib/admin-activity-log";
import { insertOrderCreditPayments } from "@/lib/insert-order-credit-payments";
import { formatCop, parseCopInputDigitsToInt } from "@/lib/money";
import { fetchOpenCashSession } from "@/lib/cash-register";
import {
  CREDIT_PAYMENT_CANCELLATION_REASON_MIN_LENGTH,
  isPosCreditSale,
  orderCreditPendingCents,
  parseOrderCreditPaymentMethod,
  sumOrderCreditPaidCents,
} from "@/lib/order-credit";
import {
  assertCashRegisterOpenForStaff,
  requireAdminPermission,
} from "@/lib/require-admin-permission";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ventaNumeroReferencia } from "@/lib/ventas-sales";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function redirectCredit(orderId: string, error?: string): never {
  if (error) {
    redirect(`/admin/creditos/${orderId}?error=${encodeURIComponent(error)}`);
  }
  redirect(`/admin/creditos/${orderId}`);
}

export async function registerOrderCreditPaymentAction(formData: FormData) {
  const { userId } = await requireAdminPermission("creditos_abonar");
  const supabase = await createSupabaseServerClient();

  const orderId = String(formData.get("order_id") ?? "").trim();
  const amount = Math.max(
    0,
    parseCopInputDigitsToInt(String(formData.get("amount_cents") ?? "0")),
  );
  const paymentMethod = parseOrderCreditPaymentMethod(
    String(formData.get("payment_method") ?? ""),
  );
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!orderId) redirect("/admin/creditos");
  if (amount <= 0 || !paymentMethod) redirectCredit(orderId, "abono");

  await assertCashRegisterOpenForStaff();

  const actorSession = await fetchOpenCashSession(supabase);

  const { data: order, error: oErr } = await supabase
    .from("orders")
    .select("id,status,total_cents,wompi_reference,customer_name,customer_id")
    .eq("id", orderId)
    .maybeSingle();

  if (oErr || !order) redirectCredit(orderId, "missing");
  if (!isPosCreditSale(String(order.wompi_reference ?? ""))) {
    redirectCredit(orderId, "not_credit");
  }
  if (String(order.status) === "cancelled") {
    redirectCredit(orderId, "cancelled");
  }
  if (String(order.status) !== "paid") {
    redirectCredit(orderId, "not_credit");
  }

  const { data: pays, error: pErr } = await supabase
    .from("order_payments")
    .select("amount_cents,is_cancelled")
    .eq("order_id", orderId);
  if (pErr) redirectCredit(orderId, "db");

  const totalCents = Math.max(0, Math.floor(Number(order.total_cents ?? 0)));
  const paidCents = sumOrderCreditPaidCents(pays ?? []);
  const pendingCents = orderCreditPendingCents(totalCents, paidCents);
  if (pendingCents <= 0) redirectCredit(orderId, "paid");
  if (amount > pendingCents) redirectCredit(orderId, "overpay");

  const payResult = await insertOrderCreditPayments(supabase, {
    orderId,
    createdBy: userId,
    payments: [{ amountCents: amount, paymentMethod, notes }],
    cashRegisterSessionId: actorSession?.id ?? null,
  });
  if (payResult !== "ok") redirectCredit(orderId, "db");

  const remaining = orderCreditPendingCents(totalCents, paidCents + amount);
  const invoiceRef = ventaNumeroReferencia(orderId);

  void logAdminActivity(supabase, {
    actorId: userId,
    actionType: "credit_payment",
    entityType: "order",
    entityId: orderId,
    summary: `Abono ${formatCop(amount)} · factura ${invoiceRef} · ${String(order.customer_name ?? "Cliente")}`,
    metadata: {
      amount_cents: amount,
      payment_method: paymentMethod,
      pending_cents: remaining,
      notes,
    },
  });

  revalidatePath("/admin/creditos");
  revalidatePath(`/admin/creditos/${orderId}`);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/ventas");
  revalidatePath("/admin/caja");
  const customerId = String(
    (order as { customer_id?: string | null }).customer_id ?? "",
  ).trim();
  if (customerId) revalidatePath(`/admin/customers/${customerId}`);
  redirectCredit(orderId);
}

function revalidateCreditSurfaces(orderId: string, customerId?: string) {
  revalidatePath("/admin/creditos");
  revalidatePath(`/admin/creditos/${orderId}`);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/ventas");
  revalidatePath("/admin/caja");
  revalidatePath("/admin");
  if (customerId) revalidatePath(`/admin/customers/${customerId}`);
}

export async function cancelOrderCreditPayment(
  paymentId: string,
  cancellationReason: string,
): Promise<
  | { ok: true }
  | {
      ok: false;
      error:
        | "invalid"
        | "auth"
        | "forbidden"
        | "reason_required"
        | "not_found"
        | "already_cancelled"
        | "not_credit"
        | "db";
    }
> {
  const id = String(paymentId ?? "").trim();
  if (!id) return { ok: false, error: "invalid" };

  const reason = String(cancellationReason ?? "").trim();
  if (reason.length < CREDIT_PAYMENT_CANCELLATION_REASON_MIN_LENGTH) {
    return { ok: false, error: "reason_required" };
  }

  const perm = await loadAdminPermissions();
  if (!perm) return { ok: false, error: "auth" };
  if (!perm.permissions.creditos_abonar) {
    return { ok: false, error: "forbidden" };
  }
  const supabase = await createSupabaseServerClient();
  const userId = perm.userId;

  const { data: pay, error: pErr } = await supabase
    .from("order_payments")
    .select("id,order_id,amount_cents,payment_method,is_cancelled")
    .eq("id", id)
    .maybeSingle();

  if (pErr) return { ok: false, error: "db" };
  if (!pay) return { ok: false, error: "not_found" };
  if (pay.is_cancelled === true) return { ok: false, error: "already_cancelled" };

  const orderId = String(pay.order_id ?? "");
  const { data: order, error: oErr } = await supabase
    .from("orders")
    .select("id,status,wompi_reference,customer_name,customer_id")
    .eq("id", orderId)
    .maybeSingle();

  if (oErr || !order) return { ok: false, error: "not_found" };
  if (!isPosCreditSale(String(order.wompi_reference ?? ""))) {
    return { ok: false, error: "not_credit" };
  }

  const { error: updErr } = await supabase
    .from("order_payments")
    .update({
      is_cancelled: true,
      cancelled_at: new Date().toISOString(),
      cancelled_by: userId,
      cancellation_reason: reason,
    })
    .eq("id", id)
    .eq("is_cancelled", false);

  if (updErr) {
    console.error("cancelOrderCreditPayment", updErr.message);
    return { ok: false, error: "db" };
  }

  const amount = Math.max(0, Math.floor(Number(pay.amount_cents ?? 0)));
  const invoiceRef = ventaNumeroReferencia(orderId);

  void logAdminActivity(supabase, {
    actorId: userId,
    actionType: "credit_payment_cancelled",
    entityType: "order",
    entityId: orderId,
    summary: `Abono anulado ${formatCop(amount)} · factura ${invoiceRef} · ${String(order.customer_name ?? "Cliente")}`,
    metadata: {
      payment_id: id,
      amount_cents: amount,
      payment_method: pay.payment_method,
      cancellation_reason: reason,
    },
  });

  const customerId = String(
    (order as { customer_id?: string | null }).customer_id ?? "",
  ).trim();
  revalidateCreditSurfaces(orderId, customerId || undefined);
  return { ok: true };
}
