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
  expandKitLinesToProductQty,
  type KitComponentDeduction,
  type ProductKitRow,
} from "@/lib/product-kits";
import { fetchKitsByIdsWithItems } from "@/lib/load-product-kits";
import {
  allocateAvailableStock,
  encodeQuotationStockNotices,
  type QuotationStockNotice,
} from "@/lib/quotation-stock-notice";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTenantBrandForRequest } from "@/lib/tenant-context";
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
  }

  const working = new Map<string, { local: number; warehouse: number }>();
  for (const [pid, p] of productById) {
    working.set(pid, {
      local: Math.max(0, Math.floor(Number(p.stock_local ?? 0))),
      warehouse: Math.max(0, Math.floor(Number(p.stock_warehouse ?? 0))),
    });
  }

  const stockNotices: QuotationStockNotice[] = [];

  function takeFromWorking(
    pid: string,
    need: number,
    fallbackName: string,
  ): { takeL: number; takeW: number } {
    const p = productById.get(pid);
    const bin = working.get(pid) ?? { local: 0, warehouse: 0 };
    const hadLocal = bin.local;
    const hadWarehouse = bin.warehouse;
    const alloc = allocateAvailableStock(need, hadLocal, hadWarehouse);
    bin.local -= alloc.takeL;
    bin.warehouse -= alloc.takeW;
    working.set(pid, bin);
    if (hadLocal < need) {
      stockNotices.push({
        name: p?.name ?? fallbackName,
        need,
        hadLocal,
        hadWarehouse,
        tookLocal: alloc.takeL,
        tookWarehouse: alloc.takeW,
      });
    }
    return { takeL: alloc.takeL, takeW: alloc.takeW };
  }

  type ProductLineDeduction = {
    itemId: string;
    productId: string;
    name: string;
    takeL: number;
    takeW: number;
  };
  const productLineDeductions: ProductLineDeduction[] = [];
  const kitDeductionsByItemId = new Map<string, KitComponentDeduction[]>();

  for (const row of items ?? []) {
    if (!row.product_id) continue;
    const qty = Math.max(0, Math.floor(Number(row.quantity ?? 0)));
    if (qty < 1) continue;
    const pid = String(row.product_id);
    const name = String(row.product_name_snapshot ?? "Producto");
    const took = takeFromWorking(pid, qty, name);
    productLineDeductions.push({
      itemId: String(row.id),
      productId: pid,
      name,
      takeL: took.takeL,
      takeW: took.takeW,
    });
  }

  for (const kl of kitLines) {
    const kit = kitsById.get(kl.kitId);
    const item = (items ?? []).find((r) => String(r.kit_id) === kl.kitId);
    if (!kit || !item) continue;
    const deductions = (kit.items ?? []).map((comp) => {
      const pid = String(comp.product_id);
      const perKit = Math.max(1, Math.floor(Number(comp.quantity ?? 0)));
      const need = perKit * Math.max(1, Math.floor(kl.quantity));
      const name = String(comp.products?.name ?? kl.name);
      const took = takeFromWorking(pid, need, name);
      return {
        product_id: pid,
        stock_deducted_local: took.takeL,
        stock_deducted_warehouse: took.takeW,
      };
    });
    kitDeductionsByItemId.set(String(item.id), deductions);
  }

  async function undoStockDecrement() {
    for (const [pid, orig] of productById) {
      await supabase
        .from("products")
        .update({
          stock_local: orig.stock_local,
          stock_warehouse: orig.stock_warehouse,
        })
        .eq("id", pid);
    }
    for (const row of items ?? []) {
      if (!row.product_id && !row.kit_id) continue;
      await supabase
        .from("order_items")
        .update({
          stock_deducted_local: 0,
          stock_deducted_warehouse: 0,
          kit_component_deductions: null,
        })
        .eq("id", row.id);
    }
  }

  for (const [pid, orig] of productById) {
    const next = working.get(pid);
    if (!next) continue;
    const origL = Math.max(0, Math.floor(Number(orig.stock_local ?? 0)));
    const origW = Math.max(0, Math.floor(Number(orig.stock_warehouse ?? 0)));
    if (next.local === origL && next.warehouse === origW) continue;
    const { error: stockErr } = await supabase
      .from("products")
      .update({
        stock_local: next.local,
        stock_warehouse: next.warehouse,
      })
      .eq("id", pid);
    if (stockErr) {
      console.error("convertQuotationToSaleAction stock", stockErr);
      await undoStockDecrement();
      redirectOrder(orderId, "db");
    }
  }

  for (const line of productLineDeductions) {
    const { data: marked, error: markErr } = await supabase
      .from("order_items")
      .update({
        stock_deducted_local: line.takeL,
        stock_deducted_warehouse: line.takeW,
      })
      .eq("id", line.itemId)
      .select("id")
      .maybeSingle();
    if (markErr || !marked?.id) {
      console.error("convertQuotationToSaleAction mark product stock", markErr);
      await undoStockDecrement();
      redirectOrder(orderId, "db");
    }
  }

  for (const [itemId, deductions] of kitDeductionsByItemId) {
    const { data: kitMarked, error: kitMarkErr } = await supabase
      .from("order_items")
      .update({ kit_component_deductions: deductions })
      .eq("id", itemId)
      .select("id")
      .maybeSingle();
    if (kitMarkErr || !kitMarked?.id) {
      console.error("convertQuotationToSaleAction mark kit stock", kitMarkErr);
      await undoStockDecrement();
      redirectOrder(orderId, "db");
    }
  }

  const { data: paidRow, error: updErr } = await supabase
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
    .eq("status", "quotation")
    .select("id")
    .maybeSingle();

  if (updErr || !paidRow?.id) {
    console.error("convertQuotationToSaleAction update", updErr);
    await undoStockDecrement();
    redirectOrder(orderId, "db");
  }

  const stockTrace = buildPosSaleStockTrace({
    productLines: productLineDeductions.map((l) => ({
      productId: l.productId,
      name: l.name,
      quantity: l.takeL + l.takeW,
      deductedLocal: l.takeL,
      deductedWarehouse: l.takeW,
    })),
    kitLines: kitLines.flatMap((kl) => {
      const kit = kitsById.get(kl.kitId);
      if (!kit) return [];
      const item = (items ?? []).find((r) => String(r.kit_id) === kl.kitId);
      const deductions = item
        ? (kitDeductionsByItemId.get(String(item.id)) ?? [])
        : [];
      const productNames = new Map(
        (kit.items ?? []).map((row) => [
          String(row.product_id),
          String(row.products?.name ?? "Producto"),
        ]),
      );
      return [
        {
          kitName: kl.name,
          deductions,
          productNames,
        },
      ];
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
      stock_shortages: stockNotices,
      ...activityStockTraceToMetadata(stockTrace),
    },
  });

  revalidatePath("/admin/ventas");
  revalidatePath(`/admin/orders/${orderId}`);
  const qs = new URLSearchParams({ facturada: "1" });
  if (stockNotices.length > 0) {
    qs.set("stock", encodeQuotationStockNotices(stockNotices));
  }
  redirect(`/admin/orders/${orderId}?${qs.toString()}`);
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
  const brand = await getTenantBrandForRequest();
  const { subject, html, text } = buildQuotationEmailHtml({
    invoiceRef,
    customerName: String(order.customer_name ?? "Cliente"),
    createdAt: order.created_at ? String(order.created_at) : null,
    totalCents: Math.max(0, Math.floor(Number(order.total_cents ?? 0))),
    brand,
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
