"use server";

import {
  activityStockTraceToMetadata,
  buildOrderCancelStockTrace,
} from "@/lib/activity-log-stock";
import { logAdminActivity } from "@/lib/admin-activity-log";
import { ORDER_CANCELLATION_REASON_MIN_LENGTH } from "@/lib/orders-constants";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ALLOWED = new Set(["pending", "paid", "failed", "cancelled"]);

async function orderStockWasRestored(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  orderId: string,
): Promise<boolean> {
  const { data: order } = await supabase
    .from("orders")
    .select("stock_restored_at")
    .eq("id", orderId)
    .maybeSingle();
  return order?.stock_restored_at != null;
}

export async function updateAdminOrderStatus(
  orderId: string,
  status: string,
  cancellationReason?: string | null,
) {
  const id = String(orderId ?? "").trim();
  const next = String(status ?? "").trim();
  if (!id || !ALLOWED.has(next)) {
    return { ok: false as const, error: "invalid" as const };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "auth" as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return { ok: false as const, error: "auth" as const };

  const perm = await loadAdminPermissions();
  if (!perm?.permissions.ventas_crear) {
    return { ok: false as const, error: "forbidden" as const };
  }

  const { data: orderBefore } = await supabase
    .from("orders")
    .select("status, stock_restored_at, checkout_payment_method, fulfillment_status")
    .eq("id", id)
    .maybeSingle();

  if (!orderBefore) return { ok: false as const, error: "db" as const };

  // Cotizaciones solo se anulan desde este selector; para cobrar usá «Facturar cotización».
  if (String(orderBefore.status) === "quotation" && next !== "cancelled") {
    return { ok: false as const, error: "invalid" as const };
  }

  let stockWasRestored = orderBefore.stock_restored_at != null;

  if (next === "cancelled") {
    const reason = String(cancellationReason ?? "").trim();
    if (reason.length < ORDER_CANCELLATION_REASON_MIN_LENGTH) {
      return { ok: false as const, error: "reason_required" as const };
    }
    const wasQuotation = String(orderBefore.status) === "quotation";

    const stockTrace = wasQuotation
      ? {
          stock_direction: "none" as const,
          stock_restored: false,
          stock_already_restored: false,
          stock_movements: [],
        }
      : await buildOrderCancelStockTrace(supabase, id, {
          inventoryIsPreRestore: !stockWasRestored,
        });

    const { error } = await supabase.rpc("cancel_order_and_restore_stock", {
      p_order_id: id,
      p_reason: reason,
    });
    if (error) {
      console.error("cancel_order_and_restore_stock", error);
      return { ok: false as const, error: "stock_restore" as const };
    }
    stockWasRestored = wasQuotation
      ? false
      : await orderStockWasRestored(supabase, id);

    const finalStockTrace = {
      ...stockTrace,
      stock_restored:
        stockWasRestored && stockTrace.stock_movements.length > 0,
      stock_already_restored: orderBefore.stock_restored_at != null,
    };

    await logAdminActivity(supabase, {
      actorId: user.id,
      actionType: "sale_cancelled",
      entityType: "order",
      entityId: id,
      summary: "Factura anulada",
      metadata: {
        cancellation_reason: reason,
        ...activityStockTraceToMetadata(finalStockTrace),
      },
    });
    revalidatePath("/admin/actividades");
    revalidatePath(`/admin/orders/${id}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin/ventas");
    revalidatePath("/admin/creditos");
    revalidatePath(`/admin/creditos/${id}`);
    revalidatePath("/pedido");
    revalidatePath("/cuenta/pedidos");
    revalidatePath(`/cuenta/pedidos/${id}`);
    if (stockWasRestored) {
      revalidatePath("/admin/products");
    }
    return { ok: true as const };
  }

  const payload = { status: next, cancellation_reason: null };

  const extra: Record<string, unknown> = {};
  if (String(orderBefore.checkout_payment_method) === "transfer") {
    if (next === "paid") {
      extra.fulfillment_status = "completed";
    } else if (next === "pending") {
      extra.fulfillment_status = "awaiting_payment";
    }
  }

  const { error } = await supabase
    .from("orders")
    .update({ ...payload, ...extra })
    .eq("id", id);
  if (error) return { ok: false as const, error: "db" as const };

  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/ventas");
  revalidatePath("/pedido");
  revalidatePath("/cuenta/pedidos");
  revalidatePath(`/cuenta/pedidos/${id}`);
  return { ok: true as const };
}
