import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { StockTransferRowActions } from "@/components/admin/StockTransferRowActions";
import { StockTransfersFilters } from "@/components/admin/StockTransfersFilters";
import { requireAdminAnyPermission } from "@/lib/require-admin-permission";
import {
  formatTransferWhen,
  isStockTransferStatus,
  stockTransferCode,
  type StockTransferStatus,
} from "@/lib/stock-transfers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminModuleHeader } from "@/components/admin/AdminModuleHeader";
import {
  adminTableWrapClass,
  adminToolbarBtnBaseClass,
  adminToolbarBtnActiveClass,
  adminToolbarBtnIdleClass,
} from "@/lib/admin-ui";

const thClass =
  "px-4 pb-3 pt-4 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";
const tdClass = "px-4 py-2.5 align-middle";

export const dynamic = "force-dynamic";

function StatusPill({ status }: { status: StockTransferStatus }) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide";
  if (status === "in_transit") {
    return (
      <span className={`${base} bg-amber-50 text-amber-900 ring-1 ring-amber-200/90 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800/55`}>
        <span className="size-1.5 rounded-full bg-current opacity-75" aria-hidden />
        En camino
      </span>
    );
  }
  if (status === "received") {
    return (
      <span className={`${base} bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800/60`}>
        <span className="size-1.5 rounded-full bg-current opacity-75" aria-hidden />
        Recibido
      </span>
    );
  }
  return (
    <span className={`${base} bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700`}>
      <span className="size-1.5 rounded-full bg-current opacity-75" aria-hidden />
      Anulado
    </span>
  );
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
      <AdminModuleHeader
        icon="traslados"
        title="Traslados de inventario"
        branchName={perm.branchContext.active.name}
        subtitle="Gestiona los traslados de productos entre sucursales"
        actions={
          <>
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
                className={`${adminToolbarBtnBaseClass} ${adminToolbarBtnActiveClass}`}
              >
                + Nuevo traslado
              </Link>
            ) : null}
          </>
        }
      />

      <StockTransfersFilters q={q} status={status ?? "all"} />

      <div className={adminTableWrapClass}>
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-sm text-zinc-500">
            No hay traslados en esta vista.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
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
                      <td className={`${tdClass} whitespace-nowrap font-mono tabular-nums text-zinc-600 dark:text-zinc-400`}>
                        {row.code}
                      </td>
                      <td className={`${tdClass} font-medium text-zinc-900 dark:text-zinc-100`}>
                        {row.from} → {row.to}
                      </td>
                      <td className={`${tdClass} text-right tabular-nums text-zinc-700 dark:text-zinc-300`}>
                        {row.units}
                      </td>
                      <td className={tdClass}>
                        <StatusPill status={row.status} />
                      </td>
                      <td className={`${tdClass} whitespace-nowrap text-zinc-500`}>
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
