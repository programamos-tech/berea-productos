import Link from "next/link";
import { Eye } from "lucide-react";
import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { CashRegisterFiltersBar } from "@/components/admin/CashRegisterFiltersBar";
import { CashRegisterPageChrome } from "@/components/admin/CashRegisterPageChrome";
import { StaticCopCents, StaticInteger } from "@/components/admin/ReportsAnimatedFigures";
import {
  prettyReportDayShortLabel,
  todayYmdInReportStore,
} from "@/lib/admin-report-range";
import {
  closedSessionToBlindSummary,
  fetchCashDayLiveTotals,
  fetchCashSessionForBusinessDay,
  fetchCashSessionsPage,
  fetchOpenCashSession,
  fetchSuggestedOpeningFloatCents,
  toBlindCashSummary,
  type CashSessionStatus,
} from "@/lib/cash-register";
import { formatCop } from "@/lib/money";
import { requireAdminAnyPermission } from "@/lib/require-admin-permission";
import { formatStoreDateTime } from "@/lib/store-datetime-format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

function errorMessage(code: string | undefined): string | null {
  switch (code) {
    case "float":
      return "El efectivo del día anterior no es válido.";
    case "counted":
      return "El efectivo contado no es válido.";
    case "already_open":
      return "Ya hay una caja abierta.";
    case "day_closed":
      return "Este día ya tiene un cierre. La próxima caja se puede abrir mañana a partir de las 12:00 a. m. (hora Colombia).";
    case "not_open":
      return "La sesión ya no está abierta.";
    case "session":
      return "No se encontró la sesión de caja.";
    case "token":
      return "No se pudo validar el envío. Recargá e intentá de nuevo.";
    case "db":
      return "No se pudo guardar el cierre. Intentá de nuevo.";
    case "notes_required":
      return "La nota del cierre es obligatoria. Escribí un resumen o comentario e intentá de nuevo.";
    case "need_open":
      return "Primero abrí la caja del día para poder facturar y usar el panel.";
    default:
      return null;
  }
}

function noteSummary(notes: string | null | undefined, max = 72): string | null {
  const t = String(notes ?? "").replace(/\s+/g, " ").trim();
  if (!t) return null;
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function parseStatusFilter(
  raw: string | string[] | undefined,
): "all" | CashSessionStatus {
  const v = typeof raw === "string" ? raw : "";
  if (v === "open" || v === "closed") return v;
  return "all";
}

function parseDayParam(raw: string | string[] | undefined): string {
  const v = typeof raw === "string" ? raw.trim() : "";
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "";
}

export default async function AdminCajaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  noStore();
  const perm = await requireAdminAnyPermission(["caja_ver", "caja_gestionar"]);
  const canManage = Boolean(perm.permissions.caja_gestionar);
  const sp = await searchParams;
  const errRaw = typeof sp.error === "string" ? sp.error : undefined;
  const banner = errorMessage(errRaw);
  const pageRaw = typeof sp.page === "string" ? Number(sp.page) : 1;
  const requestedPage =
    Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;

  const filterQ = typeof sp.q === "string" ? sp.q.trim() : "";
  const filterStatus = parseStatusFilter(sp.status);
  const filterFrom = parseDayParam(sp.from);
  const filterTo = parseDayParam(sp.to);
  const hasListFilters = Boolean(
    filterQ || filterStatus !== "all" || filterFrom || filterTo,
  );

  const listOpts = {
    pageSize: PAGE_SIZE,
    q: filterQ || undefined,
    status: filterStatus,
    from: filterFrom || undefined,
    to: filterTo || undefined,
  };

  const supabase = await createSupabaseServerClient();
  const today = todayYmdInReportStore();
  const [open, todaySession, firstPage, suggestedOpeningFloatCents] =
    await Promise.all([
      fetchOpenCashSession(supabase),
      fetchCashSessionForBusinessDay(supabase, today),
      fetchCashSessionsPage(supabase, { ...listOpts, page: requestedPage }),
      fetchSuggestedOpeningFloatCents(supabase),
    ]);

  const sessionsTotal = firstPage.total;
  const totalPages = Math.max(1, Math.ceil(sessionsTotal / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const sessionsPage =
    page === requestedPage
      ? firstPage
      : await fetchCashSessionsPage(supabase, { ...listOpts, page });
  const { rows: recent } = sessionsPage;

  const closedByIds = [
    ...new Set(
      recent
        .map((s) => s.closed_by)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const profileIds = [
    ...new Set([
      ...(open?.opened_by ? [open.opened_by] : []),
      ...closedByIds,
    ]),
  ];
  const { data: profileRows } =
    profileIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id,display_name,login_username")
          .in("id", profileIds)
      : {
          data: [] as {
            id: string;
            display_name: string | null;
            login_username: string | null;
          }[],
        };

  const profileLabel = new Map<string, string>();
  for (const p of profileRows ?? []) {
    const display = String(p.display_name ?? "").trim();
    const login = String(p.login_username ?? "").trim();
    const label = display || login;
    if (label) profileLabel.set(String(p.id), label);
  }

  const live = open
    ? await fetchCashDayLiveTotals(
        supabase,
        open.business_day,
        open.opening_float_cents,
      )
    : null;
  const blind = live
    ? toBlindCashSummary(live, open!.opening_float_cents)
    : null;

  const openedByLabel = open?.opened_by
    ? (profileLabel.get(open.opened_by) ?? null)
    : null;

  const openedAtLabel = open?.opened_at
    ? formatStoreDateTime(open.opened_at, {
        dateStyle: "short",
        timeStyle: "short",
      })
    : null;

  const dayLabel = prettyReportDayShortLabel(open?.business_day ?? today);
  const todayLabel = prettyReportDayShortLabel(today);
  const todayAlreadyClosed = !open && todaySession?.status === "closed";
  const canOpenToday = canManage && !open && !todayAlreadyClosed;
  const previewClose =
    typeof sp.preview === "string" &&
    sp.preview === "cierre" &&
    todayAlreadyClosed &&
    Boolean(todaySession);

  const previewBlind =
    previewClose && todaySession
      ? closedSessionToBlindSummary(todaySession)
      : null;

  const modalMode =
    previewClose
      ? ("close" as const)
      : open && canManage && blind
        ? ("close" as const)
        : canOpenToday
          ? ("open" as const)
          : null;

  function buildPageHref(p: number): string {
    const params = new URLSearchParams();
    if (filterQ) params.set("q", filterQ);
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo) params.set("to", filterTo);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/caja?${qs}` : "/admin/caja";
  }

  return (
    <div className="flex min-h-0 w-full max-w-none flex-col gap-4">
      <CashRegisterPageChrome
        canManage={canManage}
        todayAlreadyClosed={todayAlreadyClosed}
        hasOpenSession={Boolean(open)}
        todaySessionId={todaySession?.id ?? null}
        todayLabel={todayLabel}
        modalMode={modalMode}
        businessDayLabel={dayLabel}
        sessionId={previewClose ? todaySession?.id : open?.id}
        openedAtLabel={openedAtLabel}
        openedByLabel={openedByLabel}
        blind={previewBlind ?? blind}
        errorBanner={banner}
        suggestedOpeningFloatCents={suggestedOpeningFloatCents}
        autoOpenModal={Boolean(modalMode)}
        previewClose={Boolean(previewClose)}
      />

      {!open && !canManage && !todayAlreadyClosed ? (
        <p className="text-sm text-zinc-500">
          No hay caja abierta. Pedile a alguien con permiso de gestionar caja que
          la abra.
        </p>
      ) : null}

      {open && !canManage && blind ? (
        <p className="text-sm text-zinc-500">
          Caja abierta · {dayLabel} · {blind.salesCount} facturas ·{" "}
          {blind.unitsSold} ud · {blind.expenseLines.length} egresos. El
          resumen completo queda al cerrar.
        </p>
      ) : null}

      <section className="min-h-0 flex-1 border-t border-zinc-200/70 pt-4 dark:border-zinc-800">
        <div className="mb-3">
          <Suspense
            fallback={
              <div className="h-8 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900" />
            }
          >
            <CashRegisterFiltersBar
              initialQ={filterQ}
              initialStatus={filterStatus}
              initialFrom={filterFrom}
              initialTo={filterTo}
            />
          </Suspense>
        </div>

        {recent.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {hasListFilters
              ? "No hay cierres con esos filtros."
              : "Todavía no hay cierres."}
          </p>
        ) : (
          <>
            <div className="min-w-0 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200/70 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:border-zinc-800">
                    <th className="px-3 pb-2 font-semibold first:pl-0">Día</th>
                    <th className="px-3 pb-2 font-semibold">Estado</th>
                    <th className="px-3 pb-2 font-semibold">Cerró</th>
                    <th className="px-3 pb-2 text-right font-semibold">Transfer.</th>
                    <th className="px-3 pb-2 text-right font-semibold">Esperado</th>
                    <th className="px-3 pb-2 text-right font-semibold">Contado</th>
                    <th className="px-3 pb-2 text-right font-semibold">Dif.</th>
                    <th className="px-3 pb-2 text-right font-semibold">Ud</th>
                    <th className="px-3 pb-2 font-semibold">Nota</th>
                    <th className="px-3 pb-2 font-semibold last:pr-0" />
                  </tr>
                </thead>
                <tbody>
                  {recent.map((s) => {
                    const diff = s.cash_difference_cents;
                    const note = noteSummary(s.notes);
                    const closedBy =
                      s.closed_by != null
                        ? (profileLabel.get(s.closed_by) ?? null)
                        : null;
                    return (
                      <tr
                        key={s.id}
                        className="border-b border-zinc-100/80 last:border-0 dark:border-zinc-800/80"
                      >
                        <td className="whitespace-nowrap px-3 py-2.5 text-zinc-900 first:pl-0 dark:text-zinc-100">
                          {prettyReportDayShortLabel(s.business_day)}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={
                              s.status === "open"
                                ? "text-xs font-medium text-amber-700 dark:text-amber-300"
                                : "text-xs font-medium text-zinc-500"
                            }
                          >
                            {s.status === "open" ? "Abierta" : "Cerrada"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-sm text-zinc-800 dark:text-zinc-200">
                          {closedBy ?? (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-zinc-800 dark:text-zinc-200">
                          {s.sales_transfer_cents != null ? (
                            <StaticCopCents cents={s.sales_transfer_cents} />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-zinc-800 dark:text-zinc-200">
                          {s.expected_cash_cents != null ? (
                            <StaticCopCents cents={s.expected_cash_cents} />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-zinc-800 dark:text-zinc-200">
                          {s.counted_cash_cents != null ? (
                            <StaticCopCents cents={s.counted_cash_cents} />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td
                          className={`px-3 py-2.5 text-right tabular-nums ${
                            diff == null
                              ? "text-zinc-400"
                              : diff === 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : diff > 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {diff == null
                            ? "—"
                            : diff === 0
                              ? "OK"
                              : `${diff > 0 ? "+" : "−"}${formatCop(Math.abs(diff)).replace(/^\$\s?/, "")}`}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-zinc-800 dark:text-zinc-200">
                          {s.units_sold ?? "—"}
                        </td>
                        <td className="max-w-[14rem] px-3 py-2.5">
                          {note ? (
                            <p
                              className="truncate text-xs text-zinc-600 dark:text-zinc-400"
                              title={String(s.notes ?? "").trim()}
                            >
                              {note}
                            </p>
                          ) : (
                            <span className="text-xs text-zinc-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right last:pr-0">
                          {s.status === "closed" ? (
                            <Link
                              href={`/admin/caja/${s.id}`}
                              className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                              aria-label={`Ver cierre del ${prettyReportDayShortLabel(s.business_day)}`}
                              title="Ver cierre"
                            >
                              <Eye className="size-4" strokeWidth={2} aria-hidden />
                            </Link>
                          ) : (
                            <span className="inline-flex size-8 items-center justify-center text-xs text-zinc-400">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-zinc-200/70 pt-3 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13px] tabular-nums text-zinc-500">
                Mostrando{" "}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  <StaticInteger value={(page - 1) * PAGE_SIZE + 1} />
                  –
                  <StaticInteger
                    value={Math.min(page * PAGE_SIZE, sessionsTotal)}
                  />
                </span>{" "}
                de{" "}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  <StaticInteger value={sessionsTotal} />
                </span>
              </p>
              {sessionsTotal > PAGE_SIZE ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-zinc-500">
                    Página{" "}
                    <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
                      {page}
                    </span>{" "}
                    de{" "}
                    <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
                      {Math.ceil(sessionsTotal / PAGE_SIZE)}
                    </span>
                  </span>
                  {page > 1 ? (
                    <Link
                      href={buildPageHref(page - 1)}
                      className="inline-flex h-8 items-center rounded-lg border border-zinc-300 px-3 text-xs font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Anterior
                    </Link>
                  ) : (
                    <span className="inline-flex h-8 cursor-not-allowed items-center rounded-lg border border-zinc-200 px-3 text-xs font-medium text-zinc-400 opacity-50 dark:border-zinc-700">
                      Anterior
                    </span>
                  )}
                  {page < Math.ceil(sessionsTotal / PAGE_SIZE) ? (
                    <Link
                      href={buildPageHref(page + 1)}
                      className="inline-flex h-8 items-center rounded-lg border border-zinc-300 px-3 text-xs font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Siguiente
                    </Link>
                  ) : (
                    <span className="inline-flex h-8 cursor-not-allowed items-center rounded-lg border border-zinc-200 px-3 text-xs font-medium text-zinc-400 opacity-50 dark:border-zinc-700">
                      Siguiente
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
