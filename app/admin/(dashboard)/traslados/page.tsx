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
  adminPageSubtitleClass,
  adminPageTitleClass,
  adminTableWrapClass,
  adminToolbarBtnBaseClass,
  adminToolbarBtnIdleClass,
} from "@/lib/admin-ui";

const thClass =
  "pb-3 pr-5 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";
const tdClass = "py-3.5 pr-5 align-middle";

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
    <div className="flex w-full min-w-0 max-w-none flex-col gap-4">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 gap-y-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className={adminPageTitleClass}>Traslados de inventario</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900">
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
              {perm.branchContext.active.name}
            </span>
          </div>
          <p className={adminPageSubtitleClass}>
            Productos entre sucursales · stock de {perm.branchContext.active.name}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
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
      </header>

      <StockTransfersFilters q={q} status={status ?? "all"} />

      <div className={adminTableWrapClass}>
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-sm text-zinc-500">
            No hay traslados en esta vista.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200/70 dark:border-zinc-800">
                  <th className={thClass}>Traslado</th>
                  <th className={thClass}>Ruta</th>
                  <th className={`${thClass} text-right`}>Cantidad</th>
                  <th className={thClass}>Estado</th>
                  <th className={thClass}>Fecha</th>
                  <th className={`${thClass} text-right`}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const open = row.status === "in_transit";
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-zinc-100/80 last:border-0 dark:border-zinc-800/80"
                    >
                      <td className={`${tdClass} font-medium text-zinc-900 dark:text-zinc-100`}>
                        {row.code}
                      </td>
                      <td className={`${tdClass} text-zinc-800 dark:text-zinc-100`}>
                        {row.from} → {row.to}
                      </td>
                      <td className={`${tdClass} text-right tabular-nums text-zinc-900 dark:text-zinc-50`}>
                        {row.units}
                      </td>
                      <td className={`${tdClass} ${statusClass(row.status)}`}>
                        {stockTransferStatusLabel(row.status)}
                      </td>
                      <td className={`${tdClass} text-xs text-zinc-500`}>
                        {formatTransferWhen(row.sentAt)}
                      </td>
                      <td className={`${tdClass} text-right`}>
                        <div className="flex justify-end">
                          <StockTransferRowActions
                            transferId={row.id}
                            canReceive={open && accessible.has(row.toId)}
                            canCancel={open && (accessible.has(row.fromId) || accessible.has(row.toId))}
                          />
                        </div>
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
