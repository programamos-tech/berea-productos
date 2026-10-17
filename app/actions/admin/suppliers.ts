"use server";

import { randomUUID } from "node:crypto";
import {
  verifyInsertedRowInDev,
  verifyRowCountAtLeastInDev,
} from "@/lib/admin-insert-verify";
import { todayYmdInReportStore } from "@/lib/admin-report-range";
import {
  EXPENSE_CONCEPT_SUPPLIER_PAYMENT,
  mapSupplierPaymentMethodToExpense,
} from "@/lib/expense-concepts";
import { fetchCurrentBranchInventoryMap } from "@/lib/branch-inventory";
import { fetchOpenCashSession } from "@/lib/cash-register";
import {
  assertActionPermission,
  assertCashRegisterOpenForStaff,
} from "@/lib/require-admin-permission";
import {
  DEFAULT_SUPPLIER_VAT_BPS,
  isSupplierReceiptStatus,
  supplierInvoiceFolioFromIssueDate,
  supplierLineGrossCents,
  supplierLineNetCents,
  type SupplierReceiptStatus,
} from "@/lib/supplier-invoices";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function revalidateSupplierPaths(supplierId: string, invoiceId?: string) {
  revalidatePath("/admin/proveedores");
  revalidatePath(`/admin/proveedores/${supplierId}`);
  revalidatePath("/admin/egresos");
  revalidatePath("/admin/caja");
  if (invoiceId) {
    revalidatePath(`/admin/proveedores/${supplierId}/facturas/${invoiceId}`);
  }
}

export async function createSupplierAction(formData: FormData) {
  await assertActionPermission("proveedores_ver");
  const supabase = await createSupabaseServerClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/admin/proveedores/nuevo?error=name");

  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      name,
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim().toLowerCase() || null,
      document_id: String(formData.get("document_id") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .select("id")
    .single();

  if (error || !data?.id) redirect("/admin/proveedores/nuevo?error=db");
  const supplierId = String(data.id);
  if (!(await verifyInsertedRowInDev(supabase, "suppliers", supplierId))) {
    redirect("/admin/proveedores/nuevo?error=db");
  }
  revalidatePath("/admin/proveedores");
  redirect(`/admin/proveedores/${supplierId}`);
}

export async function createSupplierFromOrderAction(formData: FormData) {
  await assertActionPermission("proveedores_ver");
  const supabase = await createSupabaseServerClient();
  const name = String(formData.get("name") ?? "").trim();
  const onList = String(formData.get("return_to") ?? "") === "lista";
  const back = onList
    ? "/admin/proveedores?crear=1&error=proveedor"
    : "/admin/proveedores/nueva-orden?error=proveedor";
  if (!name) redirect(back);

  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      name,
      document_id: String(formData.get("document_id") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim() || null,
    })
    .select("id")
    .single();

  if (error || !data?.id) redirect(back);
  const supplierId = String(data.id);
  if (!(await verifyInsertedRowInDev(supabase, "suppliers", supplierId))) {
    redirect(back);
  }
  revalidatePath("/admin/proveedores");
  revalidatePath("/admin/proveedores/nueva-orden");
  redirect(`/admin/proveedores/nueva-orden?proveedor=${encodeURIComponent(supplierId)}`);
}

type ParsedSupplierLine = {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  /** Basis points (1900 = 19 %). Omisión: 1900 en cliente; 0 = sin IVA. */
  vatRateBps?: number;
};

export async function createSupplierDebtAction(formData: FormData) {
  await assertActionPermission("proveedores_ver");
  const supabase = await createSupabaseServerClient();
  const supplierId = String(formData.get("supplier_id") ?? "").trim();
  const issueDateRaw = String(formData.get("issue_date") ?? "").trim().slice(0, 10);
  const issueDate = /^\d{4}-\d{2}-\d{2}$/.test(issueDateRaw)
    ? issueDateRaw
    : todayYmdInReportStore();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const totalCents = Math.max(
    0,
    Math.floor(Number.parseInt(String(formData.get("amount_cents") ?? "0"), 10) || 0),
  );
  const back = supplierId
    ? `/admin/proveedores/nueva-orden?proveedor=${encodeURIComponent(supplierId)}`
    : "/admin/proveedores/nueva-orden";

  if (!supplierId || totalCents <= 0) {
    redirect(`${back}${back.includes("?") ? "&" : "?"}error=validation`);
  }

  const { data: supplier } = await supabase
    .from("suppliers")
    .select("id")
    .eq("id", supplierId)
    .maybeSingle();
  if (!supplier) redirect(`${back}&error=validation`);

  const id = randomUUID();
  const folio = supplierInvoiceFolioFromIssueDate(issueDate, id);
  const { data: ins, error: insErr } = await supabase
    .from("supplier_invoices")
    .insert({
      id,
      supplier_id: supplierId,
      folio,
      total_cents: totalCents,
      issue_date: issueDate,
      notes,
    })
    .select("id")
    .single();

  if (insErr || !ins?.id) redirect(`${back}&error=db`);
  if (!(await verifyInsertedRowInDev(supabase, "supplier_invoices", ins.id))) {
    await supabase.from("supplier_invoices").delete().eq("id", ins.id);
    redirect(`${back}&error=db`);
  }

  revalidateSupplierPaths(supplierId, ins.id);
  redirect(`/admin/proveedores/${supplierId}/facturas/${ins.id}`);
}

export async function createSupplierInvoiceAction(formData: FormData) {
  await assertActionPermission("proveedores_ver");
  const supabase = await createSupabaseServerClient();
  const supplierId = String(formData.get("supplier_id") ?? "").trim();
  const issueDateRaw = String(formData.get("issue_date") ?? "").trim().slice(0, 10);
  const issueDate = /^\d{4}-\d{2}-\d{2}$/.test(issueDateRaw)
    ? issueDateRaw
    : new Date().toISOString().slice(0, 10);
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const rawPayload = String(formData.get("payload") ?? "").trim();
  const formContext = String(formData.get("form_context") ?? "hub").trim();

  const backPath =
    formContext === "orden"
      ? `/admin/proveedores/nueva-orden${supplierId ? `?proveedor=${encodeURIComponent(supplierId)}` : ""}`
      : formContext === "supplier" && supplierId
        ? `/admin/proveedores/${supplierId}/nueva-factura`
        : "/admin/proveedores/nueva-factura";
  const redirectValidation = () =>
    redirect(`${backPath}${backPath.includes("?") ? "&" : "?"}error=validation`);
  const redirectDb = () =>
    redirect(`${backPath}${backPath.includes("?") ? "&" : "?"}error=db`);

  if (!supplierId) redirectValidation();

  let parsed: { lines?: ParsedSupplierLine[] };
  try {
    parsed = JSON.parse(rawPayload) as { lines?: ParsedSupplierLine[] };
  } catch {
    return redirectValidation();
  }
  const rawLines = Array.isArray(parsed.lines) ? parsed.lines : [];
  if (rawLines.length === 0) redirectValidation();

  const lineRows: {
    product_id: string;
    product_name_snapshot: string;
    quantity: number;
    unit_price_cents: number;
    vat_rate_bps: number;
    sort_order: number;
  }[] = [];
  let totalCents = 0;
  for (let i = 0; i < rawLines.length; i += 1) {
    const l = rawLines[i];
    const pid = String(l?.productId ?? "").trim();
    const name = String(l?.productName ?? "").trim();
    const qty = Math.floor(Number(l?.quantity));
    const unit = Math.floor(Number(l?.unitPriceCents));
    const vatRaw = l?.vatRateBps;
    const vatBps =
      vatRaw === undefined || vatRaw === null || !Number.isFinite(Number(vatRaw))
        ? DEFAULT_SUPPLIER_VAT_BPS
        : Math.max(0, Math.min(10000, Math.floor(Number(vatRaw))));
    if (!pid || !name || qty < 1 || unit < 0) redirectValidation();
    const net = supplierLineNetCents(qty, unit);
    const gross = supplierLineGrossCents(net, vatBps);
    totalCents += gross;
    lineRows.push({
      product_id: pid,
      product_name_snapshot: name,
      quantity: qty,
      unit_price_cents: unit,
      vat_rate_bps: vatBps,
      sort_order: i,
    });
  }
  if (totalCents <= 0) redirectValidation();

  const id = randomUUID();
  const folio = supplierInvoiceFolioFromIssueDate(issueDate, id);

  const { data: ins, error: insErr } = await supabase
    .from("supplier_invoices")
    .insert({
      id,
      supplier_id: supplierId,
      folio,
      total_cents: totalCents,
      issue_date: issueDate,
      notes,
    })
    .select("id")
    .single();

  if (insErr || !ins?.id) return redirectDb();

  const invId = ins.id;
  const insertLines = lineRows.map((r) => ({
    invoice_id: invId,
    product_id: r.product_id,
    product_name_snapshot: r.product_name_snapshot,
    quantity: r.quantity,
    unit_price_cents: r.unit_price_cents,
    vat_rate_bps: r.vat_rate_bps,
    sort_order: r.sort_order,
  }));

  const { error: lineErr } = await supabase.from("supplier_invoice_lines").insert(insertLines);

  if (lineErr) {
    await supabase.from("supplier_invoices").delete().eq("id", invId);
    redirectDb();
  }

  const productIds = [...new Set(lineRows.map((r) => r.product_id))];
  if (productIds.length > 0) {
    const { error: linkErr } = await supabase
      .from("products")
      .update({ supplier_id: supplierId })
      .in("id", productIds);
    if (linkErr) console.error("createSupplierInvoiceAction supplier link", linkErr);
  }

  if (!(await verifyInsertedRowInDev(supabase, "supplier_invoices", invId))) {
    await supabase.from("supplier_invoice_lines").delete().eq("invoice_id", invId);
    await supabase.from("supplier_invoices").delete().eq("id", invId);
    redirectDb();
  }
  if (
    !(await verifyRowCountAtLeastInDev(
      supabase,
      "supplier_invoice_lines",
      { column: "invoice_id", value: invId },
      lineRows.length,
    ))
  ) {
    await supabase.from("supplier_invoice_lines").delete().eq("invoice_id", invId);
    await supabase.from("supplier_invoices").delete().eq("id", invId);
    redirectDb();
  }

  revalidateSupplierPaths(supplierId, invId);
  redirect(`/admin/proveedores/${supplierId}/facturas/${invId}`);
}

async function retotalSupplierInvoice(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  invoiceId: string,
) {
  const { data: rows } = await supabase
    .from("supplier_invoice_lines")
    .select("quantity,unit_price_cents,vat_rate_bps")
    .eq("invoice_id", invoiceId);
  let total = 0;
  for (const row of rows ?? []) {
    const net = supplierLineNetCents(Number(row.quantity ?? 0), Number(row.unit_price_cents ?? 0));
    total += supplierLineGrossCents(net, Number(row.vat_rate_bps ?? 0));
  }
  await supabase.from("supplier_invoices").update({ total_cents: total }).eq("id", invoiceId);
}

export async function addSupplierInvoiceLinesAction(formData: FormData) {
  await assertActionPermission("proveedores_ver");
  const supabase = await createSupabaseServerClient();
  const invoiceId = String(formData.get("invoice_id") ?? "").trim();
  const supplierId = String(formData.get("supplier_id") ?? "").trim();
  const back = `/admin/proveedores/${supplierId}/facturas/${invoiceId}`;
  const rawPayload = String(formData.get("payload") ?? "").trim();
  let parsed: { lines?: ParsedSupplierLine[] };
  try {
    parsed = JSON.parse(rawPayload) as { lines?: ParsedSupplierLine[] };
  } catch {
    redirect(`${back}?error=validation`);
  }
  const rawLines = Array.isArray(parsed.lines) ? parsed.lines : [];
  if (!invoiceId || !supplierId || rawLines.length === 0) redirect(`${back}?error=validation`);

  const { data: inv } = await supabase
    .from("supplier_invoices")
    .select("id,is_cancelled")
    .eq("id", invoiceId)
    .eq("supplier_id", supplierId)
    .maybeSingle();
  if (!inv || inv.is_cancelled) redirect(`${back}?error=db`);

  const { count } = await supabase
    .from("supplier_invoice_lines")
    .select("id", { count: "exact", head: true })
    .eq("invoice_id", invoiceId);
  const start = count ?? 0;

  const lineRows: {
    invoice_id: string;
    product_id: string;
    product_name_snapshot: string;
    quantity: number;
    unit_price_cents: number;
    vat_rate_bps: number;
    sort_order: number;
  }[] = [];
  for (let i = 0; i < rawLines.length; i += 1) {
    const l = rawLines[i];
    const pid = String(l?.productId ?? "").trim();
    const name = String(l?.productName ?? "").trim();
    const qty = Math.floor(Number(l?.quantity));
    const unit = Math.floor(Number(l?.unitPriceCents));
    const vatBps = Math.max(0, Math.min(10000, Math.floor(Number(l?.vatRateBps ?? DEFAULT_SUPPLIER_VAT_BPS))));
    if (!pid || !name || qty < 1 || unit < 0) redirect(`${back}?error=validation`);
    lineRows.push({
      invoice_id: invoiceId,
      product_id: pid,
      product_name_snapshot: name,
      quantity: qty,
      unit_price_cents: unit,
      vat_rate_bps: vatBps,
      sort_order: start + i,
    });
  }

  const { error } = await supabase.from("supplier_invoice_lines").insert(lineRows);
  if (error) redirect(`${back}?error=db`);

  await retotalSupplierInvoice(supabase, invoiceId);
  const productIds = [...new Set(lineRows.map((r) => r.product_id))];
  const { error: linkErr } = await supabase
    .from("products")
    .update({ supplier_id: supplierId })
    .in("id", productIds);
  if (linkErr) console.error("addSupplierInvoiceLinesAction supplier link", linkErr);

  revalidateSupplierPaths(supplierId, invoiceId);
  redirect(back);
}

export async function toggleSupplierLineDefectAction(formData: FormData) {
  await assertActionPermission("proveedores_ver");
  const supabase = await createSupabaseServerClient();
  const invoiceId = String(formData.get("invoice_id") ?? "").trim();
  const supplierId = String(formData.get("supplier_id") ?? "").trim();
  const lineId = String(formData.get("line_id") ?? "").trim();
  const isDefective = String(formData.get("is_defective") ?? "") === "1";
  const back = `/admin/proveedores/${supplierId}/facturas/${invoiceId}`;
  if (!invoiceId || !supplierId || !lineId) redirect(`${back}?error=db`);

  const { error } = await supabase
    .from("supplier_invoice_lines")
    .update({ is_defective: isDefective })
    .eq("id", lineId)
    .eq("invoice_id", invoiceId);
  if (error) redirect(`${back}?error=db`);

  revalidateSupplierPaths(supplierId, invoiceId);
  redirect(back);
}

export async function registerSupplierInvoicePaymentAction(formData: FormData) {
  await assertActionPermission("proveedores_ver");
  const supabase = await createSupabaseServerClient();
  const invoiceId = String(formData.get("invoice_id") ?? "").trim();
  const supplierId = String(formData.get("supplier_id") ?? "").trim();
  const amount = Math.max(0, Math.floor(Number.parseInt(String(formData.get("amount_cents") ?? "0"), 10) || 0));
  const paymentMethod = String(formData.get("payment_method") ?? "transferencia").trim() || "transferencia";
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const expenseMethod = mapSupplierPaymentMethodToExpense(paymentMethod);

  if (!invoiceId || !supplierId || amount <= 0) {
    redirect(`/admin/proveedores/${supplierId}?error=abono`);
  }

  // Efectivo sale de la caja del día: misma regla que egresos manuales.
  if (expenseMethod === "efectivo") {
    await assertCashRegisterOpenForStaff();
  }

  const [{ data: inv }, { data: supplier }] = await Promise.all([
    supabase
      .from("supplier_invoices")
      .select("id,folio,total_cents,is_cancelled")
      .eq("id", invoiceId)
      .eq("supplier_id", supplierId)
      .maybeSingle(),
    supabase.from("suppliers").select("id,name").eq("id", supplierId).maybeSingle(),
  ]);

  if (!inv || inv.is_cancelled || !supplier) {
    redirect(`/admin/proveedores/${supplierId}/facturas/${invoiceId}?error=abono`);
  }

  const { data: pays } = await supabase
    .from("supplier_invoice_payments")
    .select("amount_cents")
    .eq("invoice_id", invoiceId);
  const paid = (pays ?? []).reduce((s, r) => s + Number(r.amount_cents ?? 0), 0);
  const total = Number(inv.total_cents ?? 0);
  const pending = Math.max(0, total - paid);
  if (amount > pending) {
    redirect(`/admin/proveedores/${supplierId}/facturas/${invoiceId}?error=monto`);
  }

  const { data: payRow, error } = await supabase
    .from("supplier_invoice_payments")
    .insert({
      invoice_id: invoiceId,
      amount_cents: amount,
      payment_method: paymentMethod,
      notes,
    })
    .select("id")
    .single();

  if (error || !payRow?.id) {
    redirect(`/admin/proveedores/${supplierId}/facturas/${invoiceId}?error=db`);
  }

  const paymentId = String(payRow.id);
  const supplierName = String(supplier.name ?? "Proveedor").trim() || "Proveedor";
  const folio = String(inv.folio ?? "").trim() || invoiceId.slice(0, 8);
  const noteParts = [`Proveedor ${supplierName}`, `Factura ${folio}`];
  if (notes) noteParts.push(notes);

  const actorSession = await fetchOpenCashSession(supabase);

  const { error: expenseErr } = await supabase.from("store_expenses").insert({
    concept: EXPENSE_CONCEPT_SUPPLIER_PAYMENT,
    category: "insumos",
    amount_cents: amount,
    payment_method: expenseMethod,
    notes: noteParts.join(" · "),
    expense_date: todayYmdInReportStore(),
    supplier_invoice_payment_id: paymentId,
    expense_kind: "egreso",
    expense_scope: "diario",
    ...(actorSession?.id
      ? { cash_register_session_id: actorSession.id }
      : {}),
  });

  if (expenseErr) {
    await supabase.from("supplier_invoice_payments").delete().eq("id", paymentId);
    console.error("registerSupplierInvoicePaymentAction expense", expenseErr);
    redirect(`/admin/proveedores/${supplierId}/facturas/${invoiceId}?error=egreso`);
  }

  revalidateSupplierPaths(supplierId, invoiceId);
  redirect(`/admin/proveedores/${supplierId}/facturas/${invoiceId}`);
}

export async function cancelSupplierInvoiceAction(formData: FormData) {
  await assertActionPermission("proveedores_ver");
  const supabase = await createSupabaseServerClient();
  const invoiceId = String(formData.get("invoice_id") ?? "").trim();
  const supplierId = String(formData.get("supplier_id") ?? "").trim();
  if (!invoiceId || !supplierId) redirect(`/admin/proveedores/${supplierId}?error=cancel`);

  const { error } = await supabase
    .from("supplier_invoices")
    .update({ is_cancelled: true })
    .eq("id", invoiceId)
    .eq("supplier_id", supplierId);

  if (error) redirect(`/admin/proveedores/${supplierId}/facturas/${invoiceId}?error=db`);

  const { data: pays } = await supabase
    .from("supplier_invoice_payments")
    .select("id")
    .eq("invoice_id", invoiceId);
  const paymentIds = (pays ?? []).map((p) => String(p.id)).filter(Boolean);
  if (paymentIds.length > 0) {
    const { error: cancelExpErr } = await supabase
      .from("store_expenses")
      .update({
        is_cancelled: true,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: "Factura de proveedor anulada",
      })
      .in("supplier_invoice_payment_id", paymentIds)
      .eq("is_cancelled", false);
    if (cancelExpErr) {
      console.error("cancelSupplierInvoiceAction expenses", cancelExpErr);
    }
  }

  revalidateSupplierPaths(supplierId, invoiceId);
  redirect(`/admin/proveedores/${supplierId}/facturas/${invoiceId}`);
}

export async function uploadSupplierInvoiceAttachmentAction(formData: FormData) {
  await assertActionPermission("proveedores_ver");
  const supabase = await createSupabaseServerClient();
  const invoiceId = String(formData.get("invoice_id") ?? "").trim();
  const supplierId = String(formData.get("supplier_id") ?? "").trim();
  const file = formData.get("file");
  if (!invoiceId || !supplierId || !(file instanceof File) || file.size <= 0) {
    redirect(`/admin/proveedores/${supplierId}/facturas/${invoiceId}?error=archivo`);
  }

  const { data: inv } = await supabase
    .from("supplier_invoices")
    .select("id,is_cancelled")
    .eq("id", invoiceId)
    .eq("supplier_id", supplierId)
    .maybeSingle();
  if (!inv || inv.is_cancelled) {
    redirect(`/admin/proveedores/${supplierId}/facturas/${invoiceId}?error=archivo`);
  }

  const { count } = await supabase
    .from("supplier_invoice_attachments")
    .select("id", { count: "exact", head: true })
    .eq("invoice_id", invoiceId);
  if ((count ?? 0) >= 5) {
    redirect(`/admin/proveedores/${supplierId}/facturas/${invoiceId}?error=limite`);
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120) || "archivo";
  const storageKey = `${invoiceId}/${Date.now()}-${safeName}`;

  const buf = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await supabase.storage
    .from("supplier-invoice-files")
    .upload(storageKey, buf, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (upErr) redirect(`/admin/proveedores/${supplierId}/facturas/${invoiceId}?error=subida`);

  const storagePath = `supplier-invoice-files/${storageKey}`;
  const { error: insErr } = await supabase.from("supplier_invoice_attachments").insert({
    invoice_id: invoiceId,
    storage_path: storagePath,
    file_name: file.name.slice(0, 200),
    sort_order: count ?? 0,
  });

  if (insErr) {
    await supabase.storage.from("supplier-invoice-files").remove([storageKey]);
    redirect(`/admin/proveedores/${supplierId}/facturas/${invoiceId}?error=db`);
  }

  revalidateSupplierPaths(supplierId, invoiceId);
  redirect(`/admin/proveedores/${supplierId}/facturas/${invoiceId}`);
}

export async function deleteSupplierInvoiceAttachmentAction(formData: FormData) {
  await assertActionPermission("proveedores_ver");
  const supabase = await createSupabaseServerClient();
  const attachmentId = String(formData.get("attachment_id") ?? "").trim();
  const invoiceId = String(formData.get("invoice_id") ?? "").trim();
  const supplierId = String(formData.get("supplier_id") ?? "").trim();
  const storagePath = String(formData.get("storage_path") ?? "").trim();
  if (!attachmentId || !invoiceId || !supplierId || !storagePath) return;

  const { data: row } = await supabase
    .from("supplier_invoice_attachments")
    .select("id")
    .eq("id", attachmentId)
    .eq("invoice_id", invoiceId)
    .maybeSingle();
  if (!row) return;

  const key = storagePath.replace(/^supplier-invoice-files\//, "");
  await supabase.storage.from("supplier-invoice-files").remove([key]);
  await supabase.from("supplier_invoice_attachments").delete().eq("id", attachmentId);
  revalidateSupplierPaths(supplierId, invoiceId);
  redirect(`/admin/proveedores/${supplierId}/facturas/${invoiceId}`);
}

export async function updateSupplierReceiptStatusAction(
  invoiceId: string,
  supplierId: string,
  status: SupplierReceiptStatus,
): Promise<{ ok: boolean }> {
  await assertActionPermission("proveedores_ver");
  if (!invoiceId || !supplierId || !isSupplierReceiptStatus(status)) return { ok: false };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("supplier_invoices")
    .update({ receipt_status: status })
    .eq("id", invoiceId)
    .eq("supplier_id", supplierId)
    .eq("is_cancelled", false)
    .select("id")
    .maybeSingle();
  if (error || !data?.id) return { ok: false };
  revalidateSupplierPaths(supplierId, invoiceId);
  return { ok: true };
}

export async function receiveSupplierOrderStockAction(formData: FormData) {
  await assertActionPermission("proveedores_ver");
  const supabase = await createSupabaseServerClient();
  const invoiceId = String(formData.get("invoice_id") ?? "").trim();
  const supplierId = String(formData.get("supplier_id") ?? "").trim();
  const back = `/admin/proveedores/${supplierId}/facturas/${invoiceId}`;
  if (!invoiceId || !supplierId) redirect(`${back}?error=db`);

  const { data: inv } = await supabase
    .from("supplier_invoices")
    .select("id,is_cancelled,receipt_status")
    .eq("id", invoiceId)
    .eq("supplier_id", supplierId)
    .maybeSingle();
  if (!inv || inv.is_cancelled) redirect(`${back}?error=db`);

  const { data: lineRows, error: lineErr } = await supabase
    .from("supplier_invoice_lines")
    .select("id,product_id,quantity,received_quantity")
    .eq("invoice_id", invoiceId);
  if (lineErr || !lineRows) redirect(`${back}?error=db`);

  const posts: { id: string; productId: string | null; add: number; nextReceived: number }[] = [];
  for (const row of lineRows) {
    const ordered = Math.max(0, Math.floor(Number(row.quantity ?? 0)));
    const already = Math.max(0, Math.floor(Number(row.received_quantity ?? 0)));
    const raw = Math.floor(Number.parseInt(String(formData.get(`receive_${row.id}`) ?? "0"), 10) || 0);
    const add = Math.max(0, Math.min(raw, Math.max(0, ordered - already)));
    if (add <= 0) continue;
    posts.push({
      id: String(row.id),
      productId: row.product_id ? String(row.product_id) : null,
      add,
      nextReceived: already + add,
    });
  }
  if (posts.length === 0) redirect(back);

  const productAdds = new Map<string, number>();
  for (const post of posts) {
    if (!post.productId) continue;
    productAdds.set(post.productId, (productAdds.get(post.productId) ?? 0) + post.add);
  }

  const current = await fetchCurrentBranchInventoryMap(supabase, [...productAdds.keys()]);
  for (const [productId, add] of productAdds) {
    const { error } = await supabase.rpc("set_product_branch_stock", {
      p_product_id: productId,
      p_quantity: (current.get(productId) ?? 0) + add,
    });
    if (error) {
      console.error("receiveSupplierOrderStockAction", error.message);
      redirect(`${back}?error=stock`);
    }
  }

  for (const post of posts) {
    const { error } = await supabase
      .from("supplier_invoice_lines")
      .update({ received_quantity: post.nextReceived })
      .eq("id", post.id)
      .eq("invoice_id", invoiceId);
    if (error) redirect(`${back}?error=stock`);
  }

  const postedById = new Map(posts.map((post) => [post.id, post.nextReceived]));
  const complete = lineRows.every((row) => {
    const ordered = Math.max(0, Math.floor(Number(row.quantity ?? 0)));
    const received = postedById.get(String(row.id)) ?? Math.max(0, Math.floor(Number(row.received_quantity ?? 0)));
    return received >= ordered;
  });
  if (complete) {
    await supabase
      .from("supplier_invoices")
      .update({ receipt_status: "received" })
      .eq("id", invoiceId);
  } else if (String(inv.receipt_status) === "sent") {
    await supabase
      .from("supplier_invoices")
      .update({ receipt_status: "receiving" })
      .eq("id", invoiceId);
  }

  revalidateSupplierPaths(supplierId, invoiceId);
  revalidatePath("/admin/products");
  redirect(back);
}
