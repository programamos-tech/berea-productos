import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import {
  ACTIVE_BRANCH_HEADER,
  isBranchId,
} from "@/lib/branch-context";
import {
  ACTING_TENANT_HEADER,
  isActingTenantId,
} from "@/lib/platform-operator";
import {
  DEFAULT_TENANT_SLUG,
  publicHostname,
  resolveTenantFromHost,
  TENANT_SLUG_HEADER,
} from "@/lib/tenancy";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const headerList = await headers();
  const tenantSlug =
    headerList.get(TENANT_SLUG_HEADER)?.trim() ||
    resolveTenantFromHost(publicHostname(headerList)).slug ||
    DEFAULT_TENANT_SLUG;
  const actingTenantId = headerList.get(ACTING_TENANT_HEADER)?.trim() ?? "";
  const activeBranchId = headerList.get(ACTIVE_BRANCH_HEADER)?.trim() ?? "";
  const extraHeaders: Record<string, string> = {
    [TENANT_SLUG_HEADER]: tenantSlug,
  };
  if (isActingTenantId(actingTenantId)) {
    extraHeaders[ACTING_TENANT_HEADER] = actingTenantId;
  }
  if (isBranchId(activeBranchId)) {
    extraHeaders[ACTIVE_BRANCH_HEADER] = activeBranchId;
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: extraHeaders,
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* set from Server Component */
          }
        },
      },
    },
  );
}
