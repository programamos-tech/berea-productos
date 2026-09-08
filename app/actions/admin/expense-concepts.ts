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

function parseConceptRole(formData: FormData): {
  applies_to_gasto: boolean;
  applies_to_egreso: boolean;
  allows_custom_text: boolean;
  category: string;
} {
  const kind = String(formData.get("concept_kind") ?? "").trim();
  if (kind === "egreso") {
    return {
      applies_to_gasto: false,
      applies_to_egreso: true,
      allows_custom_text: false,
      category: "impuestos",
    };
  }
  if (kind === "otro") {
    return {
      applies_to_gasto: true,
      applies_to_egreso: false,
      allows_custom_text: true,
      category: "operativo",
    };
  }
  return {
    applies_to_gasto: true,
    applies_to_egreso: false,
    allows_custom_text: false,
    category: "operativo",
  };
}

export async function createExpenseConcept(formData: FormData) {
  await requireAdminPermission("egresos_crear");
  const supabase = await createSupabaseServerClient();

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) redirectConceptError("name");

  const role = parseConceptRole(formData);
  const payment = parseExpenseConceptPaymentMethod(
    formData.get("default_payment_method"),
  );

  const { error } = await supabase.from("store_expense_concepts").insert({
    name,
    category: role.category,
    default_payment_method: payment,
    applies_to_gasto: role.applies_to_gasto,
    applies_to_egreso: role.applies_to_egreso,
    allows_custom_text: role.allows_custom_text,
    sort_order: 100,
    is_active: formData.get("is_active") !== "0",
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

  const role = parseConceptRole(formData);
  const payment = parseExpenseConceptPaymentMethod(
    formData.get("default_payment_method"),
  );
  const isActive = formData.get("is_active") !== "0";

  const { data: existing, error: loadErr } = await supabase
    .from("store_expense_concepts")
    .select("id,is_system,special_key,sort_order,category")
    .eq("id", id)
    .maybeSingle();

  if (loadErr || !existing) {
    redirectConceptError("missing");
    return;
  }

  const current = existing;
  const special = String(current.special_key ?? "").trim();

  const patch: Record<string, unknown> = {
    name,
    category: role.category,
    default_payment_method: payment,
    applies_to_gasto: role.applies_to_gasto,
    applies_to_egreso: role.applies_to_egreso,
    allows_custom_text: role.allows_custom_text,
    is_active: isActive,
    sort_order: Number(current.sort_order ?? 100) || 100,
  };

  // Keep system “Otro impuesto” as egreso + free text.
  if (special === "other_egreso") {
    patch.applies_to_gasto = false;
    patch.applies_to_egreso = true;
    patch.allows_custom_text = true;
    patch.category = "impuestos";
  } else if (special === "other_gasto") {
    patch.applies_to_gasto = true;
    patch.applies_to_egreso = false;
    patch.allows_custom_text = true;
    patch.category = "operativo";
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
