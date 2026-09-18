import { AdminDashboardShell } from "@/components/admin/AdminDashboardShell";
import { adminNavAllowedHrefList } from "@/lib/admin-nav-allowed";
import { prettyReportDayShortLabel } from "@/lib/admin-report-range";
import { fetchAssignedCashRegister } from "@/lib/cash-registers";
import {
  fetchStaffCashSessionForToday,
  fetchSuggestedOpeningFloatCents,
  todayBusinessDayYmd,
} from "@/lib/cash-register";
import {
  navHrefsForCashGate,
  staffMustOpenCashRegister,
} from "@/lib/cash-register-gate";
import { jobRoleSkipsCashRegister } from "@/lib/admin-permissions";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canOnboardTenants } from "@/lib/tenant-onboarding-auth";
import { redirect } from "next/navigation";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perm = await loadAdminPermissions();
  if (!perm) redirect("/admin/login");
  if (perm.isPlatformOperator && !perm.actingAccount) {
    redirect("/admin/cuentas");
  }
  if (!perm.branchContext) {
    redirect(perm.isPlatformOperator ? "/admin/cuentas" : "/admin/login");
  }

  const needsCashCheck =
    !jobRoleSkipsCashRegister(perm.jobRole) &&
    Boolean(perm.permissions.caja_gestionar);

  const [showOnboarding, todaySession] = await Promise.all([
    canOnboardTenants(),
    needsCashCheck
      ? createSupabaseServerClient().then((supabase) =>
          fetchStaffCashSessionForToday(
            supabase,
            perm.userId,
            todayBusinessDayYmd(),
          ),
        )
      : Promise.resolve(null),
  ]);

  let allowedNavHrefs = adminNavAllowedHrefList(perm.permissions, {
    jobRole: perm.jobRole,
    canOnboard: showOnboarding,
  });
  let cashGate: {
    mustOpen: boolean;
    businessDayLabel: string;
    displayName: string | null;
    suggestedOpeningFloatCents: number;
    cashRegisterId: string | null;
    cashRegisterName: string | null;
  } | null = null;

  const mustOpen = staffMustOpenCashRegister({
    jobRole: perm.jobRole,
    permissions: perm.permissions,
    todaySession,
  });

  if (mustOpen) {
    allowedNavHrefs = navHrefsForCashGate(allowedNavHrefs);
    const supabase = await createSupabaseServerClient();
    const today = todayBusinessDayYmd();
    const assigned = await fetchAssignedCashRegister(supabase, perm.userId);
    const [{ data: profile }, suggestedOpeningFloatCents] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", perm.userId)
        .maybeSingle(),
      fetchSuggestedOpeningFloatCents(supabase, assigned?.id ?? null),
    ]);
    cashGate = {
      mustOpen: true,
      businessDayLabel: prettyReportDayShortLabel(today),
      displayName:
        profile?.display_name != null
          ? String(profile.display_name)
          : null,
      suggestedOpeningFloatCents,
      cashRegisterId: assigned?.id ?? null,
      cashRegisterName: assigned?.name ?? null,
    };
  }

  return (
    <AdminDashboardShell
      allowedNavHrefs={allowedNavHrefs}
      notifyNewWebOrders={perm.permissions.ventas_ver}
      cashGate={cashGate}
      sessionUser={{
        displayName: perm.displayName,
        email: perm.email,
        isPlatformOperator: perm.isPlatformOperator,
      }}
      actingAccount={perm.actingAccount}
      accountBrand={{
        name: perm.tenantName,
        logoSrc: perm.tenantLogoSrc,
        plateColor: perm.tenantLogoPlate,
      }}
      branchContext={perm.branchContext}
    >
      {children}
    </AdminDashboardShell>
  );
}
