import { ReportActivityFeedLive } from "@/components/admin/ReportActivityFeedLive";
import { loadAdminActivityFeedItems } from "@/lib/admin-activity-feed";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function ReportActivityFeed() {
  const supabase = await createSupabaseServerClient();
  const { items, error } = await loadAdminActivityFeedItems(supabase, 18);

  if (error) {
    return (
      <section className="flex min-h-0 flex-col xl:h-full">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Actividad reciente
        </h2>
        <p className="mt-4 text-xs text-amber-700 dark:text-amber-300">
          No se pudo cargar el historial.
        </p>
      </section>
    );
  }

  return <ReportActivityFeedLive initialItems={items} />;
}

export function ReportActivityFeedSkeleton() {
  return (
    <div className="h-40 min-h-0 animate-pulse rounded-lg bg-zinc-100/40 dark:bg-zinc-900/40 xl:h-full" />
  );
}
