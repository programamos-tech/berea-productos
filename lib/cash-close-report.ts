import {
  createdAtBoundsForReportYmdRange,
  prettyReportDayShortLabel,
  REPORT_STORE_TIME_ZONE,
} from "@/lib/admin-report-range";
import { storeBrand } from "@/lib/brand";
import type { CashExpenseLine, CashStockOutLine } from "@/lib/cash-register";
import {
  cashCloseReportToAddresses,
  sendHtmlEmail,
  type EmailInlineAttachment,
} from "@/lib/email/send";
import { formatCop } from "@/lib/money";
import { getPublicSiteUrl } from "@/lib/public-site-url";
import { STORE_BRAND } from "@/lib/store-theme";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

export type CashCloseReportInput = {
  sessionId: string;
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
  /** Vista previa con día aún abierto (simula cierre con totales actuales). */
  isPartialPreview?: boolean;
};

type HourBucket = { hour: number; label: string; cents: number; count: number };
type StaffRow = { name: string; sales: number; actions: number };

/** Neutros del admin; rosa solo como acento (CTA / barras). */
const BRAND = STORE_BRAND;
const BG = "#f4f4f5";
const CARD_BORDER = "#e4e4e7";
const INK = "#18181b";
const MUTED = "#71717a";
const SOFT = "#fafafa";
const RULE = "#f4f4f5";
const BAR_TRACK = "#f4f4f5";
const BAR_FILL = "#a1a1aa";
const BAR_ACCENT = BRAND;

const LOGO_CID = "logo-milagros";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatBogota(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CO", {
    timeZone: REPORT_STORE_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  });
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

/** Base URL del admin (el dominio real del deploy, no un host fantasma). */
function cashCloseAdminBaseUrl(): string {
  const raw = getPublicSiteUrl().replace(/\/$/, "");
  try {
    const host = new URL(raw).hostname.toLowerCase();
    if (host.includes("milagrosguacari.com") || host === "localhost") {
      return "https://www.aleyashop.net";
    }
  } catch {
    return "https://www.aleyashop.net";
  }
  return raw || "https://www.aleyashop.net";
}

function loadMilagrosEmailLogo(): EmailInlineAttachment | null {
  const candidates = [
    join(process.cwd(), "lib/email/assets/logo-milagros.jpg"),
    join(process.cwd(), "public/email/logo-milagros.jpg"),
  ];
  for (const path of candidates) {
    try {
      const content = readFileSync(path);
      if (content.length > 0) {
        return {
          filename: "logo-milagros.jpg",
          content,
          contentId: LOGO_CID,
          contentType: "image/jpeg",
        };
      }
    } catch {
      /* try next */
    }
  }
  console.error("[caja] no se pudo cargar logo de email");
  return null;
}

function barRow(
  label: string,
  value: number,
  max: number,
  color: string,
  valueLabel?: string,
): string {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return `
    <tr>
      <td style="padding:6px 8px 6px 0;font-size:13px;color:#3f3f46;width:42%;vertical-align:middle;">${esc(label)}</td>
      <td style="padding:6px 0;width:58%;vertical-align:middle;">
        <div style="background:${BAR_TRACK};border-radius:999px;height:10px;overflow:hidden;">
          <div style="width:${pct}%;height:10px;background:${color};border-radius:999px;"></div>
        </div>
        <div style="font-size:11px;color:${MUTED};margin-top:3px;">${esc(valueLabel ?? formatCop(value))}</div>
      </td>
    </tr>`;
}

function metricCard(label: string, value: string, sub?: string): string {
  return `
    <td style="width:33%;padding:6px;">
      <div style="border:1px solid ${CARD_BORDER};border-radius:12px;padding:12px;background:${SOFT};">
        <div style="font-size:10px;color:${MUTED};text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">${esc(label)}</div>
        <div style="font-size:17px;font-weight:700;color:${INK};margin-top:5px;">${esc(value)}</div>
        ${sub ? `<div style="font-size:11px;color:${MUTED};margin-top:3px;">${esc(sub)}</div>` : ""}
      </div>
    </td>`;
}

function dayColumn(args: {
  title: string;
  badge: string;
  rows: Array<{ label: string; value: string; strong?: boolean }>;
  footer: string;
}): string {
  const rows = args.rows
    .map(
      (r) => `
      <tr>
        <td style="padding:7px 0;font-size:12px;color:${MUTED};">${esc(r.label)}</td>
        <td style="padding:7px 0;font-size:13px;text-align:right;color:${INK};${r.strong ? "font-weight:700;" : "font-weight:600;"}">${esc(r.value)}</td>
      </tr>`,
    )
    .join("");
  return `
    <td style="width:50%;padding:6px;vertical-align:top;">
      <div style="border:1px solid ${CARD_BORDER};border-radius:12px;padding:14px 14px 12px;background:#fff;height:100%;">
        <div style="display:inline-block;background:${SOFT};color:#52525b;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:4px 9px;border-radius:999px;margin-bottom:8px;border:1px solid ${CARD_BORDER};">${esc(args.badge)}</div>
        <div style="font-size:15px;font-weight:700;color:${INK};margin-bottom:8px;">${esc(args.title)}</div>
        <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid ${RULE};font-size:11px;color:${MUTED};line-height:1.45;">${esc(args.footer)}</div>
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
  const partial = Boolean(input.isPartialPreview);
  const diff = input.cashDifferenceCents;
  const diffLabel =
    diff === 0
      ? "Cuadró"
      : diff > 0
        ? `Sobrante ${formatCop(diff)}`
        : `Faltante ${formatCop(Math.abs(diff))}`;
  const diffColor =
    diff === 0 ? "#047857" : diff > 0 ? "#b45309" : "#b91c1c";

  const site = cashCloseAdminBaseUrl();
  const sessionUrl = `${site}/admin/caja/${encodeURIComponent(input.sessionId)}`;
  const brandName = storeBrand;

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
      const pct =
        topMax > 0 ? Math.max(4, Math.round((p.quantity / topMax) * 100)) : 0;
      return `
        <tr>
          <td style="padding:7px 8px 7px 0;font-size:13px;color:${INK};">
            ${esc(p.name)}
            <div style="font-size:11px;color:${MUTED};">Ref ${esc(p.reference ?? "—")}</div>
          </td>
          <td style="padding:7px 0;width:45%;">
            <div style="background:${BAR_TRACK};border-radius:999px;height:10px;overflow:hidden;">
              <div style="width:${pct}%;height:10px;background:${BAR_ACCENT};border-radius:999px;"></div>
            </div>
          </td>
          <td style="padding:7px 0 7px 10px;font-size:13px;font-weight:700;text-align:right;color:${INK};white-space:nowrap;">${p.quantity} ud</td>
        </tr>`;
    })
    .join("");

  const hourBars = extras.hourly
    .filter((h) => h.count > 0)
    .map((h) =>
      barRow(`${h.label} · ${h.count} fact.`, h.cents, hourMax, BAR_FILL),
    )
    .join("");

  const payBars = [
    barRow("Efectivo", input.salesCashCents, payMax, BAR_ACCENT),
    barRow("Transferencia", input.salesTransferCents, payMax, "#71717a"),
    barRow(
      "Mixtas / otras",
      input.salesMixedCents + input.salesOtherCents,
      payMax,
      "#a1a1aa",
    ),
  ].join("");

  const expenseRows =
    input.expenseLines.length === 0
      ? `<tr><td colspan="3" style="padding:8px 0;color:${MUTED};font-size:13px;">Sin egresos este día.</td></tr>`
      : input.expenseLines
          .map((e) => {
            const pct = Math.max(
              4,
              Math.round((e.amount_cents / expMax) * 100),
            );
            return `
            <tr>
              <td style="padding:7px 8px 7px 0;font-size:13px;color:${INK};">${esc(e.concept)}
                <div style="font-size:11px;color:${MUTED};">${esc(e.payment_method)}</div>
              </td>
              <td style="padding:7px 0;width:40%;">
                <div style="background:${BAR_TRACK};border-radius:999px;height:10px;overflow:hidden;">
                  <div style="width:${pct}%;height:10px;background:${BAR_FILL};border-radius:999px;"></div>
                </div>
              </td>
              <td style="padding:7px 0 7px 10px;font-size:13px;font-weight:600;text-align:right;color:${INK};white-space:nowrap;">${esc(formatCop(e.amount_cents))}</td>
            </tr>`;
          })
          .join("");

  const staffRows =
    extras.staff.length === 0
      ? `<tr><td style="padding:8px 0;color:${MUTED};font-size:13px;">Sin actividad registrada de colaboradores.</td></tr>`
      : extras.staff
          .map(
            (s) => `
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid ${RULE};font-size:13px;font-weight:600;color:${INK};">${esc(s.name)}</td>
            <td style="padding:8px 0;border-bottom:1px solid ${RULE};font-size:13px;text-align:right;color:${INK};">${s.sales} ventas</td>
            <td style="padding:8px 0;border-bottom:1px solid ${RULE};font-size:13px;text-align:right;color:${MUTED};">${s.actions} acciones</td>
          </tr>`,
          )
          .join("");

  const statusPill = partial
    ? "Vista previa · día en curso"
    : diffLabel;

  const openCol = dayColumn({
    title: "Inicio del día",
    badge: "Apertura",
    rows: [
      { label: "Fondo en caja", value: formatCop(input.openingFloatCents), strong: true },
      { label: "Abrió", value: input.openedByName ?? "—" },
      { label: "Hora", value: formatBogota(input.openedAt) },
    ],
    footer: "Base con la que empezó la jornada en el local.",
  });

  const closeCol = dayColumn({
    title: partial ? "Cierre (simulado ahora)" : "Cierre del día",
    badge: partial ? "Parcial" : "Cierre",
    rows: [
      {
        label: "Neto del turno (efectivo)",
        value: formatCop(input.expectedCashCents),
        strong: true,
      },
      {
        label: partial ? "Efectivo contado (sim.)" : "Efectivo contado",
        value: formatCop(input.countedCashCents),
      },
      { label: "Diferencia", value: diffLabel },
      { label: partial ? "Cerraría" : "Cerró", value: input.closedByName ?? "—" },
      { label: "Hora", value: formatBogota(input.closedAt) },
    ],
    footer: partial
      ? "Simulación con lo vendido hasta ahora. Al cerrar caja se congela el real."
      : input.notes
        ? `Nota: ${input.notes}`
        : "Totales congelados al confirmar el cierre.",
  });

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>Cierre de caja · ${esc(dayLabel)}</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK};">
  <div style="max-width:680px;margin:0 auto;padding:28px 14px;">
    <div style="background:#ffffff;border:1px solid ${CARD_BORDER};border-radius:16px;overflow:hidden;">
      <div style="padding:22px 22px 16px;text-align:center;border-bottom:1px solid ${CARD_BORDER};">
        <img src="cid:${LOGO_CID}" alt="${esc(brandName)}" width="120" height="120" style="display:block;margin:0 auto 12px;width:120px;height:120px;object-fit:contain;border:0;outline:none;" />
        <div style="font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${MUTED};">Cierre de caja</div>
        <div style="font-size:22px;font-weight:700;color:${INK};margin-top:4px;">${esc(brandName)}</div>
        <div style="font-size:14px;color:${MUTED};margin-top:2px;">${esc(dayLabel)}</div>
        <div style="margin-top:12px;display:inline-block;background:${SOFT};color:#3f3f46;border:1px solid ${CARD_BORDER};border-radius:999px;padding:6px 12px;font-size:12px;font-weight:600;">
          ${esc(statusPill)}
        </div>
      </div>

      <div style="padding:18px 16px 8px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
          ${metricCard("Ventas del día", formatCop(input.salesTotalCents), `${input.salesCount} facturas`)}
          ${metricCard("Unidades", String(input.unitsSold), topProduct ? `Top: ${topProduct.name}` : undefined)}
          ${metricCard(
            partial ? "Efectivo ahora" : "Efectivo contado",
            formatCop(partial ? input.expectedCashCents : input.countedCashCents),
            `Neto turno ${formatCop(input.expectedCashCents)}`,
          )}
        </tr></table>
      </div>

      <div style="padding:4px 10px 8px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
          ${openCol}
          ${closeCol}
        </tr></table>
      </div>

      <div style="padding:8px 16px 6px;">
        <div style="border:1px solid ${CARD_BORDER};border-radius:12px;padding:14px 16px;background:#fff;">
          <div style="font-size:12px;font-weight:600;color:${MUTED};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">Movimiento de efectivo</div>
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#3f3f46;">
            <tr><td style="padding:4px 0;">Fondo inicial (base, no es venta)</td><td style="text-align:right;font-weight:600;color:${INK};">${esc(formatCop(input.openingFloatCents))}</td></tr>
            <tr><td style="padding:4px 0;">+ Ventas en efectivo</td><td style="text-align:right;font-weight:600;color:${INK};">${esc(formatCop(input.salesCashCents))}</td></tr>
            <tr><td style="padding:4px 0;">+ Ventas transferencia</td><td style="text-align:right;font-weight:600;color:${INK};">${esc(formatCop(input.salesTransferCents))}</td></tr>
            <tr><td style="padding:4px 0;">− Egresos efectivo</td><td style="text-align:right;font-weight:600;color:${INK};">${esc(formatCop(input.expensesCashCents))}</td></tr>
            <tr><td style="padding:4px 0;">− Egresos otros</td><td style="text-align:right;font-weight:600;color:${INK};">${esc(formatCop(input.expensesOtherCents))}</td></tr>
            <tr><td style="padding:10px 0 4px;border-top:1px solid ${RULE};font-weight:700;color:${INK};">Neto del turno en efectivo</td><td style="padding:10px 0 4px;border-top:1px solid ${RULE};text-align:right;font-weight:700;color:${INK};">${esc(formatCop(input.expectedCashCents))}</td></tr>
            <tr><td style="padding:4px 0;">Efectivo contado (gaveta)</td><td style="text-align:right;font-weight:600;color:${INK};">${esc(formatCop(input.countedCashCents))}</td></tr>
            <tr><td style="padding:4px 0;">Diferencia</td><td style="text-align:right;font-weight:700;color:${diffColor};">${esc(diffLabel)}</td></tr>
          </table>
        </div>
      </div>

      <div style="padding:10px 16px;text-align:center;">
        <a href="${esc(sessionUrl)}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 20px;border-radius:10px;">
          Ver cierre de caja del día
        </a>
        <div style="margin-top:8px;font-size:11px;color:${MUTED};word-break:break-all;">
          <a href="${esc(sessionUrl)}" style="color:${MUTED};">${esc(sessionUrl)}</a>
        </div>
      </div>

      <div style="padding:8px 16px;">
        <div style="border:1px solid ${CARD_BORDER};border-radius:12px;padding:14px 16px;background:#fff;">
          <div style="font-size:14px;font-weight:700;color:${INK};margin-bottom:4px;">Producto más vendido</div>
          <div style="font-size:13px;color:${MUTED};margin-bottom:10px;">
            ${
              topProduct
                ? `<strong style="color:${INK};">${esc(topProduct.name)}</strong> · ${topProduct.quantity} unidades`
                : "Sin unidades vendidas."
            }
          </div>
          <table width="100%" cellpadding="0" cellspacing="0">${topBars}</table>
        </div>
      </div>

      <div style="padding:8px 16px;">
        <div style="border:1px solid ${CARD_BORDER};border-radius:12px;padding:14px 16px;background:#fff;">
          <div style="font-size:14px;font-weight:700;color:${INK};margin-bottom:10px;">Ventas por forma de pago</div>
          <table width="100%" cellpadding="0" cellspacing="0">${payBars}</table>
        </div>
      </div>

      <div style="padding:8px 16px;">
        <div style="border:1px solid ${CARD_BORDER};border-radius:12px;padding:14px 16px;background:#fff;">
          <div style="font-size:14px;font-weight:700;color:${INK};margin-bottom:10px;">Actividad por hora (Bogotá)</div>
          <table width="100%" cellpadding="0" cellspacing="0">${hourBars || `<tr><td style="color:${MUTED};font-size:13px;">Sin ventas horarias.</td></tr>`}</table>
        </div>
      </div>

      <div style="padding:8px 16px;">
        <div style="border:1px solid ${CARD_BORDER};border-radius:12px;padding:14px 16px;background:#fff;">
          <div style="font-size:14px;font-weight:700;color:${INK};margin-bottom:10px;">Quién operó hoy</div>
          <table width="100%" cellpadding="0" cellspacing="0">${staffRows}</table>
        </div>
      </div>

      <div style="padding:8px 16px 22px;">
        <div style="border:1px solid ${CARD_BORDER};border-radius:12px;padding:14px 16px;background:#fff;">
          <div style="font-size:14px;font-weight:700;color:${INK};margin-bottom:10px;">Egresos del día · ${esc(formatCop(input.expensesCashCents + input.expensesOtherCents))}</div>
          <table width="100%" cellpadding="0" cellspacing="0">${expenseRows}</table>
        </div>
      </div>

      <div style="background:${SOFT};border-top:1px solid ${CARD_BORDER};padding:14px 18px;text-align:center;">
        <div style="font-size:11px;color:${MUTED};">
          Reporte automático · ${esc(brandName)}
          ${partial ? " · vista previa (caja aún abierta)" : ""}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

  const subjectPrefix = partial ? "[Vista previa] " : "";
  const text = [
    `${subjectPrefix}Cierre de caja · ${dayLabel}`,
    `Ver en admin: ${sessionUrl}`,
    `Inicio — fondo ${formatCop(input.openingFloatCents)} · ${input.openedByName ?? "—"} · ${formatBogota(input.openedAt)}`,
    `Cierre — esperado ${formatCop(input.expectedCashCents)} · contado ${formatCop(input.countedCashCents)} · ${diffLabel}`,
    `Ventas: ${formatCop(input.salesTotalCents)} (${input.salesCount} facturas)`,
    `Unidades: ${input.unitsSold}`,
    topProduct ? `Top producto: ${topProduct.name} (${topProduct.quantity} ud)` : null,
    `Abrió: ${input.openedByName ?? "—"}`,
    `Cerró: ${input.closedByName ?? "—"}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `${subjectPrefix}Cierre de caja · ${dayLabel} · ${diffLabel}`,
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
  const logo = loadMilagrosEmailLogo();
  const recipients = cashCloseReportToAddresses();
  const errors: string[] = [];
  let sent = 0;

  // Un envío por destinatario: con Resend en modo test, fallar uno no bloquea al dueño de la cuenta.
  for (const to of recipients) {
    const result = await sendHtmlEmail({
      to,
      subject,
      html,
      text,
      attachments: logo ? [logo] : undefined,
    });
    if (result.ok) {
      sent += 1;
    } else {
      errors.push(`${to}: ${result.error}`);
      console.error("[caja] reporte email falló para", to, result.error);
    }
  }

  if (sent === 0) {
    return { ok: false, error: errors.join(" · ") || "No se pudo enviar" };
  }
  if (errors.length > 0) {
    console.error("[caja] reporte parcial:", errors.join(" · "));
  }
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
