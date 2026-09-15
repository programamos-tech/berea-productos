import { signOutAdmin } from "@/app/actions/admin/auth";
import { AdminAuthShell } from "@/components/admin/AdminAuthShell";
import { OperatorAccountsTable } from "@/components/admin/OperatorAccountsTable";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import { accountHolderLabel } from "@/lib/platform-operator";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { adminPageSubtitleClass, adminPageTitleClass } from "@/lib/admin-ui";
import { adminAccountChrome } from "@/lib/tenant-brand";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type CustomerTenantRow = {
  id: string;
  slug: string;
  name: string;
  account_holder_name: string | null;
  account_holder_email: string | null;
  brand: unknown;
};

function toAccountRows(rows: CustomerTenantRow[]) {
  return rows
    .map((row) => {
      const chrome = adminAccountChrome({
        slug: row.slug,
        name: row.name,
        brand: row.brand,
      });
      const email = row.account_holder_email?.trim() || null;
      return {
        id: row.id,
        logoSrc: chrome.logoSrc,
        holderName: accountHolderLabel(row.account_holder_name),
        tradeName: chrome.name,
        email,
      };
    })
    .sort(
      (a, b) =>
        a.holderName.localeCompare(b.holderName, "es") ||
        a.tradeName.localeCompare(b.tradeName, "es"),
    );
}

export default async function AdminCuentasPage() {
  const perm = await loadAdminPermissions();
  if (!perm) redirect("/admin/login");
  if (!perm.isPlatformOperator) redirect("/admin");

  let rows: CustomerTenantRow[] = [];
  try {
    const service = createSupabaseServiceClient();
    const { data, error } = await service
      .from("tenants")
      .select(
        "id, slug, name, account_holder_name, account_holder_email, brand",
      )
      .eq("kind", "customer")
      .in("status", ["active", "trial"])
      .order("account_holder_name", { ascending: true });
    if (error) {
      console.error("[cuentas] tenants:", error.message);
    }
    rows = (data ?? []) as CustomerTenantRow[];
  } catch (e) {
    console.error("[cuentas] service:", e);
  }

  const accounts = toAccountRows(rows);

  return (
    <AdminAuthShell
      layout="canvas"
      contentWidthClassName="max-w-5xl"
      headerActions={
        <form action={signOutAdmin}>
          <button
            type="submit"
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
          >
            Cerrar sesión
          </button>
        </form>
      }
    >
      <h1 className={adminPageTitleClass}>Cuentas</h1>
      <p className={adminPageSubtitleClass}>
        Elige la cuenta del cliente para entrar a su negocio.
      </p>
      <div className="mt-8">
        <OperatorAccountsTable rows={accounts} />
      </div>
    </AdminAuthShell>
  );
}
