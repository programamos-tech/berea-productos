import { TenantOnboardingWizard } from "@/components/admin/TenantOnboardingWizard";
import { canOnboardTenants } from "@/lib/tenant-onboarding-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Onboarding de nueva tienda (tenant) para operadores Berea.
 * Visible solo a owners (o emails en BEREA_PLATFORM_ADMIN_EMAILS).
 */
export default async function TenantOnboardingPage() {
  if (!(await canOnboardTenants())) {
    redirect("/admin");
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem-1.5rem)] flex-col gap-2.5 overflow-hidden sm:h-[calc(100dvh-4rem-2rem)] md:h-[calc(100dvh-4rem-3rem)]">
      <header className="shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
          Berea · Sistema
        </p>
        <h1 className="mt-0.5 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Nueva tienda
        </h1>
        <p className="mt-1 max-w-xl text-xs text-zinc-500 dark:text-zinc-400">
          Alta de tenant con datos de facturación (tirilla). No clona el catálogo
          de Aleya; el dueño arranca con un panel vacío en su tenant.
        </p>
      </header>
      <TenantOnboardingWizard />
    </div>
  );
}
