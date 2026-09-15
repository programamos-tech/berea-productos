import { cache } from "react";
import { cookies, headers } from "next/headers";
import {
  accountHolderLabel,
  ACTING_TENANT_COOKIE,
  ACTING_TENANT_HEADER,
  isActingTenantId,
} from "@/lib/platform-operator";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ActingCustomerTenant = {
  id: string;
  slug: string;
  name: string;
  accountHolderName: string;
};

function actingCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export async function readActingTenantHeader(): Promise<string | null> {
  const raw = (await headers()).get(ACTING_TENANT_HEADER)?.trim() ?? "";
  return isActingTenantId(raw) ? raw : null;
}

async function resolveActingCustomerTenantUncached(): Promise<ActingCustomerTenant | null> {
  const actingId = await readActingTenantHeader();
  if (!actingId) return null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_operator")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_platform_operator) return null;

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, slug, name, account_holder_name")
    .eq("id", actingId)
    .eq("kind", "customer")
    .in("status", ["active", "trial"])
    .maybeSingle();

  if (!tenant?.id) return null;

  return {
    id: tenant.id as string,
    slug: tenant.slug as string,
    name: tenant.name as string,
    accountHolderName: accountHolderLabel(
      tenant.account_holder_name as string | null,
    ),
  };
}

export const resolveActingCustomerTenant = cache(
  resolveActingCustomerTenantUncached,
);

export async function setActingTenantCookie(tenantId: string): Promise<void> {
  const jar = await cookies();
  jar.set(ACTING_TENANT_COOKIE, tenantId, actingCookieOptions());
}

export async function clearActingTenantCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(ACTING_TENANT_COOKIE, "", { ...actingCookieOptions(), maxAge: 0 });
}
