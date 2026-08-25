"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  addKitToCartFromForm,
  buyNowKitFromDetail,
} from "@/app/actions/cart";
import { useStoreCartDrawer } from "@/components/store/StoreCartDrawerProvider";
import { formatCop } from "@/lib/money";
import { pseudoReviewCount } from "@/lib/pseudo-review";
import {
  STORE_PRODUCT_DETAIL_IMAGE_QUALITY,
  STORE_PRODUCT_DETAIL_IMAGE_SIZES,
} from "@/lib/store-image";
import { shouldUnoptimizeStorageImageUrl } from "@/lib/storage-public-url";

export type KitDetailIncludedItem = {
  productId: string;
  name: string;
  quantity: number;
  imageUrl: string | null;
  href: string | null;
  lineGrossCents: number;
};

type Props = {
  kitId: string;
  name: string;
  description: string;
  salePriceCents: number;
  listPriceCents: number;
  stockQuantity: number;
  imageUrl: string | null;
  discountPercent: number;
  includedItems: KitDetailIncludedItem[];
};

function AccordionSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-stone-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left transition hover:opacity-90"
        aria-expanded={open}
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900">
          {title}
        </span>
        <span className="text-lg font-light leading-none text-stone-400 tabular-nums">
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? (
        <div className="pb-5 text-sm leading-relaxed text-stone-600">{children}</div>
      ) : null}
    </div>
  );
}

function subscribePrefersReducedMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getPrefersReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribePrefersReducedMotion,
    getPrefersReducedMotionSnapshot,
    () => false,
  );
}

export function KitDetailView({
  kitId,
  name,
  description,
  salePriceCents,
  listPriceCents,
  stockQuantity,
  imageUrl,
  discountPercent,
  includedItems,
}: Props) {
  const router = useRouter();
  const { openCart } = useStoreCartDrawer();
  const [qty, setQty] = useState(1);
  const [descExpanded, setDescExpanded] = useState(false);
  const [heroLayout, setHeroLayout] = useState<{
    url: string;
    width: number;
    height: number;
  } | null>(null);
  const [heroZoom, setHeroZoom] = useState(false);
  const [heroZoomOrigin, setHeroZoomOrigin] = useState({ x: 50, y: 50 });
  const prefersReducedMotion = usePrefersReducedMotion();

  const reviews = pseudoReviewCount(kitId);
  const outOfStock = stockQuantity <= 0;
  const maxQty = Math.max(0, Math.floor(stockQuantity));
  const safeQty =
    outOfStock || maxQty < 1 ? 1 : Math.min(Math.max(1, qty), maxQty);

  const savingsCents = Math.max(0, listPriceCents - salePriceCents);
  const hasSavings = savingsCents > 0;
  const pct = Math.max(0, Math.min(100, Math.floor(Number(discountPercent) || 0)));

  const descriptionText = description.trim();
  const descPreviewLimit = 280;
  const showDescToggle = descriptionText.length > descPreviewLimit;
  const descriptionDisplayed =
    descriptionText && showDescToggle && !descExpanded
      ? `${descriptionText.slice(0, descPreviewLimit).trim()}…`
      : descriptionText;

  const unopt = shouldUnoptimizeStorageImageUrl(imageUrl);

  const heroFrameStyle = useMemo(() => {
    const natural =
      imageUrl &&
      heroLayout &&
      heroLayout.url === imageUrl &&
      heroLayout.width > 0 &&
      heroLayout.height > 0
        ? heroLayout
        : null;
    if (natural) {
      return {
        aspectRatio: `${natural.width} / ${natural.height}`,
      } as const;
    }
    return { minHeight: "clamp(280px, 62vw, 78vh)" } as const;
  }, [imageUrl, heroLayout]);

  const heroZoomScale = prefersReducedMotion || !heroZoom ? 1 : 1.9;
  const includedCount = includedItems.length;

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
      <div
        className="relative w-full overflow-hidden bg-[var(--store-image-well)] motion-safe:cursor-crosshair"
        style={heroFrameStyle}
        onMouseEnter={() => {
          if (!prefersReducedMotion) setHeroZoom(true);
        }}
        onMouseLeave={() => {
          setHeroZoom(false);
        }}
        onMouseMove={(e) => {
          if (prefersReducedMotion) return;
          const el = e.currentTarget;
          const rect = el.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
          const y = ((e.clientY - rect.top) / Math.max(rect.height, 1)) * 100;
          setHeroZoomOrigin({ x, y });
        }}
      >
        {imageUrl ? (
          <div
            className={`absolute inset-0 ${
              heroZoomScale > 1 ? "will-change-transform" : ""
            }`}
            style={
              heroZoomScale > 1
                ? {
                    transform: `scale(${heroZoomScale})`,
                    transformOrigin: `${heroZoomOrigin.x}% ${heroZoomOrigin.y}%`,
                    transition: prefersReducedMotion
                      ? undefined
                      : "transform 120ms ease-out",
                  }
                : prefersReducedMotion
                  ? undefined
                  : { transition: "transform 120ms ease-out" }
            }
          >
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-contain object-center"
              sizes={STORE_PRODUCT_DETAIL_IMAGE_SIZES}
              quality={STORE_PRODUCT_DETAIL_IMAGE_QUALITY}
              priority
              unoptimized={unopt}
              onLoad={(e) => {
                const img = e.currentTarget;
                const url = imageUrl;
                if (url && img.naturalWidth > 0 && img.naturalHeight > 0) {
                  setHeroLayout({
                    url,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                  });
                }
              }}
            />
          </div>
        ) : (
          <div className="flex min-h-[280px] items-center justify-center text-6xl text-stone-300">
            ◆
          </div>
        )}
        <span className="absolute left-4 top-4 z-10 bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-violet-800">
          Kit
        </span>
      </div>

      <div className="flex min-w-0 flex-col lg:max-w-xl lg:pt-2">
        <h1 className="text-xl font-semibold uppercase leading-snug tracking-[0.06em] text-[var(--store-brand)] sm:text-2xl">
          {name}
        </h1>

        <div className="mt-4">
          {hasSavings && pct > 0 ? (
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-stone-500">
              −{pct}% en combo
            </p>
          ) : hasSavings ? (
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-stone-500">
              Precio especial de kit
            </p>
          ) : null}
          <p className="text-lg font-normal tabular-nums text-stone-900 sm:text-xl">
            {hasSavings ? (
              <>
                <span className="mr-2 text-base text-stone-400 line-through decoration-stone-300">
                  {formatCop(listPriceCents)}
                </span>
                <span>{formatCop(salePriceCents)}</span>
              </>
            ) : (
              formatCop(salePriceCents)
            )}
          </p>
          {hasSavings ? (
            <p className="mt-1 text-[12px] text-stone-500">
              Ahorras {formatCop(savingsCents)} frente a comprar por separado
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex items-center gap-2">
          <span className="flex text-amber-500" aria-hidden>
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className="size-[15px] fill-current"
                strokeWidth={0}
              />
            ))}
          </span>
          <span className="text-sm tabular-nums text-stone-500">({reviews})</span>
        </div>

        {includedCount > 0 ? (
          <div className="mt-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900">
              Incluye {includedCount} producto{includedCount === 1 ? "" : "s"}
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {includedItems.map((item) => {
                const thumb = (
                  <span className="relative block size-14 overflow-hidden bg-[var(--store-image-well)]">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt=""
                        fill
                        className="object-cover object-center"
                        sizes="56px"
                        unoptimized={shouldUnoptimizeStorageImageUrl(
                          item.imageUrl,
                        )}
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center text-stone-300">
                        ◆
                      </span>
                    )}
                    {item.quantity > 1 ? (
                      <span className="absolute right-0.5 top-0.5 bg-white/95 px-1 text-[9px] font-semibold tabular-nums text-stone-800">
                        ×{item.quantity}
                      </span>
                    ) : null}
                  </span>
                );
                return (
                  <li key={item.productId} className="shrink-0">
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="block outline-none ring-[var(--store-accent)]/35 focus-visible:ring-2"
                        title={item.name}
                      >
                        {thumb}
                      </Link>
                    ) : (
                      thumb
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {outOfStock ? (
          <p className="mt-6 border-t border-stone-200/80 pt-6 text-sm font-medium uppercase tracking-wide text-stone-500">
            Agotado
          </p>
        ) : null}

        {!outOfStock ? (
          <form className="mt-10 space-y-4">
            <input type="hidden" name="kitId" value={kitId} />
            <input type="hidden" name="quantity" value={String(safeQty)} />

            <div className="flex max-w-xs items-center justify-between gap-4 border-b border-stone-200 pb-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-600">
                Cantidad
              </span>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="text-lg text-stone-500 transition hover:text-[var(--store-accent)]"
                  onClick={() =>
                    setQty((q) => Math.max(1, Math.min(q, maxQty) - 1))
                  }
                  aria-label="Menos"
                >
                  −
                </button>
                <span className="min-w-[2ch] text-center text-sm font-semibold tabular-nums text-stone-900">
                  {safeQty}
                </span>
                <button
                  type="button"
                  className="text-lg text-stone-500 transition hover:text-[var(--store-accent)]"
                  onClick={() =>
                    setQty((q) => Math.min(maxQty, Math.max(1, q) + 1))
                  }
                  aria-label="Más"
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="submit"
              formAction={async (formData) => {
                await addKitToCartFromForm(formData);
                router.refresh();
                openCart();
              }}
              className="w-full bg-[var(--store-accent)] py-3.5 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[var(--store-accent-hover)]"
            >
              Añadir a la bolsa
            </button>

            <button
              type="submit"
              formAction={buyNowKitFromDetail}
              className="w-full bg-transparent py-2 text-center text-sm text-stone-600 underline decoration-stone-300 underline-offset-[6px] transition hover:text-[var(--store-accent)]"
            >
              Comprar ahora
            </button>
          </form>
        ) : null}

        <div className="mt-12">
          <AccordionSection title="Descripción" defaultOpen>
            {descriptionText ? (
              <div className="space-y-2">
                <p className="whitespace-pre-wrap">{descriptionDisplayed}</p>
                {showDescToggle ? (
                  <button
                    type="button"
                    onClick={() => setDescExpanded((v) => !v)}
                    className="text-sm font-medium text-[var(--store-accent)] underline decoration-[var(--store-accent)]/40 underline-offset-4"
                  >
                    {descExpanded ? "Ver menos" : "Leer más"}
                  </button>
                ) : null}
              </div>
            ) : (
              <p>
                Combo listo para pedir. Revisa los productos incluidos más abajo.
              </p>
            )}
          </AccordionSection>

          <AccordionSection title="Qué incluye" defaultOpen>
            {includedItems.length === 0 ? (
              <p>Este kit no tiene productos asociados.</p>
            ) : (
              <ul className="space-y-4">
                {includedItems.map((item) => {
                  const row = (
                    <div className="flex items-start gap-3">
                      <span className="relative size-14 shrink-0 overflow-hidden bg-[var(--store-image-well)]">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt=""
                            fill
                            className="object-cover object-center"
                            sizes="56px"
                            unoptimized={shouldUnoptimizeStorageImageUrl(
                              item.imageUrl,
                            )}
                          />
                        ) : (
                          <span className="flex size-full items-center justify-center text-stone-300">
                            ◆
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium uppercase leading-snug tracking-wide text-stone-800">
                          {item.name}
                        </span>
                        <span className="mt-1 block text-[12px] text-stone-500">
                          {item.quantity} unidad{item.quantity === 1 ? "" : "es"}
                          {" · "}
                          {formatCop(item.lineGrossCents)}
                        </span>
                      </span>
                    </div>
                  );
                  return (
                    <li key={item.productId}>
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="block outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--store-accent)]/35"
                        >
                          {row}
                        </Link>
                      ) : (
                        row
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {hasSavings ? (
              <p className="mt-4 border-t border-stone-100 pt-3 text-[13px] text-stone-600">
                Por separado: {formatCop(listPriceCents)}. Precio del kit:{" "}
                {formatCop(salePriceCents)}.
              </p>
            ) : null}
          </AccordionSection>

          <AccordionSection title="Envíos y devoluciones">
            <p>
              Envíos a todo el país según disponibilidad. Cambios y devoluciones
              según políticas del comercio; consultá por WhatsApp antes de
              comprar si tienes dudas sobre el contenido del kit.
            </p>
          </AccordionSection>
        </div>

        <p className="mt-10 text-[13px] text-stone-500">
          <Link
            href="/kits"
            className="text-stone-800 underline decoration-stone-300 underline-offset-4 hover:text-stone-950"
          >
            Ver más kits
          </Link>
          <span className="mx-2 text-stone-300" aria-hidden>
            |
          </span>
          <Link
            href="/products"
            className="text-stone-800 underline decoration-stone-300 underline-offset-4 hover:text-stone-950"
          >
            Productos
          </Link>
        </p>
      </div>
    </div>
  );
}
