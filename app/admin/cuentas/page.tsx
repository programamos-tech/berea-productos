import { OperatorAccountsTable } from "@/components/admin/OperatorAccountsTable";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import { toOperatorAccountRow } from "@/lib/operator-accounts";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { adminPageSubtitleClass, adminPageTitleClass } from "@/lib/admin-ui";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type CustomerTenantRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  account_holder_name: string | null;
  account_holder_email: string | null;
  brand: unknown;
};

async function lastSaleByTenant(
  service: ReturnType<typeof createSupabaseServiceClient>,
  tenantIds: string[],
) {
  const lastSaleAt = new Map<string, string>();
  await Promise.all(
    tenantIds.map(async (tenantId) => {
      const { data } = await service
        .from("orders")
        .select("created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.created_at) lastSaleAt.set(tenantId, data.created_at as string);
    }),
  );
  return lastSaleAt;
}

export default async function AdminCuentasPage() {
  const perm = await loadAdminPermissions();
  if (!perm) redirect("/admin/login");
  if (!perm.isPlatformOperator) redirect("/admin");

  let rows: CustomerTenantRow[] = [];
  let lastSaleAt = new Map<string, string>();
  try {
    const service = createSupabaseServiceClient();
    const { data, error } = await service
      .from("tenants")
      .select(
        "id, slug, name, status, account_holder_name, account_holder_email, brand",
      )
      .eq("kind", "customer")
      .order("account_holder_name", { ascending: true });
    if (error) {
      console.error("[cuentas] tenants:", error.message);
    }
    rows = (data ?? []) as CustomerTenantRow[];
    lastSaleAt = await lastSaleByTenant(
      service,
      rows.map((row) => row.id),
    );
  } catch (e) {
    console.error("[cuentas] service:", e);
  }

  const accounts = rows
    .map((row) =>
      toOperatorAccountRow({
        ...row,
        lastSaleAt: lastSaleAt.get(row.id) ?? null,
      }),
    )
    .sort(
      (a, b) =>
        a.holderName.localeCompare(b.holderName, "es") ||
        a.tradeName.localeCompare(b.tradeName, "es"),
    );

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 gap-y-2">
        <div className="min-w-0">
          <h1 className={adminPageTitleClass}>Cuentas</h1>
          <p className={adminPageSubtitleClass}>
            Contacto del cliente, estado operativo y acceso a su negocio
          </p>
        </div>
      </header>

      <section className="min-h-0 border-t border-zinc-200/70 pt-4 dark:border-zinc-800">
        <OperatorAccountsTable rows={accounts} />
      </section>
    </div>
  );
}
