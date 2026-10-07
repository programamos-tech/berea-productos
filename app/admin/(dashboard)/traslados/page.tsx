import Link from "next/link";
import { InventorySubnav } from "@/components/admin/InventorySubnav";
import { requireAdminAnyPermission } from "@/lib/require-admin-permission";
import {
  formatTransferWhen,
  isStockTransferStatus,
  stockTransferStatusLabel,
  type StockTransferStatus,
} from "@/lib/stock-transfers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  adminPageSubtitleClass,
  adminPageTitleClass,
  adminTableWrapClass,
  adminToolbarBtnActiveClass,
  adminToolbarBtnBaseClass,
  adminToolbarBtnIdleClass,
} from "@/lib/admin-ui";

export const dynamic = "force-dynamic";

const FILTERS: { id: "all" | StockTransferStatus; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "in_transit", label: "En camino" },
  { id: "received", label: "Recibidos" },
  { id: "cancelled", label: "Anulados" },
];

function statusClass(status: StockTransferStatus) {
  if (status === "in_transit") return "text-amber-700 dark:text-amber-300";
  if (status === "received") return "text-emerald-700 dark:text-emerald-300";
  return "text-zinc-500";
}

export default async function AdminTrasladosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const perm = await requireAdminAnyPermission([
    "stock_transferir",
    "inventario_ver",
  ]);
  const { status: statusRaw } = await searchParams;
  const status = isStockTransferStatus(statusRaw) ? statusRaw : null;
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("stock_transfers")
    .select(
      "id,from_branch_name,to_branch_name,status,sent_at,stock_transfer_items(quantity)",
    )
    .order("sent_at", { ascending: false })
    .limit(50);
  if (status) query = query.eq("status", status);
  const { data } = await query;
  const rows = data ?? [];
  const canCreate =
    Boolean(perm.permissions.stock_transferir) &&
    perm.branchContext.available.length >= 2;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={adminPageTitleClass}>Traslados</h1>
          <p className={adminPageSubtitleClass}>
            Mueve productos de una sucursal a otra. El stock sale al enviar y
            entra cuando confirman la llegada.
          </p>
        </div>
        {canCreate ? (
          <Link
            href="/admin/traslados/nuevo"
            className={`${adminToolbarBtnBaseClass} ${adminToolbarBtnActiveClass}`}
          >
            + Nuevo traslado
          </Link>
        ) : null}
      </header>

      <InventorySubnav
        active="transfers"
        showProducts={Boolean(perm.permissions.inventario_ver)}
        showKits={Boolean(perm.permissions.kits_ver)}
        showTransfers
      />

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((filter) => {
          const href =
            filter.id === "all"
              ? "/admin/traslados"
              : `/admin/traslados?status=${filter.id}`;
          const active = (status ?? "all") === filter.id;
          return (
            <Link
              key={filter.id}
              href={href}
              className={`${adminToolbarBtnBaseClass} ${
                active ? adminToolbarBtnActiveClass : adminToolbarBtnIdleClass
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-sm text-zinc-500 dark:border-zinc-700">
          No hay traslados en esta vista.
        </p>
      ) : (
        <div className={adminTableWrapClass}>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-zinc-200 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Ruta</th>
                <th className="px-4 py-3">Unidades</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const rowStatus = isStockTransferStatus(row.status)
                  ? row.status
                  : "in_transit";
                const items = Array.isArray(row.stock_transfer_items)
                  ? row.stock_transfer_items
                  : [];
                const units = items.reduce(
                  (sum, item) => sum + Math.max(0, Number(item.quantity) || 0),
                  0,
                );
                return (
                  <tr
                    key={row.id}
                    className="border-t border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="px-4 py-3 text-zinc-500">
                      <Link href={`/admin/traslados/${row.id}`} className="hover:text-zinc-900 dark:hover:text-zinc-100">
                        {formatTransferWhen(String(row.sent_at))}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      <Link href={`/admin/traslados/${row.id}`}>
                        {row.from_branch_name} → {row.to_branch_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{units}</td>
                    <td className={`px-4 py-3 font-medium ${statusClass(rowStatus)}`}>
                      {stockTransferStatusLabel(rowStatus)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
