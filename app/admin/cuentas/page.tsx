import { signOutAdmin } from "@/app/actions/admin/auth";
import { enterCustomerAccount } from "@/app/actions/admin/platform-accounts";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import { accountHolderLabel } from "@/lib/platform-operator";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  adminPageSubtitleClass,
  adminPageTitleClass,
  adminPanelClass,
} from "@/lib/admin-ui";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type CustomerTenantRow = {
  id: string;
  slug: string;
  name: string;
  account_holder_name: string | null;
  account_holder_email: string | null;
};

type HolderGroup = {
  key: string;
  holderName: string;
  holderEmail: string | null;
  stores: CustomerTenantRow[];
};

function groupByHolder(rows: CustomerTenantRow[]): HolderGroup[] {
  const byKey = new Map<string, HolderGroup>();
  for (const row of rows) {
    const email = row.account_holder_email?.trim().toLowerCase() || "";
    const name = accountHolderLabel(row.account_holder_name);
    const key = email || name.toLowerCase();
    const existing = byKey.get(key);
    if (existing) {
      existing.stores.push(row);
      continue;
    }
    byKey.set(key, {
      key,
      holderName: name,
      holderEmail: email || null,
      stores: [row],
    });
  }
  return [...byKey.values()].sort((a, b) =>
    a.holderName.localeCompare(b.holderName, "es"),
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
        "id, slug, name, account_holder_name, account_holder_email",
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

  const groups = groupByHolder(rows);

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-zinc-100 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_0%,color-mix(in_srgb,var(--admin-coral)_18%,transparent),transparent_55%)]"
      />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-10 sm:px-6">
        <header className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Berea Productos
          </p>
          <h1 className={adminPageTitleClass}>Cuentas</h1>
          <p className={adminPageSubtitleClass}>
            Elige la cuenta del propietario para entrar a sus tiendas.
          </p>
        </header>

        {groups.length === 0 ? (
          <div className={`${adminPanelClass} px-5 py-6 text-sm text-zinc-600 dark:text-zinc-300`}>
            Todavía no hay cuentas de clientes.
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {groups.map((group) => (
              <li key={group.key} className={`${adminPanelClass} overflow-hidden`}>
                <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
                  <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    Cuenta de {group.holderName}
                  </p>
                  {group.holderEmail ? (
                    <p className="mt-0.5 text-sm text-zinc-500">{group.holderEmail}</p>
                  ) : null}
                </div>
                <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {group.stores.map((store) => (
                    <li key={store.id}>
                      <form action={enterCustomerAccount}>
                        <input type="hidden" name="tenant_id" value={store.id} />
                        <button
                          type="submit"
                          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800/70"
                        >
                          <span>
                            <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                              {store.name}
                            </span>
                            <span className="mt-0.5 block text-xs text-zinc-500">
                              {store.slug}
                            </span>
                          </span>
                          <span className="text-sm font-medium text-zinc-500">
                            Entrar
                          </span>
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}

        <form action={signOutAdmin} className="mt-auto pt-10">
          <button
            type="submit"
            className="text-sm font-medium text-zinc-500 underline-offset-4 hover:text-zinc-800 hover:underline dark:hover:text-zinc-200"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
