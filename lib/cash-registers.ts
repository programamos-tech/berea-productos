import { jobRoleSkipsCashRegister, type CollaboratorJobRole } from "@/lib/admin-permissions";
import type { SupabaseClient } from "@supabase/supabase-js";

export type CashRegisterRow = {
  id: string;
  name: string;
  assigned_user_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export function canViewAllCashRegisters(jobRole: CollaboratorJobRole): boolean {
  return jobRoleSkipsCashRegister(jobRole);
}

export function mapCashRegisterRow(raw: Record<string, unknown>): CashRegisterRow {
  return {
    id: String(raw.id),
    name: String(raw.name ?? "").trim() || "Caja",
    assigned_user_id:
      raw.assigned_user_id == null ? null : String(raw.assigned_user_id),
    sort_order: Math.max(1, Math.floor(Number(raw.sort_order ?? 1))),
    is_active: raw.is_active !== false,
    created_at: String(raw.created_at ?? ""),
  };
}

export async function fetchCashRegisters(
  supabase: SupabaseClient,
  opts?: { activeOnly?: boolean },
): Promise<CashRegisterRow[]> {
  let query = supabase
    .from("cash_registers")
    .select("id,name,assigned_user_id,sort_order,is_active,created_at")
    .order("is_active", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (opts?.activeOnly !== false) {
    query = query.eq("is_active", true);
  }
  const { data, error } = await query;
  if (error) {
    console.error("fetchCashRegisters", error);
    return [];
  }
  return (data ?? []).map((row) => mapCashRegisterRow(row as Record<string, unknown>));
}

export async function fetchCashRegisterById(
  supabase: SupabaseClient,
  id: string,
): Promise<CashRegisterRow | null> {
  const { data, error } = await supabase
    .from("cash_registers")
    .select("id,name,assigned_user_id,sort_order,is_active,created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("fetchCashRegisterById", error);
    return null;
  }
  if (!data) return null;
  return mapCashRegisterRow(data as Record<string, unknown>);
}

export async function fetchAssignedCashRegister(
  supabase: SupabaseClient,
  userId: string,
): Promise<CashRegisterRow | null> {
  const uid = String(userId ?? "").trim();
  if (!uid) return null;
  const { data, error } = await supabase
    .from("cash_registers")
    .select("id,name,assigned_user_id,sort_order,is_active,created_at")
    .eq("assigned_user_id", uid)
    .eq("is_active", true)
    .maybeSingle();
  if (error) {
    console.error("fetchAssignedCashRegister", error);
    return null;
  }
  if (!data) return null;
  return mapCashRegisterRow(data as Record<string, unknown>);
}

export type CashRegisterAssignee = {
  id: string;
  label: string;
  job_role: string | null;
};

export async function fetchCashRegisterAssigneeOptions(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<CashRegisterAssignee[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,display_name,login_username,job_role,is_active")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("display_name", { ascending: true });
  if (error) {
    console.error("fetchCashRegisterAssigneeOptions", error);
    return [];
  }
  const out: CashRegisterAssignee[] = [];
  for (const row of data ?? []) {
    const display = String(row.display_name ?? "").trim();
    const login = String(row.login_username ?? "").trim();
    const label = display || login;
    if (!label) continue;
    out.push({
      id: String(row.id),
      label,
      job_role: row.job_role == null ? null : String(row.job_role),
    });
  }
  return out;
}
