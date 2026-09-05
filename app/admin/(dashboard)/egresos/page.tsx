import Link from "next/link";
import { Suspense } from "react";
import { ExpensesExportButton } from "@/components/admin/ExpensesExportButton";
import { ExpensesFiltersBar } from "@/components/admin/ExpensesFiltersBar";
import {
  ExpensesTable,
  type ExpenseTableRow,
} from "@/components/admin/ExpensesTable";
import { NewExpenseModalHost } from "@/components/admin/NewExpenseForm";
import { VentasPagination } from "@/components/admin/VentasPagination";
import { currentYearMonthInReportStore } from "@/lib/admin-report-range";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import { parseExpenseConceptFilter } from "@/lib/expense-concepts";
import { fetchAdminExpensesPage } from "@/lib/supabase/admin-expenses-list";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  adminToolbarBtnBaseClass,
  adminToolbarBtnActiveClass,
  adminToolbarIconBtnClass,
  adminPageTitleClass,
  adminPageSubtitleClass,
} from "@/lib/admin-ui";

export const dynamic = "force-dynamic";

const EGRESOS_PAGE_SIZE = 20;

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

function searchParamFirst(
  v: string | string[] | undefined,
): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return undefined;
}

function normalizeDateRange(
  fromRaw: string | undefined,
  toRaw: string | undefined,
): { from: string | null; to: string | null } {
  let f = fromRaw && YMD_RE.test(fromRaw.trim()) ? fromRaw.trim() : null;
  let t = toRaw && YMD_RE.test(toRaw.trim()) ? toRaw.trim() : null;
  if (f && t && f > t) {
    const x = f;
    f = t;
    t = x;
  }
  return { from: f, to: t };
}

export default async function AdminEgresosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const qRaw = (searchParamFirst(sp.q) ?? "").trim();
  const conceptRaw = parseExpenseConceptFilter(searchParamFirst(sp.concept));
  const { from: dateFrom, to: dateTo } = normalizeDateRange(
    searchParamFirst(sp.from),
    searchParamFirst(sp.to),
  );

  const pageRaw = searchParamFirst(sp.page);
  const pageParsed = pageRaw ? Number.parseInt(pageRaw, 10) : 1;
  let page = Number.isFinite(pageParsed) && pageParsed > 0 ? pageParsed : 1;

  const hasExplicitFilters =
    qRaw.length > 0 ||
    Boolean(conceptRaw) ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  const supabase = await createSupabaseServerClient();
  const perm = await loadAdminPermissions();
  const canCancel = Boolean(perm?.permissions.egresos_crear);
  const canCreate = Boolean(perm?.permissions.egresos_crear);

  const openNuevo =
    searchParamFirst(sp.nuevo) === "1" ||
    Boolean(searchParamFirst(sp.expense_error));
  const expenseErrorCode = searchParamFirst(sp.expense_error);

  let rows: Awaited<ReturnType<typeof fetchAdminExpensesPage>>["rows"] = [];
  let stats: Awaited<ReturnType<typeof fetchAdminExpensesPage>>["stats"] = {
    totalActivoCents: 0,
    todayTotalCents: 0,
    cancelledCount: 0,
    total: 0,
  };
  let expensesError: string | null = null;

  const [fetched, profilesRes] = await Promise.all([
    fetchAdminExpensesPage(supabase, {
      q: qRaw,
      concept: conceptRaw,
      dateFrom,
      dateTo,
      page,
      pageSize: EGRESOS_PAGE_SIZE,
    }),
    canCreate
      ? supabase
          .from("profiles")
          .select("id,display_name,login_username")
          .eq("is_active", true)
          .order("display_name", { ascending: true })
      : Promise.resolve({ data: null }),
  ]);

  rows = fetched.rows;
  stats = fetched.stats;
  expensesError = fetched.error;

  const totalPages = Math.max(1, Math.ceil(stats.total / EGRESOS_PAGE_SIZE));
  if (!expensesError && page > totalPages && stats.total > 0) {
    page = totalPages;
    const refetch = await fetchAdminExpensesPage(supabase, {
      q: qRaw,
      concept: conceptRaw,
      dateFrom,
      dateTo,
      page,
      pageSize: EGRESOS_PAGE_SIZE,
    });
    rows = refetch.rows;
    stats = refetch.stats;
    expensesError = refetch.error;
  }

  const turnWorkers = (profilesRes.data ?? []).map((p) => {
    const display = String(p.display_name ?? "").trim();
    const login = String(p.login_username ?? "").trim();
    return {
      id: String(p.id),
      label: display || login || "Colaborador",
    };
  });

  const { total } = stats;

  const tableRows: ExpenseTableRow[] = rows.map((e) => ({
    id: e.id,
    concept: e.concept,
    amount_cents: e.amount_cents,
    payment_method: e.payment_method,
    notes: e.notes,
    expense_date: e.expense_date,
    created_at: e.created_at,
    is_cancelled: e.is_cancelled === true,
    expense_kind: e.expense_kind,
    expense_scope: e.expense_scope,
    supplierLink: e.supplierLink
      ? {
          supplierId: e.supplierLink.supplierId,
          invoiceId: e.supplierLink.invoiceId,
          folio: e.supplierLink.folio || null,
        }
      : null,
  }));

  const buildPageHref = (targetPage: number) => {
    const p = new URLSearchParams();
    if (qRaw) p.set("q", qRaw);
    if (conceptRaw) p.set("concept", conceptRaw);
    if (dateFrom) p.set("from", dateFrom);
    if (dateTo) p.set("to", dateTo);
    if (targetPage > 1) p.set("page", String(targetPage));
    const qs = p.toString();
    return qs ? `/admin/egresos?${qs}` : "/admin/egresos";
  };

  const nuevoHref = (() => {
    const p = new URLSearchParams();
    if (qRaw) p.set("q", qRaw);
    if (conceptRaw) p.set("concept", conceptRaw);
    if (dateFrom) p.set("from", dateFrom);
    if (dateTo) p.set("to", dateTo);
    if (page > 1) p.set("page", String(page));
    p.set("nuevo", "1");
    return `/admin/egresos?${p.toString()}`;
  })();

  return (
    <div className="flex w-full min-w-0 max-w-none flex-col gap-4">
      {canCreate ? (
        <NewExpenseModalHost
          open={openNuevo}
          initialError={expenseErrorCode}
          turnWorkers={turnWorkers}
        />
      ) : null}

      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 gap-y-2">
        <div className="min-w-0">
          <h1 className={adminPageTitleClass}>
            Gastos
          </h1>
          <p className={adminPageSubtitleClass}>
            Caja del turno, cuentas e impuestos del negocio
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ExpensesExportButton
            defaultYearMonth={currentYearMonthInReportStore()}
          />
          {canCreate ? (
            <Link
              href={nuevoHref}
              className={`${adminToolbarBtnBaseClass} ${adminToolbarBtnActiveClass}`}
            >
              + Nuevo
            </Link>
          ) : null}
          <Link
            href="/admin"
            className={adminToolbarIconBtnClass}
            title="Volver a reportes"
            aria-label="Volver a reportes"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="size-4"
              aria-hidden
            >
              <path
                d="m15 18-6-6 6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-col gap-4">
        <Suspense
          fallback={
            <div
              role="status"
              className="h-16 animate-pulse rounded-lg bg-zinc-100/80 dark:bg-zinc-800/60 motion-reduce:animate-none"
            >
              <span className="sr-only">Cargando filtros…</span>
            </div>
          }
        >
          <ExpensesFiltersBar
            initialQ={qRaw}
            initialConcept={conceptRaw ?? ""}
            initialFrom={dateFrom ?? ""}
            initialTo={dateTo ?? ""}
          />
        </Suspense>

        <section className="min-h-0 border-t border-zinc-200/70 pt-4 dark:border-zinc-800">
          {expensesError ? (
            <p className="py-6 text-sm text-amber-700 dark:text-amber-300">
              No se pudieron aplicar los filtros: {expensesError}
            </p>
          ) : (
            <>
              <ExpensesTable
                rows={tableRows}
                canCancel={canCancel}
                emptyMessage={
                  hasExplicitFilters
                    ? "No hay registros que coincidan con la búsqueda o las fechas."
                    : "Aún no hay gastos ni egresos registrados."
                }
              />
              <VentasPagination
                page={page}
                pageSize={EGRESOS_PAGE_SIZE}
                total={total}
                buildHref={buildPageHref}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
