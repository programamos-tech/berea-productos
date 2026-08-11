import { buildQuotationPdf, quotationPdfFilename } from "@/lib/quotation-pdf";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ventaNumeroReferencia } from "@/lib/ventas-sales";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const perm = await loadAdminPermissions();
  if (!perm?.permissions.ventas_ver) {
    return new Response("No autorizado", { status: 401 });
  }

  const { id: rawId } = await ctx.params;
  const orderId = String(rawId ?? "").trim();
  if (!orderId) {
    return new Response("Cotización no encontrada", { status: 404 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id,status,total_cents,customer_name,customer_email,customer_id,created_at,shipping_address,shipping_phone",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) {
    return new Response("Cotización no encontrada", { status: 404 });
  }
  if (String(order.status) !== "quotation") {
    return new Response("Esta orden no es una cotización", { status: 400 });
  }

  const { data: items } = await supabase
    .from("order_items")
    .select(
      "product_name_snapshot,quantity,unit_price_cents,product_id,products(reference)",
    )
    .eq("order_id", orderId)
    .order("id", { ascending: true });

  let customerDocumentId: string | null = null;
  let customerPhone: string | null =
    order.shipping_phone != null ? String(order.shipping_phone) : null;
  let customerAddress: string | null =
    order.shipping_address != null ? String(order.shipping_address) : null;

  if (order.customer_id) {
    const { data: customer } = await supabase
      .from("customers")
      .select("document_id,phone,shipping_address")
      .eq("id", order.customer_id)
      .maybeSingle();
    if (customer) {
      customerDocumentId =
        customer.document_id != null ? String(customer.document_id) : null;
      if (!customerPhone && customer.phone) {
        customerPhone = String(customer.phone);
      }
      if (!customerAddress && customer.shipping_address) {
        customerAddress = String(customer.shipping_address);
      }
    }
  }

  const invoiceRef = ventaNumeroReferencia(orderId);
  const bytes = await buildQuotationPdf({
    invoiceRef,
    customerName: String(order.customer_name ?? "Cliente"),
    customerEmail: order.customer_email != null ? String(order.customer_email) : null,
    customerDocumentId,
    customerPhone,
    customerAddress,
    createdAt: order.created_at ? String(order.created_at) : null,
    totalCents: Math.max(0, Math.floor(Number(order.total_cents ?? 0))),
    lines: (items ?? []).map((it) => {
      const raw = it.products as
        | { reference?: string | null }
        | { reference?: string | null }[]
        | null;
      const p = Array.isArray(raw) ? raw[0] : raw;
      const ref =
        p && typeof p === "object" && p.reference != null
          ? String(p.reference).trim()
          : "";
      return {
        name: String(it.product_name_snapshot ?? "Producto"),
        reference: ref.length > 0 ? ref : null,
        quantity: Math.max(0, Math.floor(Number(it.quantity ?? 0))),
        unitPriceCents: Math.max(0, Math.floor(Number(it.unit_price_cents ?? 0))),
      };
    }),
  });

  const filename = quotationPdfFilename(invoiceRef);
  return new Response(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
