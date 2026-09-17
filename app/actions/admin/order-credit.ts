"use server";

import { logAdminActivity } from "@/lib/admin-activity-log";
import { insertOrderCreditPayments } from "@/lib/insert-order-credit-payments";
import { formatCop } from "@/lib/money";
import {
  isPosCreditSale,
  orderCreditPendingCents,
  parseOrderCreditPaymentMethod,
  sumOrderCreditPaidCents,
} from "@/lib/order-credit";
import {
  assertCashRegisterOpenForStaff,
  requireAdminPermission,
} from "@/lib/require-admin-permission";
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
    Math.floor(Number.parseInt(String(formData.get("amount_cents") ?? "0"), 10) || 0),
  );
  const paymentMethod = parseOrderCreditPaymentMethod(
    String(formData.get("payment_method") ?? ""),
  );
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!orderId) redirect("/admin/creditos");
  if (amount <= 0 || !paymentMethod) redirectCredit(orderId, "abono");

  if (paymentMethod === "cash") {
    await assertCashRegisterOpenForStaff();
  }

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
    .select("amount_cents")
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
