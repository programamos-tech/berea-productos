"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseInvoiceLayout } from "@/lib/invoice-layout";
import { requireAdminSession } from "@/lib/require-admin-permission";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updateInvoiceLayoutAction(formData: FormData) {
  const session = await requireAdminSession();
  if (session.jobRole !== "owner" && !session.isPlatformOperator) {
    redirect("/admin/configuracion?notice=forbidden");
  }

  const layout = parseInvoiceLayout(String(formData.get("invoice_layout") ?? ""));
  const supabase = await createSupabaseServerClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("storefront_config")
    .eq("id", session.tenantId)
    .maybeSingle();
  if (!tenant) redirect("/admin/configuracion?notice=error");

  const current =
    tenant.storefront_config &&
    typeof tenant.storefront_config === "object" &&
    !Array.isArray(tenant.storefront_config)
      ? (tenant.storefront_config as Record<string, unknown>)
      : {};

  const { error } = await supabase
    .from("tenants")
    .update({
      storefront_config: {
        ...current,
        invoice_layout: layout,
      },
    })
    .eq("id", session.tenantId);
  if (error) redirect("/admin/configuracion?notice=error");

  revalidatePath("/admin", "layout");
  revalidatePath("/admin/configuracion");
  revalidatePath("/admin/orders");
  redirect("/admin/configuracion?notice=saved");
}
