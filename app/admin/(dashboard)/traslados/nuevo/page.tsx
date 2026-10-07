import Link from "next/link";
import { sendStockTransfer } from "@/app/actions/admin/stock-transfers";
import { AdminNewPageShell } from "@/components/admin/AdminNewPageShell";
import { StockTransferForm } from "@/components/admin/StockTransferForm";
import { fetchBranchInventoryMap } from "@/lib/branch-inventory";
import { requireAdminPermission } from "@/lib/require-admin-permission";
import { stockTransferErrorMessage } from "@/lib/stock-transfers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    <AdminNewPageShell>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2 gap-y-2">
        <div className="min-w-0">
          <p className="text-[11px] text-zinc-500">
            <Link
              href="/admin/traslados"
              className="hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Traslados
            </Link>
            <span className="mx-1.5 text-zinc-400">/</span>
            Nuevo traslado
          </p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            Nuevo traslado
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            Al enviar, las unidades salen de la sucursal de origen. Entran en la
            de destino cuando confirmen que llegaron.
          </p>
        </div>
        <Link
          href="/admin/traslados"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          title="Volver a traslados"
          aria-label="Volver a traslados"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="size-4"
            aria-hidden
          >
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </header>
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
    </AdminNewPageShell>
  );
}
