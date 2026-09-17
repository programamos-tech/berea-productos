"use client";

import { X } from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useRouter } from "next/navigation";
import { formatCop } from "@/lib/money";
import type { SizeFacetOption } from "@/lib/product-listing-facets";

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "price_asc", label: "Más económicos" },
  { value: "price_desc", label: "Más caros" },
  { value: "newest", label: "Recientes" },
  { value: "name", label: "A-Z" },
];

function roundCop(n: number) {
  if (n >= 100_000) return Math.round(n / 10_000) * 10_000;
  if (n >= 10_000) return Math.round(n / 5_000) * 5_000;
  return Math.round(n / 1_000) * 1_000;
}

function priceQuickFilters(min: number, max: number) {
  if (!(max > 0) || max <= min) return [];
  const span = max - min;
  const low = Math.max(min + 1, roundCop(min + span * 0.34));
  const high = Math.min(max - 1, roundCop(min + span * 0.66));
  if (low <= min || high >= max || low >= high) {
    const mid = roundCop((min + max) / 2);
    return [
      {
        id: "eco",
        label: `Hasta ${formatCop(mid)}`,
        min: null as number | null,
        max: mid,
      },
      {
        id: "high",
        label: `Desde ${formatCop(mid)}`,
        min: mid,
        max: null as number | null,
      },
    ];
  }
  return [
    {
      id: "eco",
      label: `Hasta ${formatCop(low)}`,
      min: null as number | null,
      max: low,
    },
    {
      id: "mid",
      label: `${formatCop(low)} – ${formatCop(high)}`,
      min: low,
      max: high,
    },
    {
      id: "high",
      label: `Desde ${formatCop(high)}`,
      min: high,
      max: null as number | null,
    },
  ];
}

function buildListingQuery(opts: {
  lockedCategoryId: string | null;
  brands: string[];
  colors: string[];
  sizeKeys: string[];
  categoryIds: string[];
  priceMin: number | null;
  priceMax: number | null;
  sort: string;
  q: string;
}): string {
  const p = new URLSearchParams();
  if (opts.lockedCategoryId) p.set("category", opts.lockedCategoryId);
  if (opts.brands.length > 0) p.set("brands", opts.brands.join(","));
  if (opts.colors.length > 0) p.set("colors", opts.colors.join("|"));
  if (opts.sizeKeys.length > 0) p.set("sizes", opts.sizeKeys.join("|"));
  if (!opts.lockedCategoryId && opts.categoryIds.length > 0) {
    p.set("categories", opts.categoryIds.join(","));
  }
  if (opts.priceMin != null) p.set("price_min", String(opts.priceMin));
  if (opts.priceMax != null) p.set("price_max", String(opts.priceMax));
  if (opts.sort && opts.sort !== "newest") p.set("sort", opts.sort);
  if (opts.q) p.set("q", opts.q);
  const qs = p.toString();
  return qs ? `/products?${qs}` : "/products";
}

function parsePriceInput(raw: string): number | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const n = Number.parseInt(digits, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.min(n, 999_999_999);
}

export function ProductsListingControls({
  lockedCategoryId,
  facets,
  selection,
  sort,
  searchQuery,
}: {
  lockedCategoryId: string | null;
  facets: {
    brands: string[];
    colors: string[];
    sizes: SizeFacetOption[];
    priceMin: number;
    priceMax: number;
    categories: { id: string; name: string }[];
  };
  selection: {
    brands: string[];
    colors: string[];
    sizes: string[];
    categoryIds: string[];
    priceMin: number | null;
    priceMax: number | null;
  };
  sort: string;
  searchQuery: string;
}) {
  const router = useRouter();
  const baseId = useId();
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftBrands, setDraftBrands] = useState<Set<string>>(
    () => new Set(selection.brands),
  );
  const [draftColors, setDraftColors] = useState<Set<string>>(
    () => new Set(selection.colors),
  );
  const [draftSizes, setDraftSizes] = useState<Set<string>>(
    () => new Set(selection.sizes),
  );
  const [draftCategories, setDraftCategories] = useState<Set<string>>(
    () => new Set(selection.categoryIds),
  );
  const [draftPriceMin, setDraftPriceMin] = useState(() =>
    selection.priceMin != null ? String(selection.priceMin) : "",
  );
  const [draftPriceMax, setDraftPriceMax] = useState(() =>
    selection.priceMax != null ? String(selection.priceMax) : "",
  );

  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Recientes";
  const quickPrices = priceQuickFilters(facets.priceMin, facets.priceMax);

  useEffect(() => {
    setDraftBrands(new Set(selection.brands));
    setDraftColors(new Set(selection.colors));
    setDraftSizes(new Set(selection.sizes));
    setDraftCategories(new Set(selection.categoryIds));
    setDraftPriceMin(selection.priceMin != null ? String(selection.priceMin) : "");
    setDraftPriceMax(selection.priceMax != null ? String(selection.priceMax) : "");
  }, [selection]);

  const navigate = useCallback(
    (next: {
      brands?: string[];
      colors?: string[];
      sizes?: string[];
      categoryIds?: string[];
      priceMin?: number | null;
      priceMax?: number | null;
      sort?: string;
    }) => {
      router.push(
        buildListingQuery({
          lockedCategoryId,
          brands: next.brands ?? selection.brands,
          colors: next.colors ?? selection.colors,
          sizeKeys: next.sizes ?? selection.sizes,
          categoryIds: next.categoryIds ?? selection.categoryIds,
          priceMin:
            next.priceMin !== undefined ? next.priceMin : selection.priceMin,
          priceMax:
            next.priceMax !== undefined ? next.priceMax : selection.priceMax,
          sort: next.sort ?? sort,
          q: searchQuery,
        }),
      );
      setFilterOpen(false);
    },
    [
      lockedCategoryId,
      router,
      searchQuery,
      selection.brands,
      selection.categoryIds,
      selection.colors,
      selection.priceMax,
      selection.priceMin,
      selection.sizes,
      sort,
    ],
  );

  useEffect(() => {
    if (!filterOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [filterOpen]);

  useEffect(() => {
    if (!filterOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setFilterOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [filterOpen]);

  const showCategorySection =
    !lockedCategoryId && facets.categories.length > 0;
  const showPriceSection = facets.priceMax > 0;

  function toggleSet(
    setter: Dispatch<SetStateAction<Set<string>>>,
    key: string,
  ) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function applyFilters() {
    let pMin = parsePriceInput(draftPriceMin);
    let pMax = parsePriceInput(draftPriceMax);
    if (pMin != null && pMax != null && pMin > pMax) {
      const t = pMin;
      pMin = pMax;
      pMax = t;
    }
    navigate({
      brands: [...draftBrands],
      colors: [...draftColors],
      sizes: [...draftSizes],
      categoryIds: [...draftCategories],
      priceMin: pMin,
      priceMax: pMax,
    });
  }

  function clearFilters() {
    setDraftBrands(new Set());
    setDraftColors(new Set());
    setDraftSizes(new Set());
    setDraftCategories(new Set());
    setDraftPriceMin("");
    setDraftPriceMax("");
    navigate({
      brands: [],
      colors: [],
      sizes: [],
      categoryIds: [],
      priceMin: null,
      priceMax: null,
    });
  }

  function chipClass(active: boolean) {
    return `flex min-h-[2.5rem] cursor-pointer items-center justify-center gap-2 rounded border px-2 py-2 text-center text-[11px] font-medium uppercase leading-tight tracking-wide transition sm:text-[12px] ${
      active
        ? "border-[var(--store-accent)] bg-[var(--store-accent)] text-white"
        : "border-stone-200 text-stone-800 hover:border-[var(--store-accent)]/35"
    }`;
  }

  const sectionTitle =
    "text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500";

  return (
    <>
      <div className="flex flex-col gap-3 px-2 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
          {SORT_OPTIONS.map((opt) => {
            const active = sort === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => navigate({ sort: opt.value })}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-medium tracking-wide transition sm:text-xs ${
                  active
                    ? "border-[var(--store-accent)] bg-[var(--store-accent)] text-white"
                    : "border-stone-200 bg-white text-stone-700 hover:border-[var(--store-accent)]/40"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="self-end rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-800 transition hover:border-stone-400 sm:self-auto sm:text-xs"
        >
          Filtrar
        </button>
      </div>

      <div
        className={`fixed inset-0 z-[85] flex justify-end transition-[visibility] duration-300 ${
          filterOpen ? "visible" : "invisible pointer-events-none"
        }`}
        aria-hidden={!filterOpen}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            filterOpen ? "opacity-100" : "opacity-0"
          }`}
          aria-label="Cerrar filtros"
          onClick={() => setFilterOpen(false)}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${baseId}-filter-title`}
          className={`relative flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-300 ease-out ${
            filterOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-stone-200 px-4 py-4">
            <h2
              id={`${baseId}-filter-title`}
              className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--store-brand)]"
            >
              Filtrar
            </h2>
            <button
              type="button"
              onClick={() => setFilterOpen(false)}
              className="inline-flex size-10 items-center justify-center border border-dashed border-stone-400 text-stone-700 transition hover:bg-stone-50 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/50"
              aria-label="Cerrar filtros"
            >
              <X className="size-5" strokeWidth={1.25} aria-hidden />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
            {showCategorySection ? (
              <section className="border-b border-stone-100 pb-8">
                <p className={sectionTitle}>Categoría</p>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {facets.categories.map((c) => {
                    const checked = draftCategories.has(c.id);
                    return (
                      <label key={c.id} className={chipClass(checked)}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleSet(setDraftCategories, c.id)
                          }
                          className="sr-only"
                        />
                        <span className="line-clamp-3">{c.name}</span>
                      </label>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {showPriceSection ? (
              <section
                className={`pb-8 ${showCategorySection ? "mt-8 border-b border-stone-100" : "border-b border-stone-100"}`}
              >
                <p className={sectionTitle}>Precio</p>
                <p className="mt-2 text-xs text-stone-500">
                  Productos entre {formatCop(facets.priceMin)} y{" "}
                  {formatCop(facets.priceMax)}.
                </p>
                {quickPrices.length > 0 ? (
                  <div className="mt-4 flex flex-col gap-2">
                    {quickPrices.map((preset) => {
                      const active =
                        (preset.min == null
                          ? selection.priceMin == null
                          : selection.priceMin === preset.min) &&
                        (preset.max == null
                          ? selection.priceMax == null
                          : selection.priceMax === preset.max) &&
                        (preset.min != null || preset.max != null);
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setDraftPriceMin(
                              preset.min != null ? String(preset.min) : "",
                            );
                            setDraftPriceMax(
                              preset.max != null ? String(preset.max) : "",
                            );
                            navigate({
                              priceMin: preset.min,
                              priceMax: preset.max,
                              sort:
                                preset.id === "high" ? "price_desc" : "price_asc",
                            });
                          }}
                          className={chipClass(Boolean(active))}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor={`${baseId}-pmin`}
                      className="text-[10px] font-semibold uppercase tracking-wide text-stone-500"
                    >
                      Desde
                    </label>
                    <input
                      id={`${baseId}-pmin`}
                      type="text"
                      inputMode="numeric"
                      placeholder={formatCop(facets.priceMin)}
                      value={draftPriceMin}
                      onChange={(e) => setDraftPriceMin(e.target.value)}
                      className="mt-1 w-full rounded border border-stone-200 px-2 py-2 text-sm tabular-nums text-stone-900 outline-none focus:border-stone-400"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`${baseId}-pmax`}
                      className="text-[10px] font-semibold uppercase tracking-wide text-stone-500"
                    >
                      Hasta
                    </label>
                    <input
                      id={`${baseId}-pmax`}
                      type="text"
                      inputMode="numeric"
                      placeholder={formatCop(facets.priceMax)}
                      value={draftPriceMax}
                      onChange={(e) => setDraftPriceMax(e.target.value)}
                      className="mt-1 w-full rounded border border-stone-200 px-2 py-2 text-sm tabular-nums text-stone-900 outline-none focus:border-stone-400"
                    />
                  </div>
                </div>
              </section>
            ) : null}

            {facets.brands.length > 0 ? (
              <section
                className={`pb-8 ${showPriceSection || showCategorySection ? "mt-8 border-b border-stone-100" : "border-b border-stone-100"}`}
              >
                <p className={sectionTitle}>Marca</p>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {facets.brands.map((b) => {
                    const checked = draftBrands.has(b);
                    return (
                      <label key={b} className={chipClass(checked)}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSet(setDraftBrands, b)}
                          className="sr-only"
                        />
                        <span className="line-clamp-2">{b}</span>
                      </label>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {facets.colors.length > 0 ? (
              <section
                className={`pb-8 ${facets.brands.length || showPriceSection || showCategorySection ? "mt-8 border-b border-stone-100" : "border-b border-stone-100"}`}
              >
                <p className={sectionTitle}>Color</p>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {facets.colors.map((c) => {
                    const checked = draftColors.has(c);
                    return (
                      <label key={c} className={chipClass(checked)}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSet(setDraftColors, c)}
                          className="sr-only"
                        />
                        <span className="line-clamp-2">{c}</span>
                      </label>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {facets.sizes.length > 0 ? (
              <section
                className={`pb-4 ${facets.colors.length || facets.brands.length || showPriceSection || showCategorySection ? "mt-8" : ""}`}
              >
                <p className={sectionTitle}>Tamaño / presentación</p>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {facets.sizes.map((s) => {
                    const checked = draftSizes.has(s.key);
                    return (
                      <label key={s.key} className={chipClass(checked)}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSet(setDraftSizes, s.key)}
                          className="sr-only"
                        />
                        <span className="line-clamp-2">{s.label}</span>
                      </label>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <p className="mt-8 text-xs leading-relaxed text-stone-500">
              Podés combinar categoría, precio, marca, color y tamaño. Las marcas y
              colores admiten varias opciones a la vez.
            </p>
          </div>

          <div className="shrink-0 border-t border-stone-200 bg-white px-4 py-4">
            <button
              type="button"
              onClick={applyFilters}
              className="w-full bg-[var(--store-accent)] py-3.5 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[var(--store-accent-hover)]"
            >
              Aplicar
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 w-full py-2 text-center text-xs text-stone-600 underline decoration-stone-300 underline-offset-4 hover:text-[var(--store-accent)]"
            >
              Limpiar filtros
            </button>
            <Link
              href={
                lockedCategoryId
                  ? `/products?category=${encodeURIComponent(lockedCategoryId)}`
                  : "/products"
              }
              className="mt-4 block text-center text-[11px] text-stone-500 hover:text-stone-800"
              onClick={() => setFilterOpen(false)}
            >
              {lockedCategoryId
                ? "Ver todos en esta categoría"
                : "Ver todo el catálogo"}
            </Link>
          </div>
        </aside>
      </div>

      <span className="sr-only">Orden actual: {sortLabel}</span>
    </>
  );
}
