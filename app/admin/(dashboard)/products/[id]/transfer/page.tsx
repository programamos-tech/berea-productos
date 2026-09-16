import { transferProductStock } from "@/app/actions/admin/products";
import { AdminTransferStockForm } from "@/components/admin/AdminTransferStockForm";
import { fetchBranchInventoryMap } from "@/lib/branch-inventory";
import { requireAdminPermission } from "@/lib/require-admin-permission";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function AdminTransferStockPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const perm = await requireAdminPermission("stock_transferir");
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: product } = await supabase
    .from("products")
    .select("id,name")
    .eq("id", id)
    .maybeSingle();
  if (!product) notFound();

  const branches = perm.branchContext.available;
  const quantities = await Promise.all(
    branches.map(async (branch) => {
      const stock = await fetchBranchInventoryMap(supabase, branch.id, [id]);
      return {
        id: branch.id,
        name: branch.name,
        quantity: stock.get(id) ?? 0,
      };
    }),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Trasladar inventario</h1>
        <p className="mt-1 text-sm text-zinc-500">Entre sucursales de la cuenta</p>
      </div>
      {branches.length < 2 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Necesitas al menos dos sucursales activas para trasladar inventario.
        </p>
      ) : (
        <AdminTransferStockForm
          productName={String(product.name)}
          branches={quantities}
          activeBranchId={perm.branchContext.active.id}
          formAction={transferProductStock.bind(null, id)}
          returnTo={`/admin/products/${id}`}
        />
      )}
    </div>
  );
}
