"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clearActingTenantCookie } from "@/lib/platform-operator-server";
import { redirect } from "next/navigation";

export async function signOutAdmin() {
  await clearActingTenantCookie();
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
