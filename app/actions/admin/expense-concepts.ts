"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  parseExpenseConceptPaymentMethod,
} from "@/lib/store-expense-concepts";
import { requireAdminPermission } from "@/lib/require-admin-permission";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function revalidateConcepts() {
  revalidatePath("/admin/egresos");
  revalidatePath("/admin/egresos/conceptos");
}

function redirectConceptError(code: string) {
  redirect(`/admin/egresos/conceptos?error=${encodeURIComponent(code)}`);
}

function parseKinds(formData: FormData): {
  applies_to_gasto: boolean;
  applies_to_egreso: boolean;
} {
  const gasto = formData.get("applies_to_gasto") === "on" || formData.get("applies_to_gasto") === "1";
  const egreso =
    formData.get("applies_to_egreso") === "on" ||
    formData.get("applies_to_egreso") === "1";
  return { applies_to_gasto: gasto, applies_to_egreso: egreso };
}

export async function createExpenseConcept(formData: FormData) {
  await requireAdminPermission("egresos_crear");
  const supabase = await createSupabaseServerClient();

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) redirectConceptError("name");

  const kinds = parseKinds(formData);
  if (!kinds.applies_to_gasto && !kinds.applies_to_egreso) {
    redirectConceptError("kinds");
  }

  const category = String(formData.get("category") ?? "").trim() || "operativo";
  const payment = parseExpenseConceptPaymentMethod(
    formData.get("default_payment_method"),
  );
  const allowsCustom = formData.get("allows_custom_text") === "on";
  const sortRaw = Number(formData.get("sort_order") ?? 100);
  const sort_order = Number.isFinite(sortRaw) ? Math.trunc(sortRaw) : 100;

  const { error } = await supabase.from("store_expense_concepts").insert({
    name,
    category,
    default_payment_method: payment,
    applies_to_gasto: kinds.applies_to_gasto,
    applies_to_egreso: kinds.applies_to_egreso,
    allows_custom_text: allowsCustom,
    sort_order,
    is_active: true,
    is_system: false,
    special_key: null,
  });

  if (error) {
    if (error.code === "23505") redirectConceptError("duplicate");
    console.error("[expense concepts] create:", error.message);
    redirectConceptError("db");
  }

  revalidateConcepts();
  redirect("/admin/egresos/conceptos?ok=created");
}

export async function updateExpenseConcept(formData: FormData) {
  await requireAdminPermission("egresos_crear");
  const supabase = await createSupabaseServerClient();

  const id = String(formData.get("id") ?? "").trim();
  if (!UUID_RE.test(id)) redirectConceptError("invalid");

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) redirectConceptError("name");

  const kinds = parseKinds(formData);
  if (!kinds.applies_to_gasto && !kinds.applies_to_egreso) {
    redirectConceptError("kinds");
  }

  const category = String(formData.get("category") ?? "").trim() || "operativo";
  const payment = parseExpenseConceptPaymentMethod(
    formData.get("default_payment_method"),
  );
  const allowsCustom = formData.get("allows_custom_text") === "on";
  const isActive = formData.get("is_active") !== "0";
  const sortRaw = Number(formData.get("sort_order") ?? 100);
  const sort_order = Number.isFinite(sortRaw) ? Math.trunc(sortRaw) : 100;

  const { data: existing, error: loadErr } = await supabase
    .from("store_expense_concepts")
    .select("id,is_system,special_key")
    .eq("id", id)
    .maybeSingle();

  if (loadErr || !existing) {
    redirectConceptError("missing");
    return;
  }

  const current = existing;

  const patch: Record<string, unknown> = {
    name,
    category,
    default_payment_method: payment,
    applies_to_gasto: kinds.applies_to_gasto,
    applies_to_egreso: kinds.applies_to_egreso,
    allows_custom_text: allowsCustom,
    sort_order,
    is_active: isActive,
  };

  // System specials keep their key; don't strip.
  const special = String(current.special_key ?? "").trim();
  if (special === "other_gasto" || special === "other_egreso") {
    patch.allows_custom_text = true;
  }

  const { error } = await supabase
    .from("store_expense_concepts")
    .update(patch)
    .eq("id", id);

  if (error) {
    if (error.code === "23505") redirectConceptError("duplicate");
    console.error("[expense concepts] update:", error.message);
    redirectConceptError("db");
  }

  revalidateConcepts();
  redirect("/admin/egresos/conceptos?ok=updated");
}

export async function deleteExpenseConcept(formData: FormData) {
  await requireAdminPermission("egresos_crear");
  const supabase = await createSupabaseServerClient();

  const id = String(formData.get("id") ?? "").trim();
  if (!UUID_RE.test(id)) redirectConceptError("invalid");

  const { data: existing } = await supabase
    .from("store_expense_concepts")
    .select("id,name,is_system,special_key")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    redirectConceptError("missing");
    return;
  }
  if (existing.is_system) {
    redirectConceptError("system");
    return;
  }

  // Soft-delete if already used on expenses; hard-delete otherwise.
  const conceptName = String(existing.name);
  const { count } = await supabase
    .from("store_expenses")
    .select("id", { count: "exact", head: true })
    .eq("concept", conceptName);

  if ((count ?? 0) > 0) {
    const { error } = await supabase
      .from("store_expense_concepts")
      .update({ is_active: false })
      .eq("id", id);
    if (error) redirectConceptError("db");
    revalidateConcepts();
    redirect("/admin/egresos/conceptos?ok=deactivated");
  }

  const { error } = await supabase
    .from("store_expense_concepts")
    .delete()
    .eq("id", id);
  if (error) redirectConceptError("db");

  revalidateConcepts();
  redirect("/admin/egresos/conceptos?ok=deleted");
}

export async function toggleExpenseConceptActive(formData: FormData) {
  await requireAdminPermission("egresos_crear");
  const supabase = await createSupabaseServerClient();
  const id = String(formData.get("id") ?? "").trim();
  const next = formData.get("is_active") === "1";
  if (!UUID_RE.test(id)) redirectConceptError("invalid");

  const { error } = await supabase
    .from("store_expense_concepts")
    .update({ is_active: next })
    .eq("id", id);
  if (error) redirectConceptError("db");

  revalidateConcepts();
  redirect("/admin/egresos/conceptos");
}
