"use server";

import {
  isAccountModuleId,
  parseDisabledAccountModules,
  withModuleDisabled,
} from "@/lib/admin-account-modules";
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

export async function setTenantAccountModuleAction(formData: FormData) {
  const perm = await loadAdminPermissions();
  if (!perm?.isPlatformOperator) redirect("/admin/login");

  const tenantId = String(formData.get("tenant_id") ?? "").trim();
  const moduleId = String(formData.get("module_id") ?? "").trim();
  const enabled = String(formData.get("enabled") ?? "") === "1";
  const detailHref = `/admin/cuentas/${tenantId}`;

  if (!isActingTenantId(tenantId) || !isAccountModuleId(moduleId)) {
    redirect("/admin/cuentas");
  }

  let service: ReturnType<typeof createSupabaseServiceClient>;
  try {
    service = createSupabaseServiceClient();
  } catch {
    redirect(`${detailHref}?error=modules`);
  }

  const { data: tenant } = await service
    .from("tenants")
    .select("id, disabled_modules")
    .eq("id", tenantId)
    .eq("kind", "customer")
    .maybeSingle();

  if (!tenant?.id) redirect("/admin/cuentas");

  const next = withModuleDisabled(
    parseDisabledAccountModules(tenant.disabled_modules),
    moduleId,
    enabled,
  );

  const { error } = await service
    .from("tenants")
    .update({ disabled_modules: next })
    .eq("id", tenant.id);

  if (error) {
    console.error("[cuentas] disabled_modules:", error.message);
    redirect(`${detailHref}?error=modules`);
  }

  revalidatePath("/admin", "layout");
  revalidatePath(detailHref);
  redirect(detailHref);
}
