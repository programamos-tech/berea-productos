import { AdminDashboardShell } from "@/components/admin/AdminDashboardShell";
import { adminNavAllowedHrefList } from "@/lib/admin-nav-allowed";
import { prettyReportDayShortLabel } from "@/lib/admin-report-range";
import {
  fetchCashSessionForBusinessDay,
  fetchSuggestedOpeningFloatCents,
  todayBusinessDayYmd,
} from "@/lib/cash-register";
import {
  navHrefsForCashGate,
  staffMustOpenCashRegister,
} from "@/lib/cash-register-gate";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perm = await loadAdminPermissions();
  if (!perm) redirect("/admin/login");

  let allowedNavHrefs = adminNavAllowedHrefList(perm.permissions);
  let cashGate: {
    mustOpen: boolean;
    businessDayLabel: string;
    displayName: string | null;
    suggestedOpeningFloatCents: number;
  } | null = null;

  const supabase = await createSupabaseServerClient();
  const today = todayBusinessDayYmd();
  const todaySession = await fetchCashSessionForBusinessDay(supabase, today);
  const mustOpen = staffMustOpenCashRegister({
    jobRole: perm.jobRole,
    permissions: perm.permissions,
    todaySession,
  });

  if (mustOpen) {
    allowedNavHrefs = navHrefsForCashGate(allowedNavHrefs);
    const [{ data: profile }, suggestedOpeningFloatCents] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", perm.userId)
        .maybeSingle(),
      fetchSuggestedOpeningFloatCents(supabase),
    ]);
    cashGate = {
      mustOpen: true,
      businessDayLabel: prettyReportDayShortLabel(today),
      displayName:
        profile?.display_name != null
          ? String(profile.display_name)
          : null,
      suggestedOpeningFloatCents,
    };
  }

  return (
    <AdminDashboardShell
      allowedNavHrefs={allowedNavHrefs}
      notifyNewWebOrders={perm.permissions.ventas_ver}
      cashGate={cashGate}
    >
      {children}
    </AdminDashboardShell>
  );
}
