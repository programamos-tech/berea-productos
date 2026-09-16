"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeStorefrontColor } from "@/lib/storefront-brand";
import { parseTenantBrand } from "@/lib/tenant-brand";
import { requireAdminSession } from "@/lib/require-admin-permission";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_LOGO_BYTES = 3 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

export async function updateStorefrontBrandAction(formData: FormData) {
  const session = await requireAdminSession();
  if (session.jobRole !== "owner" && !session.isPlatformOperator) {
    redirect("/admin/cuenta?notice=forbidden");
  }

  const supabase = await createSupabaseServerClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("brand,storefront_config")
    .eq("id", session.tenantId)
    .maybeSingle();
  if (!tenant) redirect("/admin/cuenta?storefront=error");

  const current = parseTenantBrand(tenant.brand);
  let logoPath = current.logo_path;
  const logo = formData.get("logo");
  if (logo instanceof Blob && logo.size > 0) {
    const extension = IMAGE_EXTENSIONS[logo.type];
    if (!extension || logo.size > MAX_LOGO_BYTES) {
      redirect("/admin/cuenta?storefront=logo");
    }
    const objectPath = `tenants/${session.tenantId}/storefront-${randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(objectPath, Buffer.from(await logo.arrayBuffer()), {
        contentType: logo.type,
        upsert: false,
      });
    if (uploadError) redirect("/admin/cuenta?storefront=logo_upload");
    logoPath = `product-images/${objectPath}`;
  }

  const requestedCheckout = value(formData, "checkout_mode");
  const checkoutMode =
    session.tenantSlug === "aleya" && requestedCheckout === "wompi"
      ? "wompi"
      : "transfer";
  const brand = {
    ...current,
    trade_name: value(formData, "trade_name") || session.tenantName,
    logo_path: logoPath,
    primary_color: normalizeStorefrontColor(
      value(formData, "primary_color"),
      current.primary_color || "#18181B",
    ),
    tagline: value(formData, "tagline") || undefined,
    description: value(formData, "description") || undefined,
    announcement: value(formData, "announcement") || undefined,
    phone: value(formData, "phone") || undefined,
    email: value(formData, "email") || undefined,
    whatsapp: value(formData, "whatsapp") || undefined,
    support_hours: value(formData, "support_hours") || undefined,
    instagram_url: value(formData, "instagram_url") || undefined,
    bank: {
      holder: value(formData, "bank_holder") || undefined,
      tax_id: value(formData, "bank_tax_id") || undefined,
      account: value(formData, "bank_account") || undefined,
    },
  };
  const storefrontConfig = {
    ...((tenant.storefront_config &&
    typeof tenant.storefront_config === "object" &&
    !Array.isArray(tenant.storefront_config)
      ? tenant.storefront_config
      : {}) as Record<string, unknown>),
    checkout_mode: checkoutMode,
  };

  const { error } = await supabase
    .from("tenants")
    .update({ brand, storefront_config: storefrontConfig })
    .eq("id", session.tenantId);
  if (error) redirect("/admin/cuenta?storefront=error");

  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/cuenta");
  redirect("/admin/cuenta?storefront=updated");
}
