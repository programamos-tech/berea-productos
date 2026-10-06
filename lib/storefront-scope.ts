import { cache } from "react";
import { cookies, headers } from "next/headers";
import { wholesaleDiscountPercentFromRow } from "@/lib/customer-wholesale-pricing";
import { getStorefrontTenant } from "@/lib/storefront-tenant";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const STOREFRONT_BRANCH_COOKIE = "berea_storefront_branch";
export const STOREFRONT_CUSTOMER_COOKIE = "berea_storefront_customer";

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30;

export type StorefrontScopeCustomer = {
  id: string;
  name: string;
  wholesalePct: number;
};

export type StorefrontScope = {
  branchId: string | null;
  branchCode: string;
  branchName: string;
  isDefault: boolean;
  /** Sucursal distinta de Local: hace falta el código del mayorista. */
  requiresCode: boolean;
  /** Color propio de la sucursal. Null usa el color de la tienda pública. */
  storefrontColor: string | null;
  customer: StorefrontScopeCustomer | null;
  /**
   * Productos visibles en esta sucursal.
   * `null` si la tabla aún no existe: no se filtra el catálogo.
   */
  listedProductIds: Set<string> | null;
};

type BranchRow = {
  id: string;
  code: string;
  name: string;
  is_default: boolean;
  storefront_color: string | null;
};

const ALEYA_BODEGA_COLOR = "#FFDAB8";

function branchStorefrontColor(
  branch: BranchRow,
  tenantSlug: string,
): string | null {
  if (branch.is_default) return null;
  const stored = String(branch.storefront_color ?? "").trim();
  if (/^#[0-9a-f]{6}$/i.test(stored)) return stored.toUpperCase();
  if (tenantSlug === "aleya" && branch.code.toLowerCase() === "bodega") {
    return ALEYA_BODEGA_COLOR;
  }
  return null;
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
  };
}

export async function setStorefrontSessionCookies(
  branchCode: string,
  customerId: string,
): Promise<void> {
  const jar = await cookies();
  jar.set(STOREFRONT_BRANCH_COOKIE, branchCode, cookieOptions());
  jar.set(STOREFRONT_CUSTOMER_COOKIE, customerId, cookieOptions());
}

export async function clearStorefrontSessionCookies(): Promise<void> {
  const jar = await cookies();
  jar.delete(STOREFRONT_BRANCH_COOKIE);
  jar.delete(STOREFRONT_CUSTOMER_COOKIE);
}

export const getStorefrontScope = cache(async (): Promise<StorefrontScope> => {
  const empty: StorefrontScope = {
    branchId: null,
    branchCode: "local",
    branchName: "Local",
    isDefault: true,
    requiresCode: false,
    storefrontColor: null,
    customer: null,
    listedProductIds: null,
  };

  let tenantId: string;
  let tenantSlug: string;
  try {
    const tenant = await getStorefrontTenant();
    tenantId = tenant.id;
    tenantSlug = tenant.slug;
  } catch {
    return empty;
  }

  const jar = await cookies();
  const headerList = await headers();
  const pathCode =
    /^\/sucursal\/([a-z0-9-]+)/.exec(headerList.get("x-store-path") ?? "")?.[1] ??
    "";
  const requestedCode =
    jar.get(STOREFRONT_BRANCH_COOKIE)?.value?.trim().toLowerCase() || pathCode;
  const customerId = jar.get(STOREFRONT_CUSTOMER_COOKIE)?.value?.trim() ?? "";

  const supabase = createSupabaseServiceClient();
  const { data: branchRows, error: branchErr } = await supabase
    .from("branches")
    .select("id,code,name,is_default,storefront_color")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  if (branchErr || !branchRows?.length) return empty;

  const branches = branchRows as BranchRow[];
  const byCode = requestedCode
    ? branches.find((b) => b.code.toLowerCase() === requestedCode)
    : undefined;
  const fallback = branches.find((b) => b.is_default) ?? branches[0];
  const branch = byCode ?? fallback;
  if (!branch) return empty;

  const isDefault = branch.is_default === true;
  let customer: StorefrontScopeCustomer | null = null;

  if (!isDefault && customerId) {
    const { data: row } = await supabase
      .from("customers")
      .select("id,name,customer_kind,wholesale_discount_percent,branch_id")
      .eq("id", customerId)
      .eq("tenant_id", tenantId)
      .eq("branch_id", branch.id)
      .maybeSingle();

    if (row && String(row.customer_kind) === "wholesale") {
      customer = {
        id: String(row.id),
        name: String(row.name ?? "").trim() || "Mayorista",
        wholesalePct: wholesaleDiscountPercentFromRow(
          row as {
            customer_kind?: string | null;
            wholesale_discount_percent?: number | null;
          },
        ),
      };
    }
  }

  let listedProductIds: Set<string> | null = null;
  const { data: listings, error: listErr } = await supabase
    .from("product_branch_listings")
    .select("product_id")
    .eq("branch_id", branch.id);

  if (!listErr) {
    listedProductIds = new Set(
      (listings ?? []).map((row) => String((row as { product_id: string }).product_id)),
    );
  }

  return {
    branchId: String(branch.id),
    branchCode: String(branch.code).toLowerCase(),
    branchName: String(branch.name ?? branch.code),
    isDefault,
    requiresCode: !isDefault,
    storefrontColor: branchStorefrontColor(branch, tenantSlug),
    customer,
    listedProductIds,
  };
});
