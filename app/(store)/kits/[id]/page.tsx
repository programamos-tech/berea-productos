import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import {
  KitDetailView,
  type KitDetailIncludedItem,
} from "@/components/store/KitDetailView";
import { storeBrand } from "@/lib/brand";
import { fetchKitWithItems } from "@/lib/load-product-kits";
import {
  kitComponentsGrossSumCents,
  maxKitsAvailableFromItems,
  resolveKitSalePriceCents,
} from "@/lib/product-kits";
import { storefrontListGrossUnitCents } from "@/lib/storefront-gross-price";
import { productHasStorefrontImage } from "@/lib/storefront-product-image";
import { storeShellClass } from "@/lib/store-theme";
import { storagePublicObjectUrl } from "@/lib/storage-public-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const loadPublishedKit = cache(async (id: string) => {
  const supabase = await createSupabaseServerClient();
  const kit = await fetchKitWithItems(supabase, id);
  if (!kit?.is_published) return null;
  return kit;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const kit = await loadPublishedKit(id);
  if (!kit) {
    return { title: `Kits y combos | ${storeBrand}` };
  }
  const desc = kit.description.trim();
  return {
    title: `${kit.name} | ${storeBrand}`,
    ...(desc ? { description: desc.slice(0, 160) } : {}),
  };
}

export default async function KitDetailPage({ params }: Props) {
  const { id } = await params;
  const kit = await loadPublishedKit(id);
  if (!kit) notFound();

  const items = kit.items ?? [];
  if (items.length === 0) notFound();

  const salePriceCents = resolveKitSalePriceCents(kit, items, "storefront");
  const listPriceCents = kitComponentsGrossSumCents(items, "storefront");
  const stockQuantity = maxKitsAvailableFromItems(items, "storefront");
  const imageUrl = storagePublicObjectUrl(kit.image_path);

  const includedItems: KitDetailIncludedItem[] = [];
  for (const row of items) {
    const p = row.products;
    if (!p) continue;
    const quantity = Math.max(1, Math.floor(Number(row.quantity ?? 0)));
    const unitGrossCents = storefrontListGrossUnitCents(
      p.price_cents,
      p.has_vat,
    );
    const hasPdp =
      Boolean(p.is_published) && productHasStorefrontImage(p.image_path);
    includedItems.push({
      productId: p.id,
      name: p.name,
      quantity,
      imageUrl: storagePublicObjectUrl(p.image_path),
      href: hasPdp ? `/products/${p.id}` : null,
      lineGrossCents: unitGrossCents * quantity,
    });
  }

  const discountPercent =
    kit.pricing_mode === "sum_discount"
      ? Math.max(0, Math.floor(Number(kit.discount_percent ?? 0)))
      : listPriceCents > 0 && salePriceCents < listPriceCents
        ? Math.round(((listPriceCents - salePriceCents) / listPriceCents) * 100)
        : 0;

  return (
    <div className={`${storeShellClass} py-10 sm:py-12 lg:py-14`}>
      <nav
        aria-label="Migas de pan"
        className="mb-8 text-[11px] uppercase tracking-[0.12em] text-stone-400"
      >
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li>
            <Link href="/" className="transition hover:text-stone-700">
              Inicio
            </Link>
          </li>
          <li aria-hidden className="text-stone-300">
            /
          </li>
          <li>
            <Link href="/kits" className="transition hover:text-stone-700">
              Kits y combos
            </Link>
          </li>
          <li aria-hidden className="text-stone-300">
            /
          </li>
          <li
            className="max-w-[min(100%,28rem)] truncate text-stone-600"
            title={kit.name}
          >
            {kit.name}
          </li>
        </ol>
      </nav>

      <KitDetailView
        kitId={kit.id}
        name={kit.name}
        description={kit.description ?? ""}
        salePriceCents={salePriceCents}
        listPriceCents={listPriceCents}
        stockQuantity={stockQuantity}
        imageUrl={imageUrl}
        discountPercent={discountPercent}
        includedItems={includedItems}
      />
    </div>
  );
}
