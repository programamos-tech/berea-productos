"use server";

import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import {
  clearActingTenantCookie,
  setActingTenantCookie,
} from "@/lib/platform-operator-server";
import { isActingTenantId } from "@/lib/platform-operator";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function enterCustomerAccount(formData: FormData) {
  const perm = await loadAdminPermissions();
  if (!perm?.isPlatformOperator) redirect("/admin/login");
  const tenantId = String(formData.get("tenant_id") ?? "").trim();
  if (!isActingTenantId(tenantId)) redirect("/admin/cuentas");

  let service: ReturnType<typeof createSupabaseServiceClient>;
  try {
    service = createSupabaseServiceClient();
  } catch {
    redirect("/admin/cuentas");
  }

  const { data: tenant } = await service
    .from("tenants")
    .select("id")
    .eq("id", tenantId)
    .eq("kind", "customer")
    .in("status", ["active", "trial"])
    .maybeSingle();

  if (!tenant?.id) redirect("/admin/cuentas");

  await setActingTenantCookie(tenant.id as string);
  revalidatePath("/admin", "layout");
  redirect("/admin");
}

export async function leaveCustomerAccount() {
  const perm = await loadAdminPermissions();
  if (!perm?.isPlatformOperator) redirect("/admin");
  await clearActingTenantCookie();
  revalidatePath("/admin", "layout");
  redirect("/admin/cuentas");
}
