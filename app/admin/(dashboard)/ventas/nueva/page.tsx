import { AdminNewPageShell } from "@/components/admin/AdminNewPageShell";
import { NuevaFacturaPageClient } from "@/components/admin/NuevaFacturaPageClient";
import { findDefaultPosCustomerId } from "@/lib/pos-default-customer";
import { requireAdminPermission } from "@/lib/require-admin-permission";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ error?: string; customer?: string }>;
};

export default async function AdminNuevaFacturaPage({ searchParams }: Props) {
  await requireAdminPermission("ventas_crear");
  const sp = await searchParams;
  const initialError = typeof sp.error === "string" ? sp.error : undefined;
  const fromQuery =
    typeof sp.customer === "string" && sp.customer.trim().length > 0
      ? sp.customer.trim()
      : undefined;

  const supabase = await createSupabaseServerClient();
  const initialCustomerId =
    fromQuery ?? (await findDefaultPosCustomerId(supabase));

  return (
    <AdminNewPageShell>
      <NuevaFacturaPageClient
        initialError={initialError}
        initialCustomerId={initialCustomerId}
      />
    </AdminNewPageShell>
  );
}
