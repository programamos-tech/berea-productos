import { RegistrosActivityTable } from "@/components/admin/RegistrosActivityTable";
import { VentasPagination } from "@/components/admin/VentasPagination";
import { fetchAdminActivityLogPage } from "@/lib/admin-activity-log";
import { REPORT_STORE_TIME_ZONE } from "@/lib/admin-report-range";
import {
  adminPageSubtitleClass,
  adminPageTitleClass,
} from "@/lib/admin-ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ACTIVITIES_PAGE_SIZE = 25;

function searchParamFirst(
  v: string | string[] | undefined,
): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return undefined;
}

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("es-CO", {
      timeZone: REPORT_STORE_TIME_ZONE,
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  } catch {
    return iso;
  }
}

function buildPageHref(page: number): string {
  if (page <= 1) return "/admin/actividades";
  return `/admin/actividades?page=${page}`;
}

type Props = {
  searchParams: Promise<{ page?: string | string[] }>;
};

export default async function AdminActividadesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const pageRaw = Number.parseInt(searchParamFirst(sp.page) ?? "1", 10);
  const pageRequested =
    Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const supabase = await createSupabaseServerClient();
  let page = pageRequested;
  let { rows: list, total, error } = await fetchAdminActivityLogPage(supabase, {
    page,
    pageSize: ACTIVITIES_PAGE_SIZE,
  });

  if (error) {
    return (
      <div className="w-full min-w-0 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/35 dark:text-amber-100">
        No se pudo cargar los registros. Aplica la migración{" "}
        <code className="rounded bg-amber-100/80 px-1 py-0.5 text-xs dark:bg-amber-900/50">
          20260523120000_admin_activity_log.sql
        </code>{" "}
        en Supabase.
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / ACTIVITIES_PAGE_SIZE));
  if (page > totalPages && total > 0) {
    page = totalPages;
    ({ rows: list, total } = await fetchAdminActivityLogPage(supabase, {
      page,
      pageSize: ACTIVITIES_PAGE_SIZE,
    }));
  }

  const actorIds = [...new Set(list.map((r) => r.actor_id))];
  const { data: profs } =
    actorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, display_name, login_username")
          .in("id", actorIds)
      : {
          data: [] as {
            id: string;
            display_name: string | null;
            login_username: string | null;
          }[],
        };

  const actorLabel = new Map<string, string>();
  for (const p of profs ?? []) {
    const id = p.id as string;
    const name =
      String(p.display_name ?? "").trim() ||
      String(p.login_username ?? "").trim() ||
      id.slice(0, 8);
    actorLabel.set(id, name);
  }

  const tableRows = list.map((row) => ({
    row,
    actorDisplay: actorLabel.get(row.actor_id) ?? row.actor_id.slice(0, 8),
    whenLabel: formatWhen(row.created_at),
  }));

  return (
    <div className="flex w-full min-w-0 max-w-none flex-col gap-4">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 gap-y-2">
        <div className="min-w-0">
          <h1 className={adminPageTitleClass}>Registros</h1>
          <p className={adminPageSubtitleClass}>
            Altas, cambios y movimientos del equipo
          </p>
        </div>
      </header>

      <section className="border-t border-zinc-200/70 pt-4 dark:border-zinc-800">
        <RegistrosActivityTable rows={tableRows} />
        <VentasPagination
          page={page}
          pageSize={ACTIVITIES_PAGE_SIZE}
          total={total}
          buildHref={buildPageHref}
        />
      </section>
    </div>
  );
}
