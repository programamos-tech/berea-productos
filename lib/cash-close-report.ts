import {
  createdAtBoundsForReportYmdRange,
  prettyReportDayShortLabel,
  REPORT_STORE_TIME_ZONE,
} from "@/lib/admin-report-range";
import type { CashExpenseLine, CashStockOutLine } from "@/lib/cash-register";
import { cashCloseReportToAddress, sendHtmlEmail } from "@/lib/email/send";
import { formatCop } from "@/lib/money";
import type { SupabaseClient } from "@supabase/supabase-js";

export type CashCloseReportInput = {
  businessDay: string;
  openingFloatCents: number;
  salesCount: number;
  salesTotalCents: number;
  salesCashCents: number;
  salesTransferCents: number;
  salesMixedCents: number;
  salesOtherCents: number;
  expensesCashCents: number;
  expensesOtherCents: number;
  expectedCashCents: number;
  countedCashCents: number;
  cashDifferenceCents: number;
  unitsSold: number;
  stockOutLines: CashStockOutLine[];
  expenseLines: CashExpenseLine[];
  notes: string | null;
  openedByName: string | null;
  closedByName: string | null;
  openedAt: string | null;
  closedAt: string | null;
};

type HourBucket = { hour: number; label: string; cents: number; count: number };
type StaffRow = { name: string; sales: number; actions: number };

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hourInBogota(iso: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: REPORT_STORE_TIME_ZONE,
    hour: "numeric",
    hour12: false,
  }).formatToParts(new Date(iso));
  const h = parts.find((p) => p.type === "hour")?.value;
  return Math.max(0, Math.min(23, Number(h ?? 0)));
}

function barRow(label: string, value: number, max: number, color: string): string {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return `
    <tr>
      <td style="padding:6px 8px 6px 0;font-size:13px;color:#3f3f46;width:42%;vertical-align:middle;">${esc(label)}</td>
      <td style="padding:6px 0;width:58%;vertical-align:middle;">
        <div style="background:#f4f4f5;border-radius:999px;height:12px;overflow:hidden;">
          <div style="width:${pct}%;height:12px;background:${color};border-radius:999px;"></div>
        </div>
        <div style="font-size:11px;color:#71717a;margin-top:3px;">${esc(formatCop(value))}</div>
      </td>
    </tr>`;
}

function metricCard(label: string, value: string, sub?: string): string {
  return `
    <td style="width:33%;padding:8px;">
      <div style="border:1px solid #e4e4e7;border-radius:12px;padding:12px;background:#fafafa;">
        <div style="font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.04em;">${esc(label)}</div>
        <div style="font-size:18px;font-weight:700;color:#18181b;margin-top:4px;">${esc(value)}</div>
        ${sub ? `<div style="font-size:11px;color:#a1a1aa;margin-top:2px;">${esc(sub)}</div>` : ""}
      </div>
    </td>`;
}

export async function gatherCashCloseReportExtras(
  supabase: SupabaseClient,
  businessDay: string,
): Promise<{
  hourly: HourBucket[];
  staff: StaffRow[];
}> {
  const bounds = createdAtBoundsForReportYmdRange(businessDay, businessDay);
  const hourlyMap = new Map<number, HourBucket>();
  for (let h = 8; h <= 20; h++) {
    hourlyMap.set(h, {
      hour: h,
      label: `${String(h).padStart(2, "0")}:00`,
      cents: 0,
      count: 0,
    });
  }

  const staffSales = new Map<string, number>();
  const staffActions = new Map<string, number>();
  const nameById = new Map<string, string>();

  if (bounds) {
    const { data: orders } = await supabase
      .from("orders")
      .select("id,total_cents,created_at")
      .eq("status", "paid")
      .gte("created_at", bounds.gte)
      .lt("created_at", bounds.lt);

    for (const o of orders ?? []) {
      const created = String(o.created_at ?? "");
      if (!created) continue;
      const hour = hourInBogota(created);
      const bucket =
        hourlyMap.get(hour) ??
        ({
          hour,
          label: `${String(hour).padStart(2, "0")}:00`,
          cents: 0,
          count: 0,
        } satisfies HourBucket);
      const total = Math.max(0, Math.floor(Number(o.total_cents ?? 0)));
      bucket.cents += total;
      bucket.count += 1;
      hourlyMap.set(hour, bucket);
    }

    const { data: activities } = await supabase
      .from("admin_activity_log")
      .select("actor_id, action_type, created_at")
      .gte("created_at", bounds.gte)
      .lt("created_at", bounds.lt)
      .limit(800);

    for (const a of activities ?? []) {
      const actor = String(a.actor_id ?? "");
      if (!actor) continue;
      staffActions.set(actor, (staffActions.get(actor) ?? 0) + 1);
      if (a.action_type === "sale_created") {
        staffSales.set(actor, (staffSales.get(actor) ?? 0) + 1);
      }
    }
  }

  const actorIds = [
    ...new Set([...staffSales.keys(), ...staffActions.keys()]),
  ];
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, login_username")
      .in("id", actorIds);
    for (const p of profiles ?? []) {
      const id = String(p.id);
      const name =
        String(p.display_name ?? "").trim() ||
        String(p.login_username ?? "").trim() ||
        "Usuario";
      nameById.set(id, name);
    }
  }

  const staff: StaffRow[] = actorIds
    .map((id) => ({
      name: nameById.get(id) ?? "Usuario",
      sales: staffSales.get(id) ?? 0,
      actions: staffActions.get(id) ?? 0,
    }))
    .sort((a, b) => b.sales - a.sales || b.actions - a.actions);

  const hourly = [...hourlyMap.values()]
    .filter((h) => h.count > 0 || (h.hour >= 9 && h.hour <= 19))
    .sort((a, b) => a.hour - b.hour);

  return { hourly, staff };
}

export function buildCashCloseReportHtml(
  input: CashCloseReportInput,
  extras: { hourly: HourBucket[]; staff: StaffRow[] },
): { subject: string; html: string; text: string } {
  const dayLabel = prettyReportDayShortLabel(input.businessDay);
  const diff = input.cashDifferenceCents;
  const diffLabel =
    diff === 0
      ? "Cuadró"
      : diff > 0
        ? `Sobrante ${formatCop(diff)}`
        : `Faltante ${formatCop(Math.abs(diff))}`;
  const diffColor =
    diff === 0 ? "#047857" : diff > 0 ? "#b45309" : "#b91c1c";

  const top = [...input.stockOutLines]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);
  const topMax = top[0]?.quantity ?? 0;
  const topProduct = top[0];

  const payMax = Math.max(
    input.salesCashCents,
    input.salesTransferCents,
    input.salesMixedCents + input.salesOtherCents,
    1,
  );
  const hourMax = Math.max(...extras.hourly.map((h) => h.cents), 1);
  const expMax = Math.max(...input.expenseLines.map((e) => e.amount_cents), 1);

  const topBars = top
    .map((p) => {
      const pct = topMax > 0 ? Math.max(4, Math.round((p.quantity / topMax) * 100)) : 0;
      return `
        <tr>
          <td style="padding:7px 8px 7px 0;font-size:13px;color:#27272a;">
            ${esc(p.name)}
            <div style="font-size:11px;color:#a1a1aa;">Ref ${esc(p.reference ?? "—")}</div>
          </td>
          <td style="padding:7px 0;width:45%;">
            <div style="background:#f4f4f5;border-radius:999px;height:12px;overflow:hidden;">
              <div style="width:${pct}%;height:12px;background:#9f1239;border-radius:999px;"></div>
            </div>
          </td>
          <td style="padding:7px 0 7px 10px;font-size:13px;font-weight:700;text-align:right;white-space:nowrap;">${p.quantity} ud</td>
        </tr>`;
    })
    .join("");

  const hourBars = extras.hourly
    .map((h) => barRow(`${h.label} · ${h.count} fact.`, h.cents, hourMax, "#0e7490"))
    .join("");

  const payBars = [
    barRow("Efectivo", input.salesCashCents, payMax, "#059669"),
    barRow("Transferencia", input.salesTransferCents, payMax, "#0284c7"),
    barRow(
      "Mixtas / otras",
      input.salesMixedCents + input.salesOtherCents,
      payMax,
      "#7c3aed",
    ),
  ].join("");

  const expenseRows =
    input.expenseLines.length === 0
      ? `<tr><td colspan="3" style="padding:8px 0;color:#71717a;font-size:13px;">Sin egresos este día.</td></tr>`
      : input.expenseLines
          .map((e) => {
            const pct = Math.max(4, Math.round((e.amount_cents / expMax) * 100));
            return `
            <tr>
              <td style="padding:7px 8px 7px 0;font-size:13px;">${esc(e.concept)}
                <div style="font-size:11px;color:#a1a1aa;">${esc(e.payment_method)}</div>
              </td>
              <td style="padding:7px 0;width:40%;">
                <div style="background:#f4f4f5;border-radius:999px;height:10px;overflow:hidden;">
                  <div style="width:${pct}%;height:10px;background:#d97706;border-radius:999px;"></div>
                </div>
              </td>
              <td style="padding:7px 0 7px 10px;font-size:13px;font-weight:600;text-align:right;white-space:nowrap;">${esc(formatCop(e.amount_cents))}</td>
            </tr>`;
          })
          .join("");

  const staffRows =
    extras.staff.length === 0
      ? `<tr><td style="padding:8px 0;color:#71717a;font-size:13px;">Sin actividad registrada de colaboradores.</td></tr>`
      : extras.staff
          .map(
            (s) => `
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #f4f4f5;font-size:13px;font-weight:600;">${esc(s.name)}</td>
            <td style="padding:8px 0;border-bottom:1px solid #f4f4f5;font-size:13px;text-align:right;">${s.sales} ventas</td>
            <td style="padding:8px 0;border-bottom:1px solid #f4f4f5;font-size:13px;text-align:right;color:#71717a;">${s.actions} acciones</td>
          </tr>`,
          )
          .join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
  <div style="max-width:680px;margin:0 auto;padding:24px 12px;">
    <div style="background:#4c0519;color:#fff;border-radius:16px 16px 0 0;padding:22px 24px;">
      <div style="font-size:12px;opacity:0.8;letter-spacing:0.08em;text-transform:uppercase;">Cierre de caja</div>
      <div style="font-size:24px;font-weight:700;margin-top:4px;">Milagros Guacarí · ${esc(dayLabel)}</div>
      <div style="margin-top:10px;display:inline-block;background:rgba(255,255,255,0.12);border-radius:999px;padding:6px 12px;font-size:13px;">
        ${esc(diffLabel)}
      </div>
    </div>

    <div style="background:#fff;border:1px solid #e4e4e7;border-top:0;border-radius:0 0 16px 16px;padding:20px 18px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
        ${metricCard("Ventas del día", formatCop(input.salesTotalCents), `${input.salesCount} facturas`)}
        ${metricCard("Unidades", String(input.unitsSold), topProduct ? `Top: ${topProduct.name}` : undefined)}
        ${metricCard("Efectivo contado", formatCop(input.countedCashCents), `Esperado ${formatCop(input.expectedCashCents)}`)}
      </tr></table>

      <div style="margin-top:18px;border:1px solid #e4e4e7;border-radius:12px;padding:14px 16px;">
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;">Resumen de caja</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#3f3f46;">
          <tr><td style="padding:4px 0;">Fondo inicial</td><td style="text-align:right;font-weight:600;">${esc(formatCop(input.openingFloatCents))}</td></tr>
          <tr><td style="padding:4px 0;">Ventas efectivo</td><td style="text-align:right;font-weight:600;">${esc(formatCop(input.salesCashCents))}</td></tr>
          <tr><td style="padding:4px 0;">Ventas transferencia</td><td style="text-align:right;font-weight:600;">${esc(formatCop(input.salesTransferCents))}</td></tr>
          <tr><td style="padding:4px 0;">Egresos efectivo</td><td style="text-align:right;font-weight:600;">${esc(formatCop(input.expensesCashCents))}</td></tr>
          <tr><td style="padding:4px 0;">Egresos otros</td><td style="text-align:right;font-weight:600;">${esc(formatCop(input.expensesOtherCents))}</td></tr>
          <tr><td style="padding:8px 0 4px;border-top:1px solid #f4f4f5;">Efectivo esperado</td><td style="padding:8px 0 4px;border-top:1px solid #f4f4f5;text-align:right;font-weight:700;">${esc(formatCop(input.expectedCashCents))}</td></tr>
          <tr><td style="padding:4px 0;">Diferencia</td><td style="text-align:right;font-weight:700;color:${diffColor};">${esc(diffLabel)}</td></tr>
        </table>
        <div style="margin-top:10px;font-size:12px;color:#71717a;">
          Abrió: ${esc(input.openedByName ?? "—")}${input.openedAt ? ` · ${esc(new Date(input.openedAt).toLocaleString("es-CO", { timeZone: REPORT_STORE_TIME_ZONE }))}` : ""}<br/>
          Cerró: ${esc(input.closedByName ?? "—")}${input.closedAt ? ` · ${esc(new Date(input.closedAt).toLocaleString("es-CO", { timeZone: REPORT_STORE_TIME_ZONE }))}` : ""}
          ${input.notes ? `<br/>Nota: ${esc(input.notes)}` : ""}
        </div>
      </div>

      <div style="margin-top:18px;border:1px solid #e4e4e7;border-radius:12px;padding:14px 16px;">
        <div style="font-size:14px;font-weight:700;margin-bottom:4px;">Producto más vendido</div>
        <div style="font-size:13px;color:#52525b;margin-bottom:10px;">
          ${
            topProduct
              ? `<strong style="color:#18181b;">${esc(topProduct.name)}</strong> · ${topProduct.quantity} unidades`
              : "Sin unidades vendidas."
          }
        </div>
        <table width="100%" cellpadding="0" cellspacing="0">${topBars}</table>
      </div>

      <div style="margin-top:18px;border:1px solid #e4e4e7;border-radius:12px;padding:14px 16px;">
        <div style="font-size:14px;font-weight:700;margin-bottom:10px;">Ventas por forma de pago</div>
        <table width="100%" cellpadding="0" cellspacing="0">${payBars}</table>
      </div>

      <div style="margin-top:18px;border:1px solid #e4e4e7;border-radius:12px;padding:14px 16px;">
        <div style="font-size:14px;font-weight:700;margin-bottom:10px;">Actividad por hora (Bogotá)</div>
        <table width="100%" cellpadding="0" cellspacing="0">${hourBars || `<tr><td style="color:#71717a;font-size:13px;">Sin ventas horarias.</td></tr>`}</table>
      </div>

      <div style="margin-top:18px;border:1px solid #e4e4e7;border-radius:12px;padding:14px 16px;">
        <div style="font-size:14px;font-weight:700;margin-bottom:10px;">Quién operó hoy</div>
        <table width="100%" cellpadding="0" cellspacing="0">${staffRows}</table>
      </div>

      <div style="margin-top:18px;border:1px solid #e4e4e7;border-radius:12px;padding:14px 16px;">
        <div style="font-size:14px;font-weight:700;margin-bottom:10px;">Egresos del día · ${esc(formatCop(input.expensesCashCents + input.expensesOtherCents))}</div>
        <table width="100%" cellpadding="0" cellspacing="0">${expenseRows}</table>
      </div>

      <p style="margin:22px 0 0;font-size:11px;color:#a1a1aa;text-align:center;">
        Reporte automático al cerrar caja · Milagros Guacarí
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = [
    `Cierre de caja · ${dayLabel}`,
    `Ventas: ${formatCop(input.salesTotalCents)} (${input.salesCount} facturas)`,
    `Unidades: ${input.unitsSold}`,
    topProduct ? `Top producto: ${topProduct.name} (${topProduct.quantity} ud)` : null,
    `Fondo: ${formatCop(input.openingFloatCents)}`,
    `Efectivo esperado: ${formatCop(input.expectedCashCents)}`,
    `Efectivo contado: ${formatCop(input.countedCashCents)}`,
    `Diferencia: ${diffLabel}`,
    `Abrió: ${input.openedByName ?? "—"}`,
    `Cerró: ${input.closedByName ?? "—"}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `Cierre de caja · ${dayLabel} · ${diffLabel}`,
    html,
    text,
  };
}

export async function sendCashCloseReportEmail(
  supabase: SupabaseClient,
  input: CashCloseReportInput,
): Promise<{ ok: boolean; error?: string }> {
  const extras = await gatherCashCloseReportExtras(supabase, input.businessDay);
  const { subject, html, text } = buildCashCloseReportHtml(input, extras);
  const result = await sendHtmlEmail({
    to: cashCloseReportToAddress(),
    subject,
    html,
    text,
  });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}

export async function resolveProfileName(
  supabase: SupabaseClient,
  userId: string | null | undefined,
): Promise<string | null> {
  if (!userId) return null;
  const { data } = await supabase
    .from("profiles")
    .select("display_name, login_username")
    .eq("id", userId)
    .maybeSingle();
  if (!data) return null;
  return (
    String(data.display_name ?? "").trim() ||
    String(data.login_username ?? "").trim() ||
    null
  );
}
