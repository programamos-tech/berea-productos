import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin-api";
import { loadAdminActivityFeedItems } from "@/lib/admin-activity-feed";

export async function GET() {
  const gate = await requireAdminApiSession();
  if (!gate.ok) return gate.response;

  const { items, error } = await loadAdminActivityFeedItems(gate.supabase, 18);
  if (error) {
    return NextResponse.json({ error, items: [] }, { status: 500 });
  }
  return NextResponse.json({ items });
}
