import { NextResponse } from "next/server";
import { withTimeout } from "@/lib/async-timeout";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Sesión admin para rutas `/api/admin/*` (el middleware no cubre `/api`).
 * Usa getSession (JWT local) en lugar de getUser para evitar un round-trip
 * extra al servidor de auth en cada búsqueda del POS.
 */
export async function requireAdminApiSession(): Promise<
  | { ok: true; supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createSupabaseServerClient();
  const sessionResult = await withTimeout(supabase.auth.getSession(), 5_000);
  if (!sessionResult) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Auth no respondió a tiempo" },
        { status: 503 },
      ),
    };
  }
  const {
    data: { session },
  } = sessionResult;
  const user = session?.user ?? null;
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    };
  }

  const profileResult = await withTimeout(
    supabase.from("profiles").select("id").eq("id", user.id).maybeSingle(),
    5_000,
  );
  if (!profileResult) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Perfil no respondió a tiempo" },
        { status: 503 },
      ),
    };
  }

  const { data: profile, error: profileError } = profileResult;

  if (profileError || !profile) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Prohibido" }, { status: 403 }),
    };
  }

  return { ok: true, supabase };
}
