"use server";

import { logAdminActivity } from "@/lib/admin-activity-log";
import {
  claimAdminFormToken,
  readSubmissionToken,
} from "@/lib/admin-form-token";
import {
  resolveProfileName,
  sendCashCloseReportEmail,
} from "@/lib/cash-close-report";
import {
  fetchActorOpenCashSession,
  fetchCashDayLiveTotals,
  fetchCashSessionById,
  fetchCashSessionForRegisterDay,
  todayBusinessDayYmd,
  toBlindCashSummary,
  type CashDayBlindSummary,
} from "@/lib/cash-register";
import {
  canViewAllCashRegisters,
  fetchAssignedCashRegister,
  fetchCashRegisterById,
  fetchCashRegisters,
} from "@/lib/cash-registers";
import { formatCop } from "@/lib/money";
import { assertActionPermission, requireAdminPermission } from "@/lib/require-admin-permission";
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
  const perm = await requireAdminPermission("caja_gestionar");
  const userId = perm.userId;
  const isManager = canViewAllCashRegisters(perm.jobRole);

  const openingFloat = parseNonNegCents(formData.get("opening_float_cents"));
  if (openingFloat < 0) redirectCaja("float");

  const requestedRegisterId = String(formData.get("cash_register_id") ?? "").trim();
  const registers = await fetchCashRegisters(supabase, { activeOnly: true });
  if (registers.length === 0) redirectCaja("no_register");

  const assigned = await fetchAssignedCashRegister(supabase, userId);
  let target = assigned ?? null;
  if (requestedRegisterId) {
    const requested =
      registers.find((row) => row.id === requestedRegisterId) ??
      (await fetchCashRegisterById(supabase, requestedRegisterId));
    if (!requested || !requested.is_active) redirectCaja("no_register");
    if (
      !isManager &&
      assigned &&
      assigned.id !== requested.id
    ) {
      redirectCaja("not_yours");
    }
    if (
      !isManager &&
      requested.assigned_user_id &&
      requested.assigned_user_id !== userId
    ) {
      redirectCaja("not_yours");
    }
    target = requested;
  } else if (!target) {
    const unassigned = registers.filter((row) => !row.assigned_user_id);
    if (unassigned.length === 1) target = unassigned[0]!;
    else if (isManager && registers.length === 1) target = registers[0]!;
    else redirectCaja(isManager ? "pick_register" : "no_register");
  }

  const businessDay = todayBusinessDayYmd();
  const dayTaken = await fetchCashSessionForRegisterDay(
    supabase,
    target.id,
    businessDay,
  );
  if (dayTaken) {
    redirectCaja(dayTaken.status === "closed" ? "day_closed" : "already_open");
  }

  const alreadyMine = await fetchActorOpenCashSession(supabase, userId);
  if (alreadyMine) redirectCaja("already_open");

  const claim = await claimAdminFormToken(
    supabase,
    readSubmissionToken(formData),
    `cash_register_open:${target.id}`,
  );
  if (claim === "duplicate") redirectCaja();
  if (claim === "error") redirectCaja("token");

  const { data: inserted, error } = await supabase
    .from("cash_register_sessions")
    .insert({
      cash_register_id: target.id,
      business_day: businessDay,
      status: "open",
      opening_float_cents: openingFloat,
      opened_by: userId,
    })
    .select("id")
    .single();

  if (error || !inserted?.id) {
    console.error("openCashRegisterSession", error);
    const code = String(error?.code ?? "");
    if (code === "23505") redirectCaja("already_open");
    redirectCaja("db");
  }

  await logAdminActivity(supabase, {
    actorId: userId,
    actionType: "cash_session_opened",
    entityType: "cash_session",
    entityId: String(inserted.id),
    summary: `${target.name} abierta · arrastre ${formatCop(openingFloat)}`,
    metadata: {
      business_day: businessDay,
      opening_float_cents: openingFloat,
      cash_register_id: target.id,
      cash_register_name: target.name,
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

  const session = await fetchCashSessionById(supabase, sessionId);
  if (!session) redirectCaja("session");
  if (session.status !== "open") redirectCaja("not_open");

  const openingFloat = Math.max(
    0,
    Math.floor(Number(session.opening_float_cents ?? 0)),
  );
  const businessDay = String(session.business_day).slice(0, 10);
  const live = await fetchCashDayLiveTotals(
    supabase,
    businessDay,
    openingFloat,
    { sessionId },
  );
  const expected = live.expectedCashCents;
  // Esperado = arrastre (día anterior) + cobros − egresos. Contar toda la plata de negocio en gaveta (sin los 100k de cambio).
  const difference = countedCash - expected;

  // Validar antes del token: si falla, pueden reintentar con el mismo formulario.
  if (!notes) {
    redirectCaja("notes_required");
  }

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
      expense_lines: live.expenseLines,
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
    summary: `Caja cerrada · ${diffLabel} · ${live.unitsSold} ud · ${live.expenseLines.length} egresos`,
    metadata: {
      business_day: businessDay,
      cash_register_id: session.cash_register_id ?? null,
      opening_float_cents: openingFloat,
      expected_cash_cents: expected,
      counted_cash_cents: countedCash,
      cash_difference_cents: difference,
      sales_total_cents: live.salesTotalCents,
      sales_cash_cents: live.salesCashCents,
      expenses_cash_cents: live.expensesCashCents,
      expenses_other_cents: live.expensesOtherCents,
      units_sold: live.unitsSold,
      expense_count: live.expenseLines.length,
      notes: notes ?? null,
    },
  });

  // Reporte del día por correo (no bloquea el cierre si falla).
  let reportQuery = "";
  try {
    const [openedByName, closedByName] = await Promise.all([
      resolveProfileName(supabase, session.opened_by ?? null),
      resolveProfileName(supabase, user.id),
    ]);
    const emailResult = await sendCashCloseReportEmail(supabase, {
      sessionId,
      businessDay,
      openingFloatCents: openingFloat,
      salesCount: live.salesCount,
      salesTotalCents: live.salesTotalCents,
      salesCashCents: live.salesCashCents,
      salesTransferCents: live.salesTransferCents,
      salesMixedCents: live.salesMixedCents,
      salesOtherCents: live.salesOtherCents,
      expensesCashCents: live.expensesCashCents,
      expensesOtherCents: live.expensesOtherCents,
      expectedCashCents: expected,
      countedCashCents: countedCash,
      cashDifferenceCents: difference,
      unitsSold: live.unitsSold,
      stockOutLines: live.stockOutLines,
      expenseLines: live.expenseLines,
      notes,
      openedByName,
      closedByName,
      openedAt: session.opened_at ? String(session.opened_at) : null,
      closedAt: new Date().toISOString(),
    });
    if (!emailResult.ok) {
      console.error("[caja] reporte email:", emailResult.error);
      reportQuery = "?report=error";
    } else {
      reportQuery = "?report=sent";
    }
  } catch (e) {
    console.error("[caja] reporte email exception:", e);
    reportQuery = "?report=error";
  }

  revalidatePath("/admin/caja");
  revalidatePath(`/admin/caja/${sessionId}`);
  revalidatePath("/admin/actividades");
  redirect(`/admin/caja/${sessionId}${reportQuery}`);
}

export async function resendCashCloseReport(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  await assertActionPermission("caja_gestionar");

  const sessionId = String(formData.get("session_id") ?? "").trim();
  if (!sessionId) redirect("/admin/caja");

  const closed = await fetchCashSessionById(supabase, sessionId);
  if (!closed || closed.status !== "closed") {
    redirect(`/admin/caja/${sessionId}?report=missing`);
  }

  const [openedByName, closedByName] = await Promise.all([
    resolveProfileName(supabase, closed.opened_by),
    resolveProfileName(supabase, closed.closed_by),
  ]);

  const emailResult = await sendCashCloseReportEmail(supabase, {
    sessionId,
    businessDay: closed.business_day,
    openingFloatCents: closed.opening_float_cents,
    salesCount: closed.sales_count ?? 0,
    salesTotalCents: closed.sales_total_cents ?? 0,
    salesCashCents: closed.sales_cash_cents ?? 0,
    salesTransferCents: closed.sales_transfer_cents ?? 0,
    salesMixedCents: closed.sales_mixed_cents ?? 0,
    salesOtherCents: closed.sales_other_cents ?? 0,
    expensesCashCents: closed.expenses_cash_cents ?? 0,
    expensesOtherCents: closed.expenses_other_cents ?? 0,
    expectedCashCents: closed.expected_cash_cents ?? 0,
    countedCashCents: closed.counted_cash_cents ?? 0,
    cashDifferenceCents: closed.cash_difference_cents ?? 0,
    unitsSold: closed.units_sold ?? 0,
    stockOutLines: closed.stock_out_lines,
    expenseLines: closed.expense_lines,
    notes: closed.notes,
    openedByName,
    closedByName,
    openedAt: closed.opened_at,
    closedAt: closed.closed_at,
  });

  revalidatePath(`/admin/caja/${sessionId}`);
  redirect(
    emailResult.ok
      ? `/admin/caja/${sessionId}?report=sent`
      : `/admin/caja/${sessionId}?report=error`,
  );
}

/** Totales vivos para el modal de cierre (evita datos stale tras registrar egresos). */
export async function loadCashCloseBlindSummary(
  sessionId: string,
): Promise<CashDayBlindSummary | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const id = String(sessionId ?? "").trim();
  if (!id) return null;

  const session = await fetchCashSessionById(supabase, id);
  if (!session || session.status !== "open") return null;

  const openingFloat = Math.max(
    0,
    Math.floor(Number(session.opening_float_cents ?? 0)),
  );
  const live = await fetchCashDayLiveTotals(
    supabase,
    session.business_day,
    openingFloat,
    { sessionId },
  );
  return toBlindCashSummary(live, openingFloat);
}

export async function createCashRegisterAction(formData: FormData) {
  const perm = await requireAdminPermission("caja_gestionar");
  if (!canViewAllCashRegisters(perm.jobRole)) redirectCaja("forbidden");
  const supabase = await createSupabaseServerClient();

  const name = String(formData.get("name") ?? "").trim().slice(0, 40);
  const assignedRaw = String(formData.get("assigned_user_id") ?? "").trim();
  const assignedUserId = assignedRaw.length > 0 ? assignedRaw : null;
  if (name.length < 2) redirectCaja("register_name");

  const existing = await fetchCashRegisters(supabase, { activeOnly: true });
  const sortOrder =
    existing.reduce((max, row) => Math.max(max, row.sort_order), 0) + 1;

  const { error } = await supabase.from("cash_registers").insert({
    name,
    assigned_user_id: assignedUserId,
    sort_order: sortOrder,
    is_active: true,
  });
  if (error) {
    console.error("createCashRegisterAction", error);
    if (String(error.code ?? "") === "23505") redirectCaja("register_taken");
    redirectCaja("db");
  }

  revalidatePath("/admin/caja");
  redirectCaja();
}

export async function updateCashRegisterAction(formData: FormData) {
  const perm = await requireAdminPermission("caja_gestionar");
  if (!canViewAllCashRegisters(perm.jobRole)) redirectCaja("forbidden");
  const supabase = await createSupabaseServerClient();

  const id = String(formData.get("cash_register_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim().slice(0, 40);
  const assignedRaw = String(formData.get("assigned_user_id") ?? "").trim();
  const assignedUserId = assignedRaw.length > 0 ? assignedRaw : null;
  if (!id) redirectCaja("no_register");
  if (name.length < 2) redirectCaja("register_name");

  const { error } = await supabase
    .from("cash_registers")
    .update({
      name,
      assigned_user_id: assignedUserId,
    })
    .eq("id", id);
  if (error) {
    console.error("updateCashRegisterAction", error);
    if (String(error.code ?? "") === "23505") redirectCaja("register_taken");
    redirectCaja("db");
  }

  revalidatePath("/admin/caja");
  redirectCaja();
}
