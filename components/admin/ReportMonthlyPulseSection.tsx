import { ReportMonthlyPulse } from "@/components/admin/ReportMonthlyPulse";
import { adminPanelLgClass } from "@/lib/admin-ui";
import {
  fetchAdminReportMonthlyPulse,
  pulseHighlightYearMonth,
} from "@/lib/admin-report-monthly-pulse";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function ReportMonthlyPulseSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`${adminPanelLgClass} ${compact ? "h-full min-h-0" : "mt-6 h-52"} animate-pulse dark:border-zinc-700/60`}
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
  compact = false,
}: {
  todayKey: string;
  rangeFrom: string;
  rangeTo: string;
  compact?: boolean;
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
        compact={compact}
      />
    );
  } catch (err) {
    console.error("[admin reportes] monthly pulse:", err);
    return null;
  }
}
