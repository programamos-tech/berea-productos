import Link from "next/link";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  adminPageSubtitleClass,
  adminPageTitleClass,
  adminToolbarBtnActiveClass,
  adminToolbarBtnBaseClass,
} from "@/lib/admin-ui";

export const dynamic = "force-dynamic";

export default async function BranchesPage() {
  const perm = await loadAdminPermissions();
  const supabase = await createSupabaseServerClient();
  const { data: branches } = await supabase
    .from("branches")
    .select("id,name,code,is_default,is_active,created_at")
    .eq("tenant_id", perm?.tenantId ?? "")
    .order("is_default", { ascending: false })
    .order("name");

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

      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {(branches ?? []).map((branch) => (
            <div
              key={branch.id}
              className="flex items-center justify-between gap-4 bg-white px-4 py-3 dark:bg-zinc-900"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{branch.name}</p>
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
                <p className="mt-0.5 text-xs text-zinc-500">{branch.code}</p>
              </div>
              {perm?.permissions.sucursales_gestionar ? (
                <Link
                  href={`/admin/sucursales/${branch.id}/edit`}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium dark:border-zinc-700"
                >
                  Editar
                </Link>
              ) : null}
            </div>
          ))}
          {(branches ?? []).length === 0 ? (
            <p className="bg-white px-4 py-8 text-center text-sm text-zinc-500 dark:bg-zinc-900">
              No hay sucursales disponibles.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
