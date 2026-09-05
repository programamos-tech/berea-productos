import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchAdminActivityLogPage,
  type AdminActivityAction,
  type AdminActivityLogRow,
} from "@/lib/admin-activity-log";

export type ActivityFeedItem = {
  id: string;
  created_at: string;
  action_type: AdminActivityAction;
  summary: string;
  actor: string;
  href: string | null;
};

export function activityEntityHref(row: Pick<AdminActivityLogRow, "entity_type" | "entity_id">): string | null {
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

export async function loadAdminActivityFeedItems(
  supabase: SupabaseClient,
  pageSize = 18,
): Promise<{ items: ActivityFeedItem[]; error: string | null }> {
  const { rows, error } = await fetchAdminActivityLogPage(supabase, {
    page: 1,
    pageSize,
  });
  if (error) return { items: [], error };

  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))];
  const actorLabel = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", actorIds);
    for (const p of profiles ?? []) {
      const id = String((p as { id?: string }).id ?? "");
      const name = String(
        (p as { display_name?: string | null }).display_name ?? "",
      ).trim();
      if (id) actorLabel.set(id, name || id.slice(0, 8));
    }
  }

  const items: ActivityFeedItem[] = rows.map((row) => ({
    id: row.id,
    created_at: row.created_at,
    action_type: row.action_type,
    summary: row.summary,
    actor: actorLabel.get(row.actor_id) ?? "Equipo",
    href: activityEntityHref(row),
  }));

  return { items, error: null };
}
