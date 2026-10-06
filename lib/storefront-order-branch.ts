import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { StorefrontScope } from "@/lib/storefront-scope";

export const STOREFRONT_BRANCH_FIELD = "storefront_branch";
export const STOREFRONT_BRANCH_SIG_FIELD = "storefront_branch_sig";

type ActiveBranch = {
  id: string;
  code: string;
  name: string;
  isDefault: boolean;
};

export type CheckoutBranchResolution =
  | {
      ok: true;
      branchId: string;
      branchCode: string;
      isDefault: boolean;
    }
  | { ok: false; redirectTo: string };

function stampSecret(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  return key;
}

function signBranch(tenantId: string, branchCode: string): string {
  return createHmac("sha256", stampSecret())
    .update(`storefront-branch:${tenantId}:${branchCode}`)
    .digest("base64url");
}

/** Marca la sucursal que renderizó el checkout. El pedido usa esa tienda. */
export function stampStorefrontBranch(
  tenantId: string,
  branchCode: string,
): { code: string; sig: string } {
  const code = branchCode.trim().toLowerCase();
  return { code, sig: signBranch(tenantId, code) };
}

export function readStampedStorefrontBranch(
  formData: FormData,
  tenantId: string,
): string | null {
  const code = String(formData.get(STOREFRONT_BRANCH_FIELD) ?? "")
    .trim()
    .toLowerCase();
  const sig = String(formData.get(STOREFRONT_BRANCH_SIG_FIELD) ?? "").trim();
  if (!/^[a-z0-9-]{1,40}$/.test(code) || !sig) return null;
  const expected = signBranch(tenantId, code);
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  return code;
}

export function storefrontBranchDisplayName(
  code: string | null | undefined,
  name: string | null | undefined,
): string {
  const normalized = String(code ?? "").trim().toLowerCase();
  if (normalized === "local") return "Local";
  if (normalized === "bodega") return "Bodega";
  const label = String(name ?? "").trim();
  return label || normalized || "Local";
}

/**
 * La tienda que abrió el checkout manda.
 * Pública → sucursal local. Bodega → sucursal bodega, solo con la sesión de esa tienda.
 * Si la sesión ya no coincide, no se archiva el pedido en la otra sucursal.
 */
export async function resolveCheckoutBranch(args: {
  supabase: SupabaseClient;
  tenantId: string;
  scope: StorefrontScope;
  formData: FormData;
}): Promise<CheckoutBranchResolution> {
  const { data, error } = await args.supabase
    .from("branches")
    .select("id,code,name,is_default")
    .eq("tenant_id", args.tenantId)
    .eq("is_active", true);

  if (error || !data?.length) {
    return { ok: false, redirectTo: "/checkout?error=stock" };
  }

  const branches: ActiveBranch[] = data.map((row) => ({
    id: String(row.id),
    code: String(row.code ?? "").trim().toLowerCase(),
    name: String(row.name ?? row.code ?? ""),
    isDefault: row.is_default === true,
  }));
  const byCode = new Map(branches.map((branch) => [branch.code, branch]));
  const fallback = branches.find((branch) => branch.isDefault) ?? branches[0];
  const sessionBranch =
    branches.find((branch) => branch.id === args.scope.branchId) ?? fallback;
  const stampedCode = readStampedStorefrontBranch(args.formData, args.tenantId);
  const chosen = (stampedCode ? byCode.get(stampedCode) : undefined) ?? sessionBranch;

  const sessionMatches =
    args.scope.branchId === chosen.id && args.scope.customer != null;
  if (!chosen.isDefault && !sessionMatches) {
    return { ok: false, redirectTo: `/sucursal/${chosen.code}` };
  }

  return {
    ok: true,
    branchId: chosen.id,
    branchCode: chosen.code,
    isDefault: chosen.isDefault,
  };
}
