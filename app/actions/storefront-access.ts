"use server";

import { redirect } from "next/navigation";
import {
  clearStorefrontSessionCookies,
  setStorefrontSessionCookies,
} from "@/lib/storefront-scope";
import { normalizeStorefrontAccessCode } from "@/lib/storefront-access-code";
import { getStorefrontTenant } from "@/lib/storefront-tenant";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function redeemStorefrontCode(formData: FormData): Promise<void> {
  const branchCode = String(formData.get("branch") ?? "")
    .trim()
    .toLowerCase();
  const code = normalizeStorefrontAccessCode(String(formData.get("code") ?? ""));
  const back = `/sucursal/${encodeURIComponent(branchCode || "bodega")}`;

  if (!branchCode || code.length < 4) {
    redirect(`${back}?error=1`);
  }

  const tenant = await getStorefrontTenant();
  const supabase = createSupabaseServiceClient();
  const { data: branch } = await supabase
    .from("branches")
    .select("id,code,is_default")
    .eq("tenant_id", tenant.id)
    .eq("code", branchCode)
    .eq("is_active", true)
    .maybeSingle();

  if (!branch?.id || branch.is_default) {
    redirect(`${back}?error=1`);
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id,customer_kind")
    .eq("tenant_id", tenant.id)
    .eq("branch_id", branch.id)
    .eq("storefront_access_code", code)
    .maybeSingle();

  if (!customer?.id || String(customer.customer_kind) !== "wholesale") {
    redirect(`${back}?error=1`);
  }

  await setStorefrontSessionCookies(
    String(branch.code).toLowerCase(),
    String(customer.id),
  );
  redirect("/");
}

export async function leaveStorefrontBranch(): Promise<void> {
  await clearStorefrontSessionCookies();
  redirect("/");
}
