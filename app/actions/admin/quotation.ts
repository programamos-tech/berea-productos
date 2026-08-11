"use server";

import { logAdminActivity } from "@/lib/admin-activity-log";
import {
  activityStockTraceToMetadata,
  buildPosSaleStockTrace,
} from "@/lib/activity-log-stock";
import { formatCop } from "@/lib/money";
import { buildQuotationEmailHtml } from "@/lib/quotation-email";
import {
  assertCashRegisterOpenForStaff,
  requireAdminPermission,
} from "@/lib/require-admin-permission";
import { sendHtmlEmail } from "@/lib/email/send";
import {
  buildKitPosComponentDeductions,
  expandKitLinesToProductQty,
  type ProductKitRow,
} from "@/lib/product-kits";
import { fetchKitsByIdsWithItems } from "@/lib/load-product-kits";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ventaNumeroReferencia } from "@/lib/ventas-sales";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function redirectOrder(orderId: string, error?: string): never {
  if (error) {
    redirect(`/admin/orders/${orderId}?error=${encodeURIComponent(error)}`);
  }
  redirect(`/admin/orders/${orderId}`);
}

/**
 * Convierte cotización → venta pagada: descuenta stock y marca paid.
 */
export async function convertQuotationToSaleAction(formData: FormData) {
  const { userId } = await requireAdminPermission("ventas_crear");
  await assertCashRegisterOpenForStaff();
  const supabase = await createSupabaseServerClient();

  const orderId = String(formData.get("order_id") ?? "").trim();
  const paymentMethod = String(formData.get("payment_method") ?? "").trim();
  if (!orderId) redirect("/admin/ventas");
  if (
    paymentMethod !== "cash" &&
    paymentMethod !== "transfer" &&
    paymentMethod !== "mixed"
  ) {
    redirectOrder(orderId, "payment");
  }

  const mixedCash = Math.floor(
    Number.parseInt(String(formData.get("mixed_cash_cents") ?? "0"), 10) || 0,
  );
  const mixedTransfer = Math.floor(
    Number.parseInt(String(formData.get("mixed_transfer_cents") ?? "0"), 10) || 0,
  );

  const { data: order, error: oErr } = await supabase
    .from("orders")
    .select(
      "id,status,total_cents,customer_id,customer_name,wompi_reference",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (oErr || !order) redirectOrder(orderId, "missing");
  if (String(order.status) !== "quotation") {
    redirectOrder(orderId, "not_quotation");
  }

  const totalCents = Math.max(0, Math.floor(Number(order.total_cents ?? 0)));
  if (paymentMethod === "mixed" && mixedCash + mixedTransfer !== totalCents) {
    redirectOrder(orderId, "payment");
  }

  const { data: items, error: iErr } = await supabase
    .from("order_items")
    .select(
      "id,product_id,kit_id,quantity,product_name_snapshot,stock_deducted_local",
    )
    .eq("order_id", orderId);

  if (iErr || !items) redirectOrder(orderId, "db");

  const productLines = (items ?? [])
    .filter((r) => r.product_id)
    .map((r) => ({
      productId: String(r.product_id),
      quantity: Math.max(0, Math.floor(Number(r.quantity ?? 0))),
      name: String(r.product_name_snapshot ?? "Producto"),
    }))
    .filter((r) => r.quantity > 0);

  const kitLines = (items ?? [])
    .filter((r) => r.kit_id)
    .map((r) => ({
      kitId: String(r.kit_id),
      quantity: Math.max(0, Math.floor(Number(r.quantity ?? 0))),
      name: String(r.product_name_snapshot ?? "Kit"),
    }))
    .filter((r) => r.quantity > 0);

  const kitIds = [...new Set(kitLines.map((k) => k.kitId))];
  const kitsLoaded =
    kitIds.length > 0
      ? await fetchKitsByIdsWithItems(supabase, kitIds)
      : ([] as ProductKitRow[]);
  const kitsById = new Map(kitsLoaded.map((k) => [k.id, k]));

  const qtyByProduct = new Map<string, number>();
  for (const l of productLines) {
    qtyByProduct.set(l.productId, (qtyByProduct.get(l.productId) ?? 0) + l.quantity);
  }
  const expanded = expandKitLinesToProductQty(
    kitLines.map((k) => ({ kitId: k.kitId, quantity: k.quantity })),
    kitsById,
  );
  for (const [pid, qty] of expanded) {
    qtyByProduct.set(pid, (qtyByProduct.get(pid) ?? 0) + qty);
  }

  const productIds = [...qtyByProduct.keys()];
  const productById = new Map<
    string,
    { id: string; name: string; stock_local: number | null; stock_warehouse: number | null }
  >();
  if (productIds.length > 0) {
    const { data: products, error: pErr } = await supabase
      .from("products")
      .select("id,name,stock_local,stock_warehouse")
      .in("id", productIds);
    if (pErr || !products) redirectOrder(orderId, "db");
    for (const p of products ?? []) {
      productById.set(String(p.id), {
        id: String(p.id),
        name: String(p.name ?? "Producto"),
        stock_local: p.stock_local as number | null,
        stock_warehouse: p.stock_warehouse as number | null,
      });
    }
    for (const [pid, qty] of qtyByProduct) {
      const p = productById.get(pid);
      if (!p) redirectOrder(orderId, "stock");
      if (Number(p.stock_local ?? 0) < qty) redirectOrder(orderId, "stock");
    }
  }

  const stockItems = [...qtyByProduct.entries()].map(([product_id, quantity]) => ({
    product_id,
    quantity,
  }));
  if (stockItems.length > 0) {
    const { error: stockErr } = await supabase.rpc("decrement_products_stock_local", {
      p_items: stockItems,
    });
    if (stockErr) {
      console.error("convertQuotationToSaleAction stock", stockErr);
      redirectOrder(orderId, "stock");
    }
  }

  for (const row of items ?? []) {
    if (!row.product_id) continue;
    const qty = Math.max(0, Math.floor(Number(row.quantity ?? 0)));
    await supabase
      .from("order_items")
      .update({ stock_deducted_local: qty })
      .eq("id", row.id);
  }

  for (const kl of kitLines) {
    const kit = kitsById.get(kl.kitId);
    if (!kit) continue;
    const deductions = buildKitPosComponentDeductions(kit, kl.quantity);
    const item = (items ?? []).find((r) => String(r.kit_id) === kl.kitId);
    if (item) {
      await supabase
        .from("order_items")
        .update({ kit_component_deductions: deductions })
        .eq("id", item.id);
    }
  }

  const { error: updErr } = await supabase
    .from("orders")
    .update({
      status: "paid",
      wompi_reference: `POS:${paymentMethod}`,
      ...(paymentMethod === "mixed"
        ? {
            pos_mixed_cash_cents: mixedCash,
            pos_mixed_transfer_cents: mixedTransfer,
          }
        : {
            pos_mixed_cash_cents: null,
            pos_mixed_transfer_cents: null,
          }),
    })
    .eq("id", orderId)
    .eq("status", "quotation");

  if (updErr) {
    console.error("convertQuotationToSaleAction update", updErr);
    redirectOrder(orderId, "db");
  }

  const stockTrace = buildPosSaleStockTrace({
    productLines: productLines.map((l) => ({
      productId: l.productId,
      name: l.name,
      quantity: l.quantity,
    })),
    kitLines: kitLines.map((kl) => {
      const kit = kitsById.get(kl.kitId)!;
      const productNames = new Map(
        (kit.items ?? []).map((row) => [
          String(row.product_id),
          String(row.products?.name ?? "Producto"),
        ]),
      );
      return {
        kitName: kl.name,
        deductions: buildKitPosComponentDeductions(kit, kl.quantity),
        productNames,
      };
    }),
    stockByProductId: productById,
  });

  void logAdminActivity(supabase, {
    actorId: userId,
    actionType: "sale_created",
    entityType: "order",
    entityId: orderId,
    summary: `Cotización facturada · ${String(order.customer_name ?? "Cliente")} · ${formatCop(totalCents)}`,
    metadata: {
      from_quotation: true,
      payment_method: paymentMethod,
      total_cents: totalCents,
      ...activityStockTraceToMetadata(stockTrace),
    },
  });

  revalidatePath("/admin/ventas");
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}?facturada=1`);
}

export async function sendQuotationEmailAction(formData: FormData): Promise<
  | { ok: true }
  | { ok: false; error: string }
> {
  await requireAdminPermission("ventas_crear");
  const supabase = await createSupabaseServerClient();
  const orderId = String(formData.get("order_id") ?? "").trim();
  const toOverride = String(formData.get("to_email") ?? "").trim().toLowerCase();

  if (!orderId) return { ok: false, error: "missing" };

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id,status,total_cents,customer_name,customer_email,created_at,currency",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order || String(order.status) !== "quotation") {
    return { ok: false, error: "not_quotation" };
  }

  const to =
    toOverride ||
    (order.customer_email && !String(order.customer_email).includes("@local.invalid")
      ? String(order.customer_email).trim().toLowerCase()
      : "");

  if (!to || !to.includes("@")) {
    return { ok: false, error: "no_email" };
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("product_name_snapshot,quantity,unit_price_cents")
    .eq("order_id", orderId);

  const invoiceRef = ventaNumeroReferencia(orderId);
  const { subject, html, text } = buildQuotationEmailHtml({
    invoiceRef,
    customerName: String(order.customer_name ?? "Cliente"),
    createdAt: order.created_at ? String(order.created_at) : null,
    totalCents: Math.max(0, Math.floor(Number(order.total_cents ?? 0))),
    lines: (items ?? []).map((it) => ({
      name: String(it.product_name_snapshot ?? "Producto"),
      quantity: Math.max(0, Math.floor(Number(it.quantity ?? 0))),
      unitPriceCents: Math.max(0, Math.floor(Number(it.unit_price_cents ?? 0))),
    })),
  });

  const result = await sendHtmlEmail({ to, subject, html, text });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}
