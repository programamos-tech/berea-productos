import Link from "next/link";
import { sendStockTransfer } from "@/app/actions/admin/stock-transfers";
import { StockTransferForm } from "@/components/admin/StockTransferForm";
import { fetchBranchInventoryMap } from "@/lib/branch-inventory";
import { requireAdminPermission } from "@/lib/require-admin-permission";
import { stockTransferErrorMessage } from "@/lib/stock-transfers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminPageTitleClass } from "@/lib/admin-ui";

export const dynamic = "force-dynamic";

export default async function AdminNuevoTrasladoPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; error?: string; message?: string }>;
}) {
  const perm = await requireAdminPermission("stock_transferir");
  const sp = await searchParams;
  const branches = perm.branchContext.available.map((branch) => ({
    id: branch.id,
    name: branch.name,
  }));
  const supabase = await createSupabaseServerClient();
  const productId = String(sp.product ?? "").trim();
  let initialLine: {
    id: string;
    name: string;
    reference: string | null;
    quantity: number;
    available: number;
  } | null = null;

  if (/^[0-9a-f-]{36}$/i.test(productId) && branches.length >= 2) {
    const fromId = perm.branchContext.active.id;
    const [{ data: product }, stock] = await Promise.all([
      supabase
        .from("products")
        .select("id,name,reference")
        .eq("id", productId)
        .maybeSingle(),
      fetchBranchInventoryMap(supabase, fromId, [productId]),
    ]);
    const available = stock.get(productId) ?? 0;
    if (product && available > 0) {
      initialLine = {
        id: String(product.id),
        name: String(product.name),
        reference: product.reference ? String(product.reference) : null,
        quantity: 1,
        available,
      };
    }
  }

  const errorMessage =
    sp.message?.trim() ||
    (sp.error ? stockTransferErrorMessage(sp.error) : null);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link
          href="/admin/traslados"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Traslados
        </Link>
        <h1 className={`${adminPageTitleClass} mt-2`}>Nuevo traslado</h1>
      </div>
      {branches.length < 2 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Necesitas al menos dos sucursales activas para trasladar inventario.
        </p>
      ) : (
        <StockTransferForm
          branches={branches}
          initialFromId={perm.branchContext.active.id}
          formAction={sendStockTransfer}
          initialLine={initialLine}
          errorMessage={errorMessage}
        />
      )}
    </div>
  );
}
