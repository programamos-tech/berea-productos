import { ReportMonthlyPulse } from "@/components/admin/ReportMonthlyPulse";
import {
  fetchAdminReportMonthlyPulse,
  pulseHighlightYearMonth,
} from "@/lib/admin-report-monthly-pulse";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function ReportMonthlyPulseSkeleton({
  compact = false,
  flat = false,
}: {
  compact?: boolean;
  flat?: boolean;
}) {
  return (
    <div
      className={`animate-pulse ${
        flat
          ? "h-full min-h-0 rounded-lg bg-zinc-100/40 dark:bg-zinc-900/40"
          : `rounded-2xl border border-rose-200/45 bg-white shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900 ${
              compact ? "h-full min-h-0" : "mt-6 h-52"
            }`
      }`}
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
  flat = false,
}: {
  todayKey: string;
  rangeFrom: string;
  rangeTo: string;
  compact?: boolean;
  flat?: boolean;
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
        flat={flat}
      />
    );
  } catch (err) {
    console.error("[admin reportes] monthly pulse:", err);
    return null;
  }
}
