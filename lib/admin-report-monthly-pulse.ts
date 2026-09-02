import type { SupabaseClient } from "@supabase/supabase-js";
import {
  currentYearMonthInReportStore,
  monthYmdBounds,
  prettyYearMonthLabel,
  reportCalendarDayKeyFromIso,
  reportYearMonthFromIso,
} from "@/lib/admin-report-range";

export type MonthlyPulsePoint = {
  yearMonth: string;
  label: string;
  shortLabel: string;
  year: string;
  from: string;
  to: string;
  isPartial: boolean;
  isCurrent: boolean;
  ventas: number;
  ingresosConIva: number;
  gananciaBruta: number;
  egresos: number;
  gananciaNeta: number;
  /** Mismo tramo de días del mes anterior (solo mes actual). */
  priorMtdNeta: number | null;
};

export type MonthlyPulseResult = {
  months: MonthlyPulsePoint[];
  insight: string;
};

type RpcMonth = {
  year_month?: unknown;
  ventas?: unknown;
  ingresos_con_iva?: unknown;
  ganancia_bruta?: unknown;
  egresos?: unknown;
  ganancia_neta?: unknown;
};

function capitalizeEs(s: string): string {
  if (!s) return s;
  return s.charAt(0).toLocaleUpperCase("es-CO") + s.slice(1);
}

function shortMonthLabel(yearMonth: string): string {
  const full = prettyYearMonthLabel(yearMonth);
  const monthOnly = full.split(" de ")[0] ?? full;
  return capitalizeEs(monthOnly);
}

function asInt(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function nowPlayingInsight(current: MonthlyPulsePoint | undefined): string {
  if (!current) return "";
  if (current.gananciaNeta > 0) {
    if (current.priorMtdNeta != null && current.gananciaNeta < current.priorMtdNeta) {
      return "Más lento que el mes pasado";
    }
    return "Va bien";
  }
  if (current.gananciaNeta < 0) return "Va en rojo";
  return "En cero por ahora";
}

function parseRpcPayload(raw: unknown): { months: RpcMonth[]; priorMtdNeta: number | null } {
  const obj =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : null;
  if (!obj) return { months: [], priorMtdNeta: null };
  const months = Array.isArray(obj.months) ? (obj.months as RpcMonth[]) : [];
  const prior =
    obj.prior_mtd_neta == null || obj.prior_mtd_neta === ""
      ? null
      : asInt(obj.prior_mtd_neta);
  return { months, priorMtdNeta: prior };
}

/**
 * Historial mensual desde la primera venta hasta hoy.
 * Agregado en Postgres (`admin_report_monthly_pulse`).
 */
export async function fetchAdminReportMonthlyPulse(
  supabase: SupabaseClient,
  opts?: { todayYmd?: string; now?: Date; maxMonths?: number },
): Promise<MonthlyPulseResult> {
  const maxMonths = Math.min(24, Math.max(2, Math.trunc(opts?.maxMonths ?? 24)));
  const todayYmd =
    opts?.todayYmd ??
    reportCalendarDayKeyFromIso((opts?.now ?? new Date()).toISOString());
  const anchorYm = currentYearMonthInReportStore(opts?.now);

  const { data, error } = await supabase.rpc("admin_report_monthly_pulse", {
    p_today: todayYmd,
    p_max_months: maxMonths,
  });
  if (error) {
    console.error("[admin reportes] monthly pulse rpc:", error.message);
    return { months: [], insight: "" };
  }

  const parsed = parseRpcPayload(data);
  const months: MonthlyPulsePoint[] = [];

  for (const row of parsed.months) {
    const ym = String(row.year_month ?? "").slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(ym)) continue;
    const bounds = monthYmdBounds(ym);
    if (!bounds) continue;
    const fullTo = bounds.to;
    const to = fullTo > todayYmd ? todayYmd : fullTo;
    const isCurrent = ym === anchorYm;
    months.push({
      yearMonth: ym,
      label: prettyYearMonthLabel(ym),
      shortLabel: shortMonthLabel(ym),
      year: ym.slice(0, 4),
      from: bounds.from,
      to,
      isPartial: to < fullTo,
      isCurrent,
      ventas: asInt(row.ventas),
      ingresosConIva: asInt(row.ingresos_con_iva),
      gananciaBruta: asInt(row.ganancia_bruta),
      egresos: asInt(row.egresos),
      gananciaNeta: asInt(row.ganancia_neta),
      priorMtdNeta: isCurrent ? parsed.priorMtdNeta : null,
    });
  }

  months.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
  const current = months.find((m) => m.isCurrent);
  return { months, insight: nowPlayingInsight(current) };
}

export function pulseHighlightYearMonth(
  rangeFrom: string,
  rangeTo: string,
  todayYmd: string,
): string | null {
  if (rangeFrom.slice(0, 7) === rangeTo.slice(0, 7)) {
    return rangeFrom.slice(0, 7);
  }
  void todayYmd;
  return reportYearMonthFromIso(`${rangeTo}T17:00:00.000Z`) || null;
}
