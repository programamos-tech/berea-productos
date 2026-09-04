import Link from "next/link";
import {
  actionTypeLabel,
  fetchAdminActivityLogPage,
  type AdminActivityAction,
  type AdminActivityLogRow,
} from "@/lib/admin-activity-log";
import { REPORT_STORE_TIME_ZONE } from "@/lib/admin-report-range";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatRelativeWhen(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const sec = Math.max(0, Math.floor((now - then) / 1000));
    if (sec < 60) return "hace un momento";
    const min = Math.floor(sec / 60);
    if (min < 60) return `hace ${min} min`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `hace ${hr} h`;
    return new Intl.DateTimeFormat("es-CO", {
      timeZone: REPORT_STORE_TIME_ZONE,
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function dotClass(action: AdminActivityAction): string {
  switch (action) {
    case "sale_created":
      return "bg-emerald-500";
    case "sale_cancelled":
      return "bg-red-500";
    case "stock_adjusted":
    case "stock_transferred":
      return "bg-amber-500";
    case "cash_session_opened":
    case "cash_session_closed":
      return "bg-rose-500";
    case "product_created":
    case "product_updated":
      return "bg-sky-500";
    default:
      return "bg-zinc-500";
  }
}

function entityHref(row: AdminActivityLogRow): string | null {
  if (!row.entity_id) return null;
  switch (row.entity_type) {
    case "order":
      return `/admin/orders/${row.entity_id}`;
    case "product":
      return `/admin/products/${row.entity_id}/edit`;
    case "customer":
      return `/admin/customers/${row.entity_id}`;
    case "cash_session":
      return `/admin/caja/${row.entity_id}`;
    default:
      return null;
  }
}

export async function ReportActivityFeed() {
  const supabase = await createSupabaseServerClient();
  const { rows, error } = await fetchAdminActivityLogPage(supabase, {
    page: 1,
    pageSize: 14,
  });

  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))];
  const actorLabel = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", actorIds);
    for (const p of profiles ?? []) {
      const id = String((p as { id?: string }).id ?? "");
      const name = String((p as { display_name?: string | null }).display_name ?? "").trim();
      if (id) actorLabel.set(id, name || id.slice(0, 8));
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-end justify-between gap-2">
        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Actividad reciente
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Ventas, stock, caja y más
          </p>
        </div>
        <Link
          href="/admin/actividades"
          className="text-[11px] font-medium text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline dark:hover:text-zinc-200"
        >
          Ver todo
        </Link>
      </div>

      {error ? (
        <p className="mt-4 text-xs text-amber-700 dark:text-amber-300">
          No se pudo cargar el historial.
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">Todavía no hay actividades.</p>
      ) : (
        <ul className="mt-3 min-h-0 flex-1 space-y-0 overflow-y-auto overscroll-contain pr-1">
          {rows.map((row) => {
            const href = entityHref(row);
            const actor = actorLabel.get(row.actor_id) ?? "Equipo";
            const body = (
              <>
                <span
                  className={`mt-1.5 size-1.5 shrink-0 rounded-full ${dotClass(row.action_type)}`}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 border-b border-zinc-200/60 pb-2.5 dark:border-zinc-800/80">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                      {actionTypeLabel(row.action_type)}
                    </span>
                    <time
                      dateTime={row.created_at}
                      className="shrink-0 text-[10px] tabular-nums text-zinc-500"
                    >
                      {formatRelativeWhen(row.created_at)}
                    </time>
                  </span>
                  <span className="mt-0.5 block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {row.summary}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-zinc-500">
                    {actor}
                  </span>
                </span>
              </>
            );

            return (
              <li key={row.id}>
                {href ? (
                  <Link
                    href={href}
                    className="flex gap-2.5 py-1.5 transition hover:opacity-90"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="flex gap-2.5 py-1.5">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function ReportActivityFeedSkeleton() {
  return (
    <div className="h-full min-h-0 animate-pulse rounded-lg bg-zinc-100/40 dark:bg-zinc-900/40" />
  );
}
