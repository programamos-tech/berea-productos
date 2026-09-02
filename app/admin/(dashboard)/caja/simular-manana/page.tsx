import Link from "next/link";
import { CashRegisterMorningGateModal } from "@/components/admin/CashRegisterMorningGateModal";
import { prettyReportDayShortLabel } from "@/lib/admin-report-range";
import { fetchSuggestedOpeningFloatCents } from "@/lib/cash-register";
import { requireAdminAnyPermission } from "@/lib/require-admin-permission";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Preview del modal matutino como lo vería Andrew (cashier) mañana. */
export default async function SimularCajaMananaPage() {
  await requireAdminAnyPermission([
    "caja_ver",
    "caja_gestionar",
    "inicio_reportes",
  ]);

  const tomorrowLabel = prettyReportDayShortLabel("2026-08-06");
  const supabase = await createSupabaseServerClient();
  const suggestedOpeningFloatCents =
    await fetchSuggestedOpeningFloatCents(supabase);

  return (
    <div className="relative min-h-[70vh] space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Simulación · entrada de mañana
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
          Usuario: <span className="font-medium">Andrew vendedor</span> (
          andrew@aleyashop.com) · rol cajero · sin reportes. El menú quedaría solo en Caja y
          Cuenta hasta confirmar el efectivo del día anterior.
        </p>
        <p className="mt-3 text-sm text-zinc-500">
          <Link href="/admin/caja" className="underline underline-offset-2">
            Volver a caja
          </Link>
        </p>
      </div>

      <div className="pointer-events-none select-none opacity-40" aria-hidden>
        <div className="rounded-xl border border-dashed border-zinc-300 p-6 dark:border-zinc-600">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Panel bloqueado detrás del modal
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Ventas, egresos y el resto no están disponibles hasta confirmar el arrastre.
          </p>
        </div>
      </div>

      <CashRegisterMorningGateModal
        businessDayLabel={tomorrowLabel}
        displayName="Andrew vendedor"
        suggestedOpeningFloatCents={suggestedOpeningFloatCents}
        demoMode
      />
    </div>
  );
}
