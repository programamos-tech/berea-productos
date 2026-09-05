import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Suspense } from "react";
import {
  CustomersSearchBar,
  type CustomerActivityFilter,
  type CustomerKindFilter,
} from "@/components/admin/CustomersSearchBar";
import { CustomerRowActions } from "@/components/admin/CustomerRowActions";
import { VentasPagination } from "@/components/admin/VentasPagination";
import {
  StaticCopCents,
  StaticInteger,
} from "@/components/admin/ReportsAnimatedFigures";
import { fetchAdminCustomersPage } from "@/lib/supabase/admin-customers-list";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import { formatStoreDateTime } from "@/lib/store-datetime-format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  adminToolbarBtnBaseClass,
  adminToolbarBtnPrimaryClass,
  adminToolbarIconBtnClass,
  adminPageTitleClass,
} from "@/lib/admin-ui";

export const dynamic = "force-dynamic";

const CUSTOMERS_PAGE_SIZE = 20;

const thClass =
  "pb-3 pr-5 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";
const tdClass = "py-3.5 pr-5 align-middle";

function searchParamFirst(
  v: string | string[] | undefined,
): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return undefined;
}

/** Misma lógica que el detalle: 1 punto por cada $10.000 gastados. */
function customerPoints(totalSpentCents: number, purchases: number) {
  return purchases > 0 ? Math.round(totalSpentCents / 10000) : 0;
}

function avgTicketCents(totalSpentCents: number, purchases: number) {
  return purchases > 0 ? Math.round(totalSpentCents / purchases) : null;
}

function lastPurchaseLabel(iso: string | null) {
  if (!iso) return "—";
  return formatStoreDateTime(iso, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function CustomerKindIcon({
  wholesale,
}: {
  wholesale: boolean;
}) {
  if (wholesale) {
    return (
      <span
        className="inline-flex size-9 shrink-0 items-center justify-center text-zinc-500 dark:text-zinc-400"
        title="Mayorista"
        aria-label="Mayorista"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          className="size-[1.125rem]"
          aria-hidden
        >
          <path
            d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-6h6v6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  return (
    <span
      className="inline-flex size-9 shrink-0 items-center justify-center text-zinc-500 dark:text-zinc-400"
      title="Cliente final"
      aria-label="Cliente final"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        className="size-[1.125rem]"
        aria-hidden
      >
        <path
          d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </span>
  );
}

function customerTipoClass(wholesale: boolean) {
  return wholesale
    ? "text-amber-800 dark:text-amber-300"
    : "text-sky-800 dark:text-sky-300";
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    kind?: string | string[];
    activity?: string | string[];
    page?: string | string[];
  }>;
}) {
  const sp = await searchParams;
  const q = searchParamFirst(sp.q)?.trim() ?? "";
  const kindRaw = searchParamFirst(sp.kind)?.trim() ?? "";
  const kind: CustomerKindFilter =
    kindRaw === "wholesale" || kindRaw === "retail" ? kindRaw : "all";
  const activityRaw = searchParamFirst(sp.activity)?.trim() ?? "";
  const activity: CustomerActivityFilter =
    activityRaw === "active" ||
    activityRaw === "inactive" ||
    activityRaw === "never"
      ? activityRaw
      : "all";
  const pageRaw = Number.parseInt(searchParamFirst(sp.page) ?? "1", 10);
  const pageRequested =
    Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const authPerm = await loadAdminPermissions();
  const canCreateCustomer = Boolean(authPerm?.permissions.clientes_crear);

  const supabase = await createSupabaseServerClient();
  let page = pageRequested;
  let {
    rows,
    total: totalFiltered,
    error,
    withoutShippingFields,
  } = await fetchAdminCustomersPage(supabase, {
    q,
    kind,
    activity,
    page,
    pageSize: CUSTOMERS_PAGE_SIZE,
  });

  const totalPages = Math.max(
    1,
    Math.ceil(totalFiltered / CUSTOMERS_PAGE_SIZE),
  );
  if (page > totalPages && totalFiltered > 0) {
    page = totalPages;
    ({
      rows,
      total: totalFiltered,
      error,
      withoutShippingFields,
    } = await fetchAdminCustomersPage(supabase, {
      q,
      kind,
      activity,
      page,
      pageSize: CUSTOMERS_PAGE_SIZE,
    }));
  }

  const buildPageHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (kind !== "all") params.set("kind", kind);
    if (activity !== "all") params.set("activity", activity);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/customers?${qs}` : "/admin/customers";
  };

  const missingCustomersTable =
    error?.message?.toLowerCase().includes("customers") &&
    (error.message.includes("does not exist") ||
      error.message.includes("schema cache"));

  return (
    <div className="flex w-full min-w-0 max-w-none flex-col gap-4">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 gap-y-2">
        <div className="min-w-0">
          <h1 className={adminPageTitleClass}>
            Clientes
          </h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href="/admin/customers"
            className={adminToolbarIconBtnClass}
            title="Recargar listado"
            aria-label="Actualizar"
          >
            <RefreshCw
              className="size-4 shrink-0"
              strokeWidth={2.25}
              aria-hidden
            />
          </Link>
          {canCreateCustomer ? (
            <Link
              href="/admin/customers/new"
              className={`${adminToolbarBtnBaseClass} ${adminToolbarBtnPrimaryClass}`}
            >
              + Nuevo cliente
            </Link>
          ) : null}
        </div>
      </header>

      {error ? (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          {missingCustomersTable
            ? "Falta la tabla customers. Ejecuta la migración correspondiente en Supabase."
            : "No se pudo cargar la lista de clientes. Revisa la conexión y permisos."}
        </p>
      ) : null}

      {!error && withoutShippingFields ? (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Faltan campos de envío en pedidos. Puedes aplicar la migración de
          shipping.
        </p>
      ) : null}

      <Suspense
        fallback={
          <div className="h-[42px] max-w-xl animate-pulse rounded-lg border border-zinc-200 bg-zinc-100/80 dark:border-zinc-700 dark:bg-zinc-800/60" />
        }
      >
        <CustomersSearchBar
          initialQ={q}
          initialKind={kind}
          initialActivity={activity}
        />
      </Suspense>

      <section className="min-h-0 border-t border-zinc-200/70 pt-4 dark:border-zinc-800">
        {!error && totalFiltered === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {q || kind !== "all" || activity !== "all"
                ? "No hay resultados con estos filtros."
                : "Todavía no hay clientes."}
            </p>
            {!q && kind === "all" && activity === "all" && canCreateCustomer ? (
              <Link
                href="/admin/customers/new"
                className="mt-3 inline-block text-sm font-medium text-zinc-800 underline underline-offset-2 dark:text-zinc-200"
              >
                Crear cliente
              </Link>
            ) : q || kind !== "all" || activity !== "all" ? (
              <Link
                href="/admin/customers"
                className="mt-3 inline-block text-sm font-medium text-zinc-800 underline underline-offset-2 dark:text-zinc-200"
              >
                Limpiar filtros
              </Link>
            ) : null}
          </div>
        ) : !error ? (
          <>
            {/* Mobile */}
            <ul role="list" className="space-y-0 md:hidden">
              {rows.map((r) => {
                const ticket = avgTicketCents(r.totalSpent, r.purchases);
                const puntos = customerPoints(r.totalSpent, r.purchases);
                const isWholesale = r.customerKind === "wholesale";
                const tipoLabel = isWholesale ? "Mayorista" : "Minorista";
                return (
                  <li
                    key={r.id}
                    className="border-b border-zinc-100 py-3.5 last:border-0 dark:border-zinc-800/80"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-1 gap-3">
                        <CustomerKindIcon wholesale={isWholesale} />
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/admin/customers/${r.id}`}
                            className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                          >
                            {r.name}
                          </Link>
                          <p className="mt-0.5 text-xs tabular-nums text-zinc-500">
                            {r.documentId?.trim() || "—"}
                            {" · "}
                            <span className={customerTipoClass(isWholesale)}>
                              {tipoLabel}
                              {isWholesale && r.wholesaleDiscountPercent > 0
                                ? ` ${r.wholesaleDiscountPercent}%`
                                : ""}
                            </span>
                          </p>
                          <p className="mt-1 text-xs tabular-nums text-zinc-600 dark:text-zinc-300">
                            <StaticInteger value={r.purchases} /> compras
                            {ticket != null ? (
                              <>
                                {" "}
                                · ticket{" "}
                                <StaticCopCents cents={ticket} />
                              </>
                            ) : null}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-500">
                            Última: {lastPurchaseLabel(r.lastPurchaseAt)}
                            {" · "}
                            <span className="tabular-nums text-zinc-700 dark:text-zinc-300">
                              <StaticInteger value={puntos} /> pts
                            </span>
                          </p>
                        </div>
                      </div>
                      <CustomerRowActions
                        customerId={r.id}
                        lastOrderId={r.lastOrderId}
                        email={r.email ?? ""}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200/70 dark:border-zinc-800">
                    <th className={thClass}>Cliente</th>
                    <th className={thClass}>Documento</th>
                    <th className={thClass}>Tipo</th>
                    <th className={`${thClass} text-right`}>Compras</th>
                    <th className={`${thClass} text-right`}>Ticket prom.</th>
                    <th className={thClass}>Última compra</th>
                    <th className={`${thClass} text-right`}>Puntos</th>
                    <th className={`${thClass} pr-0 text-right`}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const ticket = avgTicketCents(r.totalSpent, r.purchases);
                    const puntos = customerPoints(r.totalSpent, r.purchases);
                    const isWholesale = r.customerKind === "wholesale";
                    const tipoLabel = isWholesale ? "Mayorista" : "Minorista";
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-zinc-100/80 last:border-0 dark:border-zinc-800/80"
                      >
                        <td className={tdClass}>
                          <div className="flex items-center gap-3">
                            <CustomerKindIcon wholesale={isWholesale} />
                            <Link
                              href={`/admin/customers/${r.id}`}
                              className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                            >
                              {r.name}
                            </Link>
                          </div>
                        </td>
                        <td
                          className={`${tdClass} whitespace-nowrap tabular-nums text-zinc-600 dark:text-zinc-300`}
                        >
                          {r.documentId?.trim() || "—"}
                        </td>
                        <td className={`${tdClass} ${customerTipoClass(isWholesale)}`}>
                          {tipoLabel}
                          {isWholesale && r.wholesaleDiscountPercent > 0
                            ? ` ${r.wholesaleDiscountPercent}%`
                            : ""}
                        </td>
                        <td
                          className={`${tdClass} text-right tabular-nums text-zinc-700 dark:text-zinc-300`}
                        >
                          <StaticInteger value={r.purchases} />
                        </td>
                        <td
                          className={`${tdClass} text-right tabular-nums text-zinc-800 dark:text-zinc-200`}
                        >
                          {ticket != null ? (
                            <StaticCopCents cents={ticket} />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td
                          className={`${tdClass} whitespace-nowrap text-zinc-600 dark:text-zinc-300`}
                        >
                          {lastPurchaseLabel(r.lastPurchaseAt)}
                        </td>
                        <td
                          className={`${tdClass} text-right tabular-nums font-medium text-zinc-900 dark:text-zinc-100`}
                        >
                          <StaticInteger value={puntos} />
                        </td>
                        <td className={`${tdClass} pr-0`}>
                          <CustomerRowActions
                            customerId={r.id}
                            lastOrderId={r.lastOrderId}
                            email={r.email ?? ""}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <VentasPagination
              page={page}
              pageSize={CUSTOMERS_PAGE_SIZE}
              total={totalFiltered}
              buildHref={buildPageHref}
            />
          </>
        ) : null}
      </section>
    </div>
  );
}
