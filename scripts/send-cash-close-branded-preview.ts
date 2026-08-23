/**
 * Vista previa del reporte de cierre (día abierto).
 * Uso: RESEND_API_KEY=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/send-cash-close-branded-preview.ts
 */
import { createClient } from "@supabase/supabase-js";
import {
  expectedCashFromParts,
  fetchCashDayLiveTotals,
} from "../lib/cash-register";
import {
  resolveProfileName,
  sendCashCloseReportEmail,
} from "../lib/cash-close-report";
import { cashCloseReportToAddresses } from "../lib/email/send";

async function main() {
  const DAY = process.env.BUSINESS_DAY || "2026-08-07";
  const URL =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://nhzearoerdnrlctpgiyq.supabase.co";
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.NEXT_PUBLIC_SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.aleyashop.net";

  if (!process.env.RESEND_API_KEY) {
    console.error("Falta RESEND_API_KEY");
    process.exit(1);
  }
  if (!SERVICE) {
    console.error("Falta SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const sb = createClient(URL, SERVICE);
  const { data: session, error } = await sb
    .from("cash_register_sessions")
    .select("id,business_day,status,opening_float_cents,opened_at,opened_by")
    .eq("business_day", DAY)
    .maybeSingle();

  if (error || !session) {
    console.error("Sin sesión de caja", error);
    process.exit(1);
  }

  const opening = Math.max(
    0,
    Math.floor(Number(session.opening_float_cents ?? 0)),
  );
  const live = await fetchCashDayLiveTotals(sb, DAY, opening);
  const expected = expectedCashFromParts(
    live.salesCashCents,
    live.expensesCashCents,
  );
  const openedByName = await resolveProfileName(sb, session.opened_by);

  console.log("Destinatarios:", cashCloseReportToAddresses());

  const result = await sendCashCloseReportEmail(sb, {
    sessionId: String(session.id),
    businessDay: DAY,
    openingFloatCents: opening,
    salesCount: live.salesCount,
    salesTotalCents: live.salesTotalCents,
    salesCashCents: live.salesCashCents,
    salesTransferCents: live.salesTransferCents,
    salesMixedCents: live.salesMixedCents,
    salesOtherCents: live.salesOtherCents,
    expensesCashCents: live.expensesCashCents,
    expensesOtherCents: live.expensesOtherCents,
    expectedCashCents: expected,
    countedCashCents: expected,
    cashDifferenceCents: 0,
    unitsSold: live.unitsSold,
    stockOutLines: live.stockOutLines,
    expenseLines: live.expenseLines,
    notes: "Vista previa — caja aún abierta.",
    openedByName,
    closedByName: "Simulación (aún no cerrado)",
    openedAt: session.opened_at ? String(session.opened_at) : null,
    closedAt: new Date().toISOString(),
    isPartialPreview: true,
  });

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
