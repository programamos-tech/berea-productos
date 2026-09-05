import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AdminKitDetailToolbar } from "@/components/admin/AdminKitDetailToolbar";
import { fetchKitWithItems } from "@/lib/load-product-kits";
import { formatCop } from "@/lib/money";
import {
  kitIsAvailable,
  kitMarginPreview,
  maxKitsAvailableFromItems,
} from "@/lib/product-kits";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import {
  shouldUnoptimizeStorageImageUrl,
  storagePublicObjectUrl,
} from "@/lib/storage-public-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const labelClass =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";

const th =
  "pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";

const metaSep = "text-zinc-300 dark:text-zinc-600";
const metaText = "text-zinc-700 dark:text-zinc-300";

function pricingModeLabel(mode: string, discountPercent: number): string {
  if (mode === "fixed") return "Precio fijo";
  const pct = Math.min(100, Math.max(0, Math.floor(Number(discountPercent ?? 0))));
  return pct > 0 ? `Suma − ${pct}%` : "Suma de productos";
}

export default async function AdminKitDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const kit = await fetchKitWithItems(supabase, id);
  if (!kit) notFound();

  const perm = await loadAdminPermissions();
  const canEdit = Boolean(perm?.permissions.kits_gestionar);

  const items = kit.items ?? [];
  const margin = kitMarginPreview(kit, items, "pos");
  const maxPos = maxKitsAvailableFromItems(items, "pos");
  const maxStore = maxKitsAvailableFromItems(items, "storefront");
  const available = kitIsAvailable(kit, "pos");
  const img = storagePublicObjectUrl(kit.image_path);
  const desc =
    (kit.description && String(kit.description).trim()) ||
    "Sin descripción cargada.";

  const crumb =
    kit.name.trim().length > 40
      ? `${kit.name.trim().slice(0, 39)}…`
      : kit.name.trim();

  const margenPct =
    margin.marginPercent != null
      ? Math.round(margin.marginPercent)
      : margin.saleCents > 0
        ? Math.round((margin.marginCents / margin.saleCents) * 100)
        : 0;

  return (
    <div className="flex w-full min-w-0 max-w-none flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-2 gap-y-2">
        <div className="min-w-0">
          <p className="text-[11px] text-zinc-500">
            <Link
              href="/admin/kits"
              className="hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Kits
            </Link>
            <span className="mx-1.5 text-zinc-400">/</span>
            {crumb}
          </p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            {kit.name}
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm text-zinc-500">
            <span className={metaText}>
              {kit.is_published ? "Publicado" : "Borrador"}
            </span>
            <span className={metaSep} aria-hidden>
              ·
            </span>
            <span className={metaText}>
              {pricingModeLabel(kit.pricing_mode, kit.discount_percent)}
            </span>
            <span className={metaSep} aria-hidden>
              ·
            </span>
            <span className={metaText}>
              {items.length} producto{items.length === 1 ? "" : "s"}
            </span>
            <span className={metaSep} aria-hidden>
              ·
            </span>
            <span
              className={
                available
                  ? "font-medium text-emerald-700 dark:text-emerald-400"
                  : "font-medium text-amber-800 dark:text-amber-300"
              }
            >
              {available ? "Disponible" : "Sin stock para armar"}
            </span>
          </p>
        </div>
        <AdminKitDetailToolbar
          kitId={id}
          kitName={kit.name}
          canEdit={canEdit}
        />
      </header>

      <div className="flex flex-col gap-6 border-t border-zinc-200/70 pt-4 dark:border-zinc-800 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start lg:gap-8">
        <section className="min-w-0 space-y-6">
          <div className="flex gap-4">
            {img ? (
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 sm:size-20">
                <Image
                  src={img}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="80px"
                  unoptimized={shouldUnoptimizeStorageImageUrl(img)}
                />
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className={labelClass}>Descripción</p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                {desc}
              </p>
            </div>
          </div>

          <div>
            <p className={labelClass}>Datos</p>
            <div className="mt-2 max-h-[min(40dvh,18rem)] overflow-x-auto overflow-y-auto lg:max-h-none">
              <table className="min-w-full text-left text-[13px] leading-snug sm:text-sm">
                <thead className="sticky top-0 z-[1] bg-white dark:bg-zinc-950">
                  <tr className="border-b border-zinc-200/70 dark:border-zinc-800">
                    <th className={th}>Publicado</th>
                    <th className={th}>Precio</th>
                    <th className={th}>Orden</th>
                    <th className={`${th} pr-0`}>Componentes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-100/80 dark:border-zinc-800/80">
                    <td className="whitespace-nowrap py-2.5 pr-4 align-middle text-zinc-800 dark:text-zinc-200">
                      {kit.is_published ? "Sí" : "No"}
                    </td>
                    <td className="py-2.5 pr-4 align-middle text-zinc-800 dark:text-zinc-200">
                      {pricingModeLabel(kit.pricing_mode, kit.discount_percent)}
                    </td>
                    <td className="whitespace-nowrap py-2.5 pr-4 align-middle tabular-nums text-zinc-800 dark:text-zinc-200">
                      {kit.sort_order}
                    </td>
                    <td className="whitespace-nowrap py-2.5 align-middle tabular-nums text-zinc-800 dark:text-zinc-200">
                      {items.length}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <p className={labelClass}>Productos del kit</p>
            {items.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">Sin productos.</p>
            ) : (
              <div className="mt-2 max-h-[min(52dvh,28rem)] overflow-x-auto overflow-y-auto lg:max-h-none">
                <table className="min-w-full text-left text-[13px] leading-snug sm:text-sm">
                  <thead className="sticky top-0 z-[1] bg-white dark:bg-zinc-950">
                    <tr className="border-b border-zinc-200/70 dark:border-zinc-800">
                      <th className={th}>Producto</th>
                      <th className={th}>Código</th>
                      <th className={th}>Cant.</th>
                      <th className={`${th} pr-0`}>Precio und.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => {
                      const p = row.products;
                      const name = p?.name?.trim() || "Producto";
                      const ref =
                        (p?.reference && String(p.reference).trim()) || "—";
                      const qty = Math.max(1, Math.floor(Number(row.quantity ?? 0)));
                      const unit = Math.max(
                        0,
                        Math.floor(Number(p?.price_cents ?? 0)),
                      );
                      return (
                        <tr
                          key={`${kit.id}-${row.product_id}`}
                          className="border-b border-zinc-100/80 dark:border-zinc-800/80"
                        >
                          <td className="py-2.5 pr-4 align-middle">
                            {p?.id ? (
                              <Link
                                href={`/admin/products/${p.id}`}
                                className="font-medium text-zinc-900 no-underline hover:underline dark:text-zinc-100"
                              >
                                {name}
                              </Link>
                            ) : (
                              <span className="text-zinc-800 dark:text-zinc-200">
                                {name}
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-4 align-middle font-mono text-[13px] text-zinc-600 dark:text-zinc-400">
                            {ref}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-4 align-middle tabular-nums text-zinc-800 dark:text-zinc-200">
                            {qty}
                          </td>
                          <td className="whitespace-nowrap py-2.5 align-middle tabular-nums text-zinc-800 dark:text-zinc-200">
                            {formatCop(unit)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <aside className="shrink-0 space-y-5 border-t border-zinc-200/70 pt-4 dark:border-zinc-800 lg:sticky lg:top-3 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0 dark:lg:border-zinc-800">
          <div>
            <p className={labelClass}>Precio de venta</p>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
              {formatCop(margin.saleCents)}
            </p>
            {kit.pricing_mode === "sum_discount" &&
            margin.sumGrossCents !== margin.saleCents ? (
              <p className="mt-1 text-sm tabular-nums text-zinc-500">
                {formatCop(margin.sumGrossCents)} sin descuento
              </p>
            ) : null}
          </div>

          <div>
            <p className={labelClass}>Kits armables</p>
            <div className="mt-1.5 space-y-1.5 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-zinc-500">POS</span>
                <span className="tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
                  {maxPos}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-t border-zinc-200/70 pt-1.5 dark:border-zinc-800">
                <span className="text-zinc-500">Web</span>
                <span className="tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
                  {maxStore}
                </span>
              </div>
            </div>
          </div>

          <div>
            <p className={labelClass}>Costo</p>
            <p className="mt-1.5 text-sm font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
              {formatCop(margin.costCents)}
            </p>
          </div>

          <div>
            <p className={labelClass}>Margen</p>
            <p className="mt-1.5 text-sm font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
              {margenPct}% · {formatCop(Math.max(0, margin.marginCents))} / kit
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
