import Image from "next/image";
import { signOutAdmin } from "@/app/actions/admin/auth";
import { enterCustomerAccount } from "@/app/actions/admin/platform-accounts";
import { AdminAuthShell } from "@/components/admin/AdminAuthShell";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import { accountHolderLabel } from "@/lib/platform-operator";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { adminPanelClass } from "@/lib/admin-ui";
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

type HolderGroup = {
  key: string;
  holderName: string;
  holderEmail: string | null;
  stores: Array<CustomerTenantRow & { logoSrc: string; tradeName: string }>;
};

function groupByHolder(rows: CustomerTenantRow[]): HolderGroup[] {
  const byKey = new Map<string, HolderGroup>();
  for (const row of rows) {
    const email = row.account_holder_email?.trim().toLowerCase() || "";
    const name = accountHolderLabel(row.account_holder_name);
    const key = email || name.toLowerCase();
    const chrome = adminAccountChrome({
      slug: row.slug,
      name: row.name,
      brand: row.brand,
    });
    const store = {
      ...row,
      logoSrc: chrome.logoSrc,
      tradeName: chrome.name,
    };
    const existing = byKey.get(key);
    if (existing) {
      existing.stores.push(store);
      continue;
    }
    byKey.set(key, {
      key,
      holderName: name,
      holderEmail: email || null,
      stores: [store],
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

  const groups = groupByHolder(rows);

  return (
    <AdminAuthShell contentWidthClassName="max-w-[28rem]">
      <div className={`${adminPanelClass} px-6 py-8 sm:px-8 sm:py-10`}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Berea Productos
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Cuentas
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Elige la cuenta del propietario para entrar a sus tiendas.
        </p>

        {groups.length === 0 ? (
          <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-300">
            Todavía no hay cuentas de clientes.
          </p>
        ) : (
          <ul className="mt-8 flex flex-col gap-3">
            {groups.map((group) => (
              <li key={group.key}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Cuenta de {group.holderName}
                </p>
                <ul className="flex flex-col gap-2.5">
                  {group.stores.map((store) => (
                    <li key={store.id}>
                      <form action={enterCustomerAccount}>
                        <input type="hidden" name="tenant_id" value={store.id} />
                        <button
                          type="submit"
                          className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white p-2.5 text-left shadow-sm ring-1 ring-zinc-950/[0.04] transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:ring-white/[0.06] dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
                        >
                          <span className="relative size-16 shrink-0 overflow-hidden rounded-lg">
                            <Image
                              src={store.logoSrc}
                              alt=""
                              width={128}
                              height={128}
                              className="size-full object-cover"
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                              {store.tradeName}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-zinc-500">
                              {group.holderEmail || store.slug}
                            </span>
                          </span>
                          <span className="shrink-0 pr-1 text-sm font-medium text-zinc-500">
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

        <form action={signOutAdmin} className="mt-8">
          <button
            type="submit"
            className="text-sm font-medium text-zinc-500 underline-offset-4 hover:text-zinc-800 hover:underline dark:hover:text-zinc-200"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </AdminAuthShell>
  );
}
