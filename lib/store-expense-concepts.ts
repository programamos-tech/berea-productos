import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExpensePaymentMethod } from "@/lib/expense-concepts";
import type { ExpenseKind } from "@/lib/expenses-constants";

export type ExpenseConceptSpecialKey =
  | "personal_turnos"
  | "supplier_payment"
  | "other_gasto"
  | "other_egreso";

export type StoreExpenseConceptRow = {
  id: string;
  name: string;
  category: string;
  default_payment_method: ExpensePaymentMethod;
  applies_to_gasto: boolean;
  applies_to_egreso: boolean;
  allows_custom_text: boolean;
  special_key: ExpenseConceptSpecialKey | null;
  sort_order: number;
  is_active: boolean;
  is_system: boolean;
};

export type ExpenseConceptSelectOption = {
  id: string;
  concept: string;
  category: string;
  paymentMethod: ExpensePaymentMethod;
  allowsCustomText: boolean;
  specialKey: ExpenseConceptSpecialKey | null;
};

const PAYMENT_METHODS = new Set<string>([
  "transferencia",
  "efectivo",
  "efectivo_acumulado",
  "tarjeta",
  "otro",
]);

export function parseExpenseConceptPaymentMethod(
  raw: unknown,
): ExpensePaymentMethod {
  const m = String(raw ?? "").trim().toLowerCase();
  if (PAYMENT_METHODS.has(m)) return m as ExpensePaymentMethod;
  return "transferencia";
}

function mapRow(row: Record<string, unknown>): StoreExpenseConceptRow {
  const special = String(row.special_key ?? "").trim();
  return {
    id: String(row.id),
    name: String(row.name ?? "").trim(),
    category: String(row.category ?? "operativo").trim() || "operativo",
    default_payment_method: parseExpenseConceptPaymentMethod(
      row.default_payment_method,
    ),
    applies_to_gasto: row.applies_to_gasto === true,
    applies_to_egreso: row.applies_to_egreso === true,
    allows_custom_text: row.allows_custom_text === true,
    special_key:
      special === "personal_turnos" ||
      special === "supplier_payment" ||
      special === "other_gasto" ||
      special === "other_egreso"
        ? special
        : null,
    sort_order: Number(row.sort_order ?? 100) || 100,
    is_active: row.is_active !== false,
    is_system: row.is_system === true,
  };
}

export function conceptRowToSelectOption(
  row: StoreExpenseConceptRow,
): ExpenseConceptSelectOption {
  return {
    id: row.id,
    concept: row.name,
    category: row.category,
    paymentMethod: row.default_payment_method,
    allowsCustomText: row.allows_custom_text,
    specialKey: row.special_key,
  };
}

export async function fetchStoreExpenseConcepts(
  supabase: SupabaseClient,
  opts?: { activeOnly?: boolean },
): Promise<StoreExpenseConceptRow[]> {
  let q = supabase
    .from("store_expense_concepts")
    .select(
      "id,name,category,default_payment_method,applies_to_gasto,applies_to_egreso,allows_custom_text,special_key,sort_order,is_active,is_system",
    )
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (opts?.activeOnly) {
    q = q.eq("is_active", true);
  }

  const { data, error } = await q;
  if (error) {
    console.error("[expense concepts] list:", error.message);
    return [];
  }
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
}

export async function fetchExpenseConceptSelectOptions(
  supabase: SupabaseClient,
  kind: ExpenseKind,
): Promise<ExpenseConceptSelectOption[]> {
  const rows = await fetchStoreExpenseConcepts(supabase, { activeOnly: true });
  return rows
    .filter((r) =>
      kind === "egreso" ? r.applies_to_egreso : r.applies_to_gasto,
    )
    .map(conceptRowToSelectOption);
}

export async function fetchExpenseConceptFilterNames(
  supabase: SupabaseClient,
): Promise<string[]> {
  const rows = await fetchStoreExpenseConcepts(supabase, { activeOnly: true });
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of rows) {
    if (r.allows_custom_text) continue;
    if (seen.has(r.name)) continue;
    seen.add(r.name);
    out.push(r.name);
  }
  return out;
}

/** Resolve concept text for create: fixed name, other free text, or Personal Turnos — worker. */
export function resolveExpenseConceptValue(opts: {
  selectionName: string;
  allowsCustomText: boolean;
  specialKey: ExpenseConceptSpecialKey | null;
  customText: string;
  turnWorkerLabel: string | null;
}): string | null {
  if (opts.specialKey === "personal_turnos") {
    const label = String(opts.turnWorkerLabel ?? "").trim();
    return label ? `Personal Turnos — ${label}` : null;
  }
  if (opts.allowsCustomText || opts.specialKey === "other_gasto" || opts.specialKey === "other_egreso") {
    const t = opts.customText.trim();
    return t.length >= 2 ? t : null;
  }
  const name = opts.selectionName.trim();
  return name || null;
}

export function isConceptAllowedForKind(
  row: StoreExpenseConceptRow,
  kind: ExpenseKind,
): boolean {
  return kind === "egreso" ? row.applies_to_egreso : row.applies_to_gasto;
}
