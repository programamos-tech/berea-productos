import { ReportMonthlyPulse } from "@/components/admin/ReportMonthlyPulse";
import { adminPanelLgClass } from "@/lib/admin-ui";
import {
  fetchAdminReportMonthlyPulse,
  pulseHighlightYearMonth,
} from "@/lib/admin-report-monthly-pulse";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function ReportMonthlyPulseSkeleton() {
  return (
    <div
      className={`${adminPanelLgClass} mt-6 h-52 animate-pulse dark:border-zinc-700/60`}
      role="status"
    >
      <span className="sr-only">Cargando pulso mensual…</span>
    </div>
  );
}

export async function ReportMonthlyPulseSection({
  todayKey,
  rangeFrom,
  rangeTo,
}: {
  todayKey: string;
  rangeFrom: string;
  rangeTo: string;
}) {
  try {
    const supabase = await createSupabaseServerClient();
    const pulse = await fetchAdminReportMonthlyPulse(supabase, {
      todayYmd: todayKey,
    });
    return (
      <ReportMonthlyPulse
        months={pulse.months}
        insight={pulse.insight}
        highlightYearMonth={pulseHighlightYearMonth(rangeFrom, rangeTo, todayKey)}
      />
    );
  } catch (err) {
    console.error("[admin reportes] monthly pulse:", err);
    return null;
  }
}
