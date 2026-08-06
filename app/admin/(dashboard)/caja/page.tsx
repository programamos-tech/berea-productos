import Link from "next/link";
import {
  CashRegisterClosePanel,
  CashRegisterOpenForm,
} from "@/components/admin/CashRegisterForms";
import { StaticCopCents } from "@/components/admin/ReportsAnimatedFigures";
import {
  prettyReportDayShortLabel,
  todayYmdInReportStore,
} from "@/lib/admin-report-range";
import {
  fetchCashDayLiveTotals,
  fetchOpenCashSession,
  fetchRecentCashSessions,
} from "@/lib/cash-register";
import { formatCop } from "@/lib/money";
import { requireAdminAnyPermission } from "@/lib/require-admin-permission";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function errorMessage(code: string | undefined): string | null {
  switch (code) {
    case "float":
      return "El fondo inicial no es válido.";
    case "counted":
      return "El efectivo contado no es válido.";
    case "already_open":
      return "Ya hay una caja abierta.";
    case "day_closed":
      return "Este día ya tiene un cierre registrado.";
    case "not_open":
      return "La sesión ya no está abierta.";
    case "session":
      return "No se encontró la sesión de caja.";
    case "token":
      return "No se pudo validar el envío. Recargá e intentá de nuevo.";
    case "db":
      return "No se pudo guardar el cierre. Intentá de nuevo.";
    default:
      return null;
  }
}

export default async function AdminCajaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const perm = await requireAdminAnyPermission(["caja_ver", "caja_gestionar"]);
  const canManage = Boolean(perm.permissions.caja_gestionar);
  const sp = await searchParams;
  const errRaw = typeof sp.error === "string" ? sp.error : undefined;
  const banner = errorMessage(errRaw);

  const supabase = await createSupabaseServerClient();
  const today = todayYmdInReportStore();
  const open = await fetchOpenCashSession(supabase);
  const recent = await fetchRecentCashSessions(supabase, 21);

  const live = open
    ? await fetchCashDayLiveTotals(
        supabase,
        open.business_day,
        open.opening_float_cents,
      )
    : null;

  const dayLabel = prettyReportDayShortLabel(open?.business_day ?? today);

  return (
    <div className="w-full max-w-none space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          Cierre de caja
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-500 dark:text-zinc-400">
          Registro diario del negocio: abrís con un fondo, durante el día se acumulan ventas y
          egresos, y al cerrar ingresás el efectivo contado junto con el stock y egresos del día.
        </p>
      </div>

      {banner ? (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/35 dark:text-red-100">
          {banner}
        </p>
      ) : null}

      {!open && canManage ? (
        <CashRegisterOpenForm businessDayLabel={dayLabel} />
      ) : null}

      {!open && !canManage ? (
        <p className="rounded-xl border border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          No hay caja abierta ahora. Pedile a alguien con permiso de gestionar caja que la abra.
        </p>
      ) : null}

      {open && live ? (
        canManage ? (
          <CashRegisterClosePanel
            sessionId={open.id}
            businessDayLabel={dayLabel}
            openingFloatCents={open.opening_float_cents}
            live={live}
          />
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Caja abierta · {dayLabel}
            </p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              Fondo {formatCop(open.opening_float_cents)} · esperado{" "}
              {formatCop(live.expectedCashCents)} · {live.unitsSold} ud vendidas
            </p>
          </div>
        )
      ) : null}

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Historial reciente
        </h2>
        {recent.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Todavía no hay cierres registrados.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-700/90 dark:bg-zinc-900">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-400">
                  <th className="px-4 py-3 font-medium">Día</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Esperado</th>
                  <th className="px-4 py-3 text-right font-medium">Contado</th>
                  <th className="px-4 py-3 text-right font-medium">Dif.</th>
                  <th className="px-4 py-3 text-right font-medium">Ud</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => {
                  const diff = s.cash_difference_cents;
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                    >
                      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                        {prettyReportDayShortLabel(s.business_day)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            s.status === "open"
                              ? "rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
                              : "rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                          }
                        >
                          {s.status === "open" ? "Abierta" : "Cerrada"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-800 dark:text-zinc-200">
                        {s.expected_cash_cents != null ? (
                          <StaticCopCents cents={s.expected_cash_cents} />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-800 dark:text-zinc-200">
                        {s.counted_cash_cents != null ? (
                          <StaticCopCents cents={s.counted_cash_cents} />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td
                        className={`px-4 py-3 text-right tabular-nums ${
                          diff == null
                            ? "text-zinc-400"
                            : diff === 0
                              ? "text-emerald-700 dark:text-emerald-300"
                              : diff > 0
                                ? "text-amber-700 dark:text-amber-300"
                                : "text-red-700 dark:text-red-300"
                        }`}
                      >
                        {diff == null
                          ? "—"
                          : diff === 0
                            ? "0"
                            : `${diff > 0 ? "+" : "−"}${formatCop(Math.abs(diff)).replace(/^\$/, "")}`}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-800 dark:text-zinc-200">
                        {s.units_sold ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/caja/${s.id}`}
                          className="text-xs font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900 dark:text-zinc-300 dark:decoration-zinc-600 dark:hover:text-zinc-100"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
