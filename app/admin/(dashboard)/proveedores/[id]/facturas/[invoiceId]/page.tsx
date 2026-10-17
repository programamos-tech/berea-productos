import { notFound } from "next/navigation";
import {
  SupplierOrderInvoiceView,
  type SupplierOrderLine,
  type SupplierOrderPayment,
} from "@/components/admin/SupplierOrderInvoiceView";
import {
  supplierInvoiceUiStatus,
  supplierLineGrossCents,
  supplierLineNetCents,
} from "@/lib/supplier-invoices";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string; invoiceId: string }>;
  searchParams: Promise<{ error?: string }>;
};

function productRef(raw: { reference?: string | null } | { reference?: string | null }[] | null): string | null {
  const row = Array.isArray(raw) ? raw[0] : raw;
  const ref = row?.reference?.trim() ?? "";
  return ref.length > 0 ? ref : null;
}

function methodLabel(raw: string): string {
  const v = raw.trim().toLowerCase();
  if (v === "transferencia" || v === "transfer") return "Transferencia";
  if (v === "efectivo" || v === "cash") return "Efectivo";
  if (v === "cheque") return "Cheque";
  return raw.trim() || "Otro";
}

export default async function AdminProveedorFacturaDetailPage({ params, searchParams }: Props) {
  const { id: supplierId, invoiceId } = await params;
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: supplier } = await supabase
    .from("suppliers")
    .select("id,name,phone,document_id,address")
    .eq("id", supplierId)
    .maybeSingle();
  const { data: inv } = await supabase
    .from("supplier_invoices")
    .select("*")
    .eq("id", invoiceId)
    .eq("supplier_id", supplierId)
    .maybeSingle();
  if (!supplier || !inv) notFound();

  const [{ data: pays }, { data: atts }, { data: lineRows }] = await Promise.all([
    supabase
      .from("supplier_invoice_payments")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("paid_at", { ascending: false }),
    supabase
      .from("supplier_invoice_attachments")
      .select("id,file_name,storage_path")
      .eq("invoice_id", invoiceId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("supplier_invoice_lines")
      .select(
        "id,product_name_snapshot,quantity,unit_price_cents,vat_rate_bps,is_defective,products(reference)",
      )
      .eq("invoice_id", invoiceId)
      .order("sort_order", { ascending: true }),
  ]);

  const paymentsRaw = pays ?? [];
  const paymentIds = paymentsRaw.map((p) => String(p.id)).filter(Boolean);
  const expenseByPaymentId = new Map<string, { id: string; is_cancelled: boolean | null }>();
  if (paymentIds.length > 0) {
    const { data: linkedExpenses } = await supabase
      .from("store_expenses")
      .select("id,supplier_invoice_payment_id,is_cancelled")
      .in("supplier_invoice_payment_id", paymentIds);
    for (const expense of linkedExpenses ?? []) {
      const payId = expense.supplier_invoice_payment_id ? String(expense.supplier_invoice_payment_id) : "";
      if (payId) {
        expenseByPaymentId.set(payId, {
          id: String(expense.id),
          is_cancelled: expense.is_cancelled ?? null,
        });
      }
    }
  }

  const lines: SupplierOrderLine[] = (lineRows ?? []).map((row) => {
    const quantity = Number(row.quantity ?? 0);
    const unitPriceCents = Number(row.unit_price_cents ?? 0);
    const vatBps = Math.max(0, Math.min(10000, Math.floor(Number(row.vat_rate_bps ?? 0))));
    const net = supplierLineNetCents(quantity, unitPriceCents);
    return {
      id: String(row.id),
      name: String(row.product_name_snapshot ?? "Producto"),
      reference: productRef(row.products as { reference?: string | null } | { reference?: string | null }[] | null),
      quantity,
      unitPriceCents,
      grossCents: supplierLineGrossCents(net, vatBps),
      isDefective: Boolean(row.is_defective),
    };
  });

  const payments: SupplierOrderPayment[] = paymentsRaw.map((pay) => {
    const linked = expenseByPaymentId.get(String(pay.id));
    return {
      id: String(pay.id),
      amountCents: Number(pay.amount_cents ?? 0),
      methodLabel: methodLabel(String(pay.payment_method ?? "")),
      paidAt: typeof pay.paid_at === "string" ? pay.paid_at : null,
      notes: pay.notes ? String(pay.notes) : null,
      expenseId: linked?.id ?? null,
      expenseCancelled: Boolean(linked?.is_cancelled),
    };
  });

  const total = Number(inv.total_cents ?? 0);
  const paid = payments.reduce((sum, pay) => sum + pay.amountCents, 0);
  const cancelled = Boolean(inv.is_cancelled);
  const pending = cancelled ? 0 : Math.max(0, total - paid);
  const issueDate = typeof inv.issue_date === "string" ? inv.issue_date.slice(0, 10) : "";
  const issueLabel = /^\d{4}-\d{2}-\d{2}$/.test(issueDate)
    ? `${issueDate.slice(8, 10)}/${issueDate.slice(5, 7)}/${issueDate.slice(0, 4)}`
    : "—";
  const err = sp.error;
  const errorMessage =
    err === "monto"
      ? "El abono supera el saldo pendiente."
      : err === "abono"
        ? "No se pudo registrar el abono."
        : err === "egreso"
          ? "No se pudo crear el egreso de caja. Reintentá el abono."
          : err === "validation"
            ? "Revisá el producto, la cantidad y el precio."
            : err === "db"
              ? "No se pudo guardar."
              : err === "limite"
                ? "Máximo 5 archivos adjuntos."
                : err === "subida" || err === "archivo"
                  ? "No se pudo subir el archivo."
                  : null;

  return (
    <SupplierOrderInvoiceView
      supplierId={supplierId}
      supplierName={String(supplier.name ?? "Proveedor")}
      supplierDocument={supplier.document_id ? String(supplier.document_id) : null}
      supplierPhone={supplier.phone ? String(supplier.phone) : null}
      supplierAddress={supplier.address ? String(supplier.address) : null}
      invoiceId={invoiceId}
      folio={String(inv.folio ?? invoiceId.slice(0, 8))}
      issueLabel={issueLabel}
      notes={inv.notes ? String(inv.notes) : null}
      cancelled={cancelled}
      totalCents={total}
      paidCents={paid}
      pendingCents={pending}
      status={supplierInvoiceUiStatus(total, paid, cancelled)}
      lines={lines}
      payments={payments}
      attachments={(atts ?? []).map((file) => ({
        id: String(file.id),
        fileName: String(file.file_name ?? ""),
        storagePath: String(file.storage_path ?? ""),
      }))}
      errorMessage={errorMessage}
    />
  );
}
