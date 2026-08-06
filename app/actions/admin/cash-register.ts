"use server";

import { logAdminActivity } from "@/lib/admin-activity-log";
import {
  claimAdminFormToken,
  readSubmissionToken,
} from "@/lib/admin-form-token";
import {
  expectedCashFromParts,
  fetchCashDayLiveTotals,
  fetchOpenCashSession,
  todayBusinessDayYmd,
} from "@/lib/cash-register";
import { formatCop } from "@/lib/money";
import { assertActionPermission } from "@/lib/require-admin-permission";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseNonNegCents(raw: FormDataEntryValue | null): number {
  const n = Math.floor(Number(raw ?? NaN));
  if (!Number.isFinite(n) || n < 0) return -1;
  return n;
}

function redirectCaja(error?: string): never {
  if (error) redirect(`/admin/caja?error=${encodeURIComponent(error)}`);
  redirect("/admin/caja");
}

export async function openCashRegisterSession(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  await assertActionPermission("caja_gestionar");

  const openingFloat = parseNonNegCents(formData.get("opening_float_cents"));
  if (openingFloat < 0) redirectCaja("float");

  const claim = await claimAdminFormToken(
    supabase,
    readSubmissionToken(formData),
    "cash_register_open",
  );
  if (claim === "duplicate") redirectCaja();
  if (claim === "error") redirectCaja("token");

  const existing = await fetchOpenCashSession(supabase);
  if (existing) redirectCaja("already_open");

  const businessDay = todayBusinessDayYmd();
  const { data: dayTaken } = await supabase
    .from("cash_register_sessions")
    .select("id,status")
    .eq("business_day", businessDay)
    .maybeSingle();
  if (dayTaken) {
    redirectCaja(dayTaken.status === "closed" ? "day_closed" : "already_open");
  }

  const { data: inserted, error } = await supabase
    .from("cash_register_sessions")
    .insert({
      business_day: businessDay,
      status: "open",
      opening_float_cents: openingFloat,
      opened_by: user.id,
    })
    .select("id")
    .single();

  if (error || !inserted?.id) {
    console.error("openCashRegisterSession", error);
    redirectCaja("db");
  }

  await logAdminActivity(supabase, {
    actorId: user.id,
    actionType: "cash_session_opened",
    entityType: "cash_session",
    entityId: String(inserted.id),
    summary: `Caja abierta · fondo ${formatCop(openingFloat)}`,
    metadata: {
      business_day: businessDay,
      opening_float_cents: openingFloat,
    },
  });

  revalidatePath("/admin/caja");
  revalidatePath("/admin/actividades");
  redirectCaja();
}

export async function closeCashRegisterSession(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  await assertActionPermission("caja_gestionar");

  const sessionId = String(formData.get("session_id") ?? "").trim();
  const countedCash = parseNonNegCents(formData.get("counted_cash_cents"));
  const notesRaw = String(formData.get("notes") ?? "").trim();
  const notes = notesRaw.length > 0 ? notesRaw.slice(0, 1000) : null;

  if (!sessionId) redirectCaja("session");
  if (countedCash < 0) redirectCaja("counted");

  const claim = await claimAdminFormToken(
    supabase,
    readSubmissionToken(formData),
    `cash_register_close:${sessionId}`,
  );
  if (claim === "duplicate") {
    revalidatePath("/admin/caja");
    redirect(`/admin/caja/${sessionId}`);
  }
  if (claim === "error") redirectCaja("token");

  const { data: session, error: fetchErr } = await supabase
    .from("cash_register_sessions")
    .select("id,status,business_day,opening_float_cents")
    .eq("id", sessionId)
    .maybeSingle();

  if (fetchErr || !session) redirectCaja("session");
  if (session.status !== "open") redirectCaja("not_open");

  const openingFloat = Math.max(
    0,
    Math.floor(Number(session.opening_float_cents ?? 0)),
  );
  const businessDay = String(session.business_day).slice(0, 10);
  const live = await fetchCashDayLiveTotals(supabase, businessDay, openingFloat);
  const expected = expectedCashFromParts(
    openingFloat,
    live.salesCashCents,
    live.expensesCashCents,
  );
  const difference = countedCash - expected;

  const { error: updErr } = await supabase
    .from("cash_register_sessions")
    .update({
      status: "closed",
      sales_count: live.salesCount,
      sales_total_cents: live.salesTotalCents,
      sales_cash_cents: live.salesCashCents,
      sales_transfer_cents: live.salesTransferCents,
      sales_mixed_cents: live.salesMixedCents,
      sales_other_cents: live.salesOtherCents,
      expenses_cash_cents: live.expensesCashCents,
      expenses_other_cents: live.expensesOtherCents,
      expected_cash_cents: expected,
      counted_cash_cents: countedCash,
      cash_difference_cents: difference,
      units_sold: live.unitsSold,
      stock_out_lines: live.stockOutLines,
      notes,
      closed_at: new Date().toISOString(),
      closed_by: user.id,
    })
    .eq("id", sessionId)
    .eq("status", "open");

  if (updErr) {
    console.error("closeCashRegisterSession", updErr);
    redirectCaja("db");
  }

  const diffLabel =
    difference === 0
      ? "cuadró"
      : difference > 0
        ? `sobrante ${formatCop(difference)}`
        : `faltante ${formatCop(Math.abs(difference))}`;

  await logAdminActivity(supabase, {
    actorId: user.id,
    actionType: "cash_session_closed",
    entityType: "cash_session",
    entityId: sessionId,
    summary: `Caja cerrada · ${diffLabel} · ${live.unitsSold} ud vendidas`,
    metadata: {
      business_day: businessDay,
      opening_float_cents: openingFloat,
      expected_cash_cents: expected,
      counted_cash_cents: countedCash,
      cash_difference_cents: difference,
      sales_total_cents: live.salesTotalCents,
      sales_cash_cents: live.salesCashCents,
      units_sold: live.unitsSold,
    },
  });

  revalidatePath("/admin/caja");
  revalidatePath(`/admin/caja/${sessionId}`);
  revalidatePath("/admin/actividades");
  redirect(`/admin/caja/${sessionId}`);
}
