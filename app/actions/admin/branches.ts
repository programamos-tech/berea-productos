"use server";

import { isBranchId } from "@/lib/branch-context";
import {
  clearActiveBranchCookie,
  setActiveBranchCookie,
} from "@/lib/branch-server";
import {
  requireAdminPermission,
  requireAdminSession,
} from "@/lib/require-admin-permission";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function safeAdminReturnTo(raw: FormDataEntryValue | null): string {
  const path = String(raw ?? "").trim();
  return path.startsWith("/admin") && !path.startsWith("//") ? path : "/admin";
}

function branchCode(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function switchBranchAction(formData: FormData) {
  const perm = await requireAdminSession();
  const id = String(formData.get("branch_id") ?? "").trim();
  const returnTo = safeAdminReturnTo(formData.get("return_to"));
  if (!isBranchId(id)) redirect(`${returnTo}?branch=invalid`);

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("branches")
    .select("id")
    .eq("id", id)
    .eq("tenant_id", perm.tenantId)
    .eq("is_active", true)
    .maybeSingle();
  if (!data?.id) redirect(`${returnTo}?branch=forbidden`);

  await setActiveBranchCookie(id);
  revalidatePath("/admin", "layout");
  redirect(returnTo);
}

export async function resetBranchAction(formData: FormData) {
  await requireAdminSession();
  await clearActiveBranchCookie();
  revalidatePath("/admin", "layout");
  redirect(safeAdminReturnTo(formData.get("return_to")));
}

export async function createBranchAction(formData: FormData) {
  const perm = await requireAdminPermission("sucursales_gestionar");
  const name = String(formData.get("name") ?? "").trim();
  const code = branchCode(String(formData.get("code") ?? "") || name);
  if (!name || !code) redirect("/admin/sucursales/nuevo?error=validation");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("branches")
    .insert({ tenant_id: perm.tenantId, name, code })
    .select("id")
    .single();
  if (error || !data?.id) {
    const reason = error?.code === "23505" ? "duplicate" : "db";
    redirect(`/admin/sucursales/nuevo?error=${reason}`);
  }

  revalidatePath("/admin/sucursales");
  redirect("/admin/sucursales?created=1");
}

export async function updateBranchAction(formData: FormData) {
  const perm = await requireAdminPermission("sucursales_gestionar");
  const id = String(formData.get("branch_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const code = branchCode(String(formData.get("code") ?? "") || name);
  const isActive = formData.getAll("is_active").some((v) => v === "true");
  const makeDefault = formData.getAll("is_default").some((v) => v === "true");
  if (!isBranchId(id) || !name || !code) {
    redirect(`/admin/sucursales/${id}/edit?error=validation`);
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("branches")
    .select("id,is_default")
    .eq("id", id)
    .eq("tenant_id", perm.tenantId)
    .maybeSingle();
  if (
    !existing?.id ||
    (existing.is_default && (!isActive || !makeDefault))
  ) {
    redirect(`/admin/sucursales/${id}/edit?error=default_active`);
  }

  const { error } = await supabase.rpc("update_branch_settings", {
    p_branch_id: id,
    p_name: name,
    p_code: code,
    p_is_active: isActive,
    p_make_default: makeDefault,
  });
  if (error) {
    const reason = error.code === "23505" ? "duplicate" : "db";
    redirect(`/admin/sucursales/${id}/edit?error=${reason}`);
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/admin/sucursales");
  redirect("/admin/sucursales?updated=1");
}
