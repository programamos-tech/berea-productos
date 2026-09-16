import Link from "next/link";
import Image from "next/image";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import { formatCop } from "@/lib/money";
import {
  shouldUnoptimizeStorageImageUrl,
  storagePublicObjectUrl,
} from "@/lib/storage-public-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  adminPageSubtitleClass,
  adminPageTitleClass,
  adminToolbarBtnActiveClass,
  adminToolbarBtnBaseClass,
} from "@/lib/admin-ui";

export const dynamic = "force-dynamic";

type BranchSalesTotalRow = {
  branch_id: string;
  paid_orders: number | string | null;
  total_sales_cents: number | string | null;
};

export default async function BranchesPage() {
  const perm = await loadAdminPermissions();
  const supabase = await createSupabaseServerClient();
  const [{ data: branches }, { data: salesTotals }] = await Promise.all([
    supabase
      .from("branches")
      .select("id,name,code,logo_path,is_default,is_active,created_at")
      .eq("tenant_id", perm?.tenantId ?? "")
      .order("is_default", { ascending: false })
      .order("name"),
    supabase.rpc("admin_branch_sales_totals"),
  ]);
  const totalsByBranch = new Map<
    string,
    { paidOrders: number; totalSales: number }
  >(
    ((salesTotals ?? []) as BranchSalesTotalRow[]).map((row) => [
      String(row.branch_id),
      {
        paidOrders: Number(row.paid_orders ?? 0),
        totalSales: Number(row.total_sales_cents ?? 0),
      },
    ]),
  );

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={adminPageTitleClass}>Sucursales</h1>
          <p className={adminPageSubtitleClass}>
            Puntos de operación, inventario y caja
          </p>
        </div>
        {perm?.permissions.sucursales_gestionar ? (
          <Link
            href="/admin/sucursales/nuevo"
            className={`${adminToolbarBtnBaseClass} ${adminToolbarBtnActiveClass}`}
          >
            + Nueva sucursal
          </Link>
        ) : null}
      </header>

      {(branches ?? []).length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(branches ?? []).map((branch) => {
            const logoUrl = storagePublicObjectUrl(branch.logo_path);
            const totals = totalsByBranch.get(String(branch.id)) ?? {
              paidOrders: 0,
              totalSales: 0,
            };
            const isCurrent = branch.id === perm?.branchContext.active.id;
            return (
              <article
                key={branch.id}
                className={`relative flex min-h-56 flex-col rounded-2xl border bg-white p-5 shadow-sm transition dark:bg-zinc-900 ${
                  isCurrent
                    ? "border-emerald-300 ring-1 ring-emerald-200 dark:border-emerald-800 dark:ring-emerald-900"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt={`Logo de ${branch.name}`}
                      width={64}
                      height={64}
                      unoptimized={shouldUnoptimizeStorageImageUrl(logoUrl)}
                      className="size-14 rounded-xl border border-zinc-200 bg-white object-cover dark:border-zinc-700"
                    />
                  ) : (
                    <div className="flex size-14 items-center justify-center rounded-xl bg-zinc-100 text-xl font-semibold text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                      {String(branch.name).trim().charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-wrap justify-end gap-1.5">
                  {branch.id === perm?.branchContext.active.id ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                      Activa
                    </span>
                  ) : null}
                  {branch.is_default ? (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] dark:bg-zinc-800">
                      Predeterminada
                    </span>
                  ) : null}
                  {!branch.is_active ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] text-red-800 dark:bg-red-950 dark:text-red-200">
                      Inactiva
                    </span>
                  ) : null}
                </div>
                </div>

                <div className="mt-4 min-w-0">
                  <h2 className="truncate text-lg font-semibold text-zinc-950 dark:text-white">
                    {branch.name}
                  </h2>
                  <p className="text-xs text-zinc-500">{branch.code}</p>
                </div>

                <div className="mt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-zinc-500">
                    Total vendido
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                    {formatCop(totals.totalSales)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {totals.paidOrders}{" "}
                    {totals.paidOrders === 1 ? "venta pagada" : "ventas pagadas"}
                  </p>
                </div>

                {perm?.permissions.sucursales_gestionar ? (
                  <Link
                    href={`/admin/sucursales/${branch.id}/edit`}
                    className="mt-5 inline-flex w-fit rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    Editar sucursal
                  </Link>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="rounded-xl border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          No hay sucursales disponibles.
        </p>
      )}
    </div>
  );
}
