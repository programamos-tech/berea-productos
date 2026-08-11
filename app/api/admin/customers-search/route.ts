import { withTimeout } from "@/lib/async-timeout";
import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin-api";

function sanitizeIlikeQuery(q: string) {
  return q.replace(/[%_\\,]/g, "").slice(0, 80);
}

const SEARCH_DB_TIMEOUT_MS = 6_000;

export async function GET(request: Request) {
  const gate = await requireAdminApiSession();
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("q")?.trim() ?? "";
  if (raw.length < 1) {
    return NextResponse.json({ customers: [] });
  }

  const q = sanitizeIlikeQuery(raw);
  if (q.length < 1) {
    return NextResponse.json({ customers: [] });
  }

  const pattern = `%${q}%`;
  const { supabase } = gate;

  const queryResult = await withTimeout(
    supabase
      .from("customers")
      .select("id,name,email,phone,document_id")
      .or(
        `name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern},document_id.ilike.${pattern}`,
      )
      .order("name")
      .limit(20),
    SEARCH_DB_TIMEOUT_MS,
  );

  if (!queryResult) {
    return NextResponse.json(
      { error: "La búsqueda tardó demasiado." },
      { status: 504 },
    );
  }

  const { data, error } = queryResult;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { customers: data ?? [] },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
