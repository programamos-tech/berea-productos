import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { StockTransferRowActions } from "@/components/admin/StockTransferRowActions";
import { StockTransfersFilters } from "@/components/admin/StockTransfersFilters";
import { requireAdminAnyPermission } from "@/lib/require-admin-permission";
import {
  formatTransferWhen,
  isStockTransferStatus,
  stockTransferCode,
  stockTransferStatusLabel,
  type StockTransferStatus,
} from "@/lib/stock-transfers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  adminTableWrapClass,
  adminToolbarBtnBaseClass,
  adminToolbarBtnIdleClass,
} from "@/lib/admin-ui";

export const dynamic = "force-dynamic";

function statusClass(status: StockTransferStatus) {
  if (status === "in_transit") return "font-medium text-amber-700 dark:text-amber-300";
  if (status === "received") return "font-medium text-emerald-700 dark:text-emerald-300";
  return "text-zinc-500";
}

export default async function AdminTrasladosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const perm = await requireAdminAnyPermission([
    "stock_transferir",
    "inventario_ver",
  ]);
  const sp = await searchParams;
  const status = isStockTransferStatus(sp.status) ? sp.status : null;
  const q = String(sp.q ?? "").trim();
  const needle = q.toLowerCase();
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("stock_transfers")
    .select(
      "id,from_branch_id,to_branch_id,from_branch_name,to_branch_name,status,sent_at,stock_transfer_items(quantity)",
    )
    .order("sent_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  const { data } = await query;
  const rows = (data ?? [])
    .map((row) => {
      const rowStatus = isStockTransferStatus(row.status) ? row.status : "in_transit";
      const items = Array.isArray(row.stock_transfer_items) ? row.stock_transfer_items : [];
      const units = items.reduce(
        (sum, item) => sum + Math.max(0, Number(item.quantity) || 0),
        0,
      );
      const code = stockTransferCode(String(row.id), String(row.sent_at));
      return {
        id: String(row.id),
        code,
        fromId: String(row.from_branch_id),
        toId: String(row.to_branch_id),
        from: String(row.from_branch_name),
        to: String(row.to_branch_name),
        status: rowStatus,
        sentAt: String(row.sent_at),
        units,
      };
    })
    .filter((row) => {
      if (!needle) return true;
      return [row.code, row.from, row.to, row.id].join(" ").toLowerCase().includes(needle);
    });
  const accessible = new Set(perm.branchContext.available.map((branch) => branch.id));
  const canCreate =
    Boolean(perm.permissions.stock_transferir) &&
    perm.branchContext.available.length >= 2;
  const refreshHref = status || q
    ? `/admin/traslados?${new URLSearchParams({
        ...(q ? { q } : {}),
        ...(status ? { status } : {}),
      }).toString()}`
    : "/admin/traslados";

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-zinc-200 bg-white px-4 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M4 8h11M12 5l3 3-3 3" />
                <path d="M20 16H9M12 13l-3 3 3 3" />
              </svg>
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Traslados de inventario
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900">
                  <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
                  {perm.branchContext.active.name}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-zinc-500">
                Gestiona los traslados de productos entre sucursales
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={refreshHref}
              className={`${adminToolbarBtnBaseClass} ${adminToolbarBtnIdleClass}`}
            >
              <RefreshCw className="size-3.5" strokeWidth={2.25} aria-hidden />
              Actualizar
            </Link>
            {canCreate ? (
              <Link
                href="/admin/traslados/nuevo"
                className={`${adminToolbarBtnBaseClass} border-emerald-600 bg-emerald-600 text-white hover:border-emerald-700 hover:bg-emerald-700`}
              >
                + Nuevo traslado
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <StockTransfersFilters q={q} status={status ?? "all"} />

      <div className={adminTableWrapClass}>
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-sm text-zinc-500">
            No hay traslados en esta vista.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-zinc-200 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Traslado</th>
                  <th className="px-4 py-3">Ruta</th>
                  <th className="px-4 py-3 text-right">Cantidad</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const open = row.status === "in_transit";
                  return (
                    <tr key={row.id} className="border-t border-zinc-100 dark:border-zinc-800">
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                        {row.code}
                      </td>
                      <td className="px-4 py-3 text-zinc-800 dark:text-zinc-100">
                        {row.from} → {row.to}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-800 dark:text-zinc-100">
                        {row.units}
                      </td>
                      <td className={`px-4 py-3 ${statusClass(row.status)}`}>
                        {stockTransferStatusLabel(row.status)}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {formatTransferWhen(row.sentAt)}
                      </td>
                      <td className="px-4 py-3">
                        <StockTransferRowActions
                          transferId={row.id}
                          canReceive={open && accessible.has(row.toId)}
                          canCancel={open && (accessible.has(row.fromId) || accessible.has(row.toId))}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
