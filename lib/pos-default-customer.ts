import type { SupabaseClient } from "@supabase/supabase-js";
import { withTimeout } from "@/lib/async-timeout";

/** Cliente genérico de mostrador (walk-in) para facturar sin ficha nominada. */
export const DEFAULT_POS_CUSTOMER_NAME = "Cliente Final";

const LOOKUP_TIMEOUT_MS = 4_000;

function normalizeCustomerName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function isDefaultPosCustomerName(name: string): boolean {
  return normalizeCustomerName(name) === normalizeCustomerName(DEFAULT_POS_CUSTOMER_NAME);
}

/**
 * Busca el cliente walk-in por nombre. Prefiere coincidencia exacta
 * "Cliente Final" (sin importar mayúsculas) sobre variantes como
 * "CLIENTE FINAL NEW".
 */
export async function findDefaultPosCustomerId(
  supabase: SupabaseClient,
): Promise<string | undefined> {
  const queryResult = await withTimeout(
    supabase
      .from("customers")
      .select("id,name")
      .ilike("name", "%cliente final%")
      .limit(20),
    LOOKUP_TIMEOUT_MS,
  );

  if (!queryResult || queryResult.error || !queryResult.data?.length) {
    return undefined;
  }

  const rows = queryResult.data as { id: string; name: string }[];
  const exact = rows.find((c) => isDefaultPosCustomerName(c.name));
  if (exact) return exact.id;

  return [...rows].sort((a, b) => a.name.length - b.name.length)[0]?.id;
}
