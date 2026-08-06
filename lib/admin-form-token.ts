import type { SupabaseClient } from "@supabase/supabase-js";

/** Claim de un solo uso: true = primera vez (aplicar mutación), false = ya usado. */
export async function claimAdminFormToken(
  supabase: SupabaseClient,
  token: string,
  actionKey: string,
): Promise<"claimed" | "duplicate" | "error"> {
  const t = String(token ?? "").trim();
  if (t.length < 16 || t.length > 80) return "error";

  const { data, error } = await supabase.rpc("claim_admin_form_token", {
    p_token: t,
    p_action_key: actionKey,
  });

  if (error) {
    console.error("claim_admin_form_token", error);
    return "error";
  }

  return data === true ? "claimed" : "duplicate";
}

export function readSubmissionToken(formData: FormData): string {
  return String(
    formData.get("submission_id") ?? formData.get("submission_token") ?? "",
  ).trim();
}
