"use client";

import Link from "next/link";
import {
  adminProductsListHref,
  clampAdminProductsPageSize,
  type AdminProductsListQuery,
} from "@/lib/admin-products-url";
import { StaticInteger } from "@/components/admin/ReportsAnimatedFigures";

type Props = {
  page: number;
  pageSize: number;
  totalCount: number;
  filters: Pick<
    AdminProductsListQuery,
    "q" | "status" | "category_id" | "categories"
  >;
};

function href(base: AdminProductsListQuery): string {
  return adminProductsListHref(base);
}

/** Páginas a mostrar con elipsis (1 … 4 5 6 … 25). */
function visiblePageSlots(
  current: number,
  totalPages: number,
): (number | "gap")[] {
  if (totalPages <= 1) return [1];
  if (totalPages <= 9) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const want = new Set<number>();
  want.add(1);
  want.add(totalPages);
  for (let p = current - 2; p <= current + 2; p++) {
    if (p >= 1 && p <= totalPages) want.add(p);
  }
  const sorted = [...want].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    const prev = sorted[i - 1];
    if (prev !== undefined && p - prev > 1) out.push("gap");
    out.push(p);
  }
  return out;
}

const pageBtn =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-zinc-300 px-2.5 text-xs font-medium tabular-nums text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800";
const pageBtnActive =
  "inline-flex h-8 min-w-8 cursor-default items-center justify-center rounded-lg border border-[var(--admin-coral)] bg-[var(--admin-coral)] px-2.5 text-xs font-semibold tabular-nums text-white";
const pageBtnDisabled =
  "inline-flex h-8 cursor-not-allowed items-center rounded-lg border border-zinc-200 px-3 text-xs font-medium text-zinc-400 opacity-50 dark:border-zinc-700";

export function AdminProductsPagination({
  page,
  pageSize,
  totalCount,
  filters,
}: Props) {
  if (totalCount <= 0) return null;

  const q = filters.q ?? "";
  const status = filters.status ?? "all";
  const category_id = filters.category_id ?? "";
  const categories = filters.categories ?? false;

  const safeSize = clampAdminProductsPageSize(pageSize);
  const totalPages = Math.max(1, Math.ceil(totalCount / safeSize));
  const cur = Math.min(Math.max(1, page), totalPages);

  const from = (cur - 1) * safeSize + 1;
  const to = Math.min(cur * safeSize, totalCount);
  const slots = visiblePageSlots(cur, totalPages);

  const base = (): AdminProductsListQuery => ({
    q,
    status,
    category_id,
    per_page: safeSize,
    categories,
  });

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-zinc-200/70 pt-3 dark:border-zinc-800 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <p className="text-[13px] tabular-nums text-zinc-500">
        Mostrando{" "}
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          <StaticInteger value={from} />
          –
          <StaticInteger value={to} />
        </span>{" "}
        de{" "}
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          <StaticInteger value={totalCount} />
        </span>
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {totalPages > 1 ? (
          <nav
            className="flex flex-wrap items-center gap-2"
            aria-label={`Paginación, página ${cur} de ${totalPages}`}
          >
            {cur > 1 ? (
              <Link
                href={href({ ...base(), page: cur - 1 })}
                scroll={false}
                className={pageBtn}
              >
                Anterior
              </Link>
            ) : (
              <span className={pageBtnDisabled}>Anterior</span>
            )}

            <ol className="flex flex-wrap items-center gap-1">
              {slots.map((slot, idx) =>
                slot === "gap" ? (
                  <li key={`gap-${idx}`} aria-hidden>
                    <span className="px-1 text-xs text-zinc-400">…</span>
                  </li>
                ) : (
                  <li key={slot}>
                    {slot === cur ? (
                      <span className={pageBtnActive} aria-current="page">
                        {slot}
                      </span>
                    ) : (
                      <Link
                        href={href({ ...base(), page: slot })}
                        scroll={false}
                        className={pageBtn}
                        title={`Página ${slot}`}
                      >
                        {slot}
                      </Link>
                    )}
                  </li>
                ),
              )}
            </ol>

            {cur < totalPages ? (
              <Link
                href={href({ ...base(), page: cur + 1 })}
                scroll={false}
                className={pageBtn}
              >
                Siguiente
              </Link>
            ) : (
              <span className={pageBtnDisabled}>Siguiente</span>
            )}
          </nav>
        ) : null}
      </div>
    </div>
  );
}
