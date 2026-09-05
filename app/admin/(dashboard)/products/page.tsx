import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { redirect } from "next/navigation";
import { AdminProductsPagination } from "@/components/admin/AdminProductsPagination";
import { CategoriesModal } from "@/components/admin/CategoriesModal";
import { CategoriesPanel } from "@/components/admin/CategoriesPanel";
import { ProductFiltersBar } from "@/components/admin/ProductFiltersBar";
import { ProductTableActions } from "@/components/admin/ProductTableActions";
import {
  adminProductsListHref,
  adminProductsUrlWithoutFlash,
  parseAdminProductsCategoriesModal,
  parseAdminProductsPage,
  parseAdminProductsPerPage,
} from "@/lib/admin-products-url";
import {
  fetchAdminCategoriesList,
  fetchAdminCategoriesManageList,
  fetchAdminProductsList,
} from "@/lib/supabase/admin-products-list";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { unitPriceGrossCents } from "@/lib/product-vat-price";
import { AdminProductsFlashToast } from "@/components/admin/AdminProductsFlashToast";
import {
  StaticCopCents,
  StaticInteger,
} from "@/components/admin/ReportsAnimatedFigures";
import {
  adminToolbarBtnBaseClass,
  adminToolbarBtnIdleClass,
  adminToolbarBtnPrimaryClass,
  adminToolbarIconBtnClass,
  adminPageTitleClass,
} from "@/lib/admin-ui";

export const dynamic = "force-dynamic";

const LOW_STOCK_MAX = 4;

const thClass =
  "pb-3 pr-5 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";
const tdClass = "py-3.5 pr-5 align-middle";

type Search = {
  q?: string;
  status?: string;
  category_id?: string;
  categories?: string;
  category_error?: string;
  error?: string;
  saved?: string;
  uploadError?: string;
  page?: string;
  per_page?: string;
};

function shortSku(id: string) {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

type RawAdminProductRow = {
  id: string;
  name: string;
  reference?: string | null;
  price_cents: number;
  cost_cents?: number | null;
  cost_gross_cents?: number | null;
  has_vat?: boolean | null;
  vat_percent?: number | null;
  stock_quantity: number;
  stock_warehouse?: number;
  stock_local?: number;
};

type AdminProductRowModel = {
  id: string;
  name: string;
  code: string;
  costNetCents: number;
  costGrossCents: number;
  publicPriceCents: number;
  /** Stock del punto (local). */
  stock_local: number;
};

function normalizeAdminProductRow(row: unknown): AdminProductRowModel {
  const raw = row as RawAdminProductRow;
  const stockLocal = Math.max(0, Math.floor(Number(raw.stock_local ?? raw.stock_quantity ?? 0)));
  const costNet = Math.max(0, Math.round(Number(raw.cost_cents ?? 0)));
  const costGrossRaw = Number(raw.cost_gross_cents ?? 0);
  const costGross =
    costGrossRaw > 0
      ? Math.max(0, Math.round(costGrossRaw))
      : costNet;
  const publicPriceCents = unitPriceGrossCents(
    raw.price_cents,
    raw.has_vat,
    raw.vat_percent,
  );
  return {
    id: raw.id,
    name: raw.name,
    code:
      (raw.reference && String(raw.reference).trim()) || shortSku(raw.id),
    costNetCents: costNet,
    costGrossCents: costGross,
    publicPriceCents,
    stock_local: stockLocal,
  };
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const authPerm = await loadAdminPermissions();
  const canCreateProduct = Boolean(authPerm?.permissions.productos_crear);
  const canEditProduct = Boolean(authPerm?.permissions.productos_editar);
  const canStockUpdate = Boolean(authPerm?.permissions.stock_actualizar);
  const canManageCategories = Boolean(
    authPerm?.permissions.categorias_gestionar,
  );

  const spRecord = sp as Record<string, string | string[] | undefined>;
  const qParam = spRecord.q;
  const q = (
    typeof qParam === "string"
      ? qParam
      : Array.isArray(qParam)
        ? qParam[0]
        : ""
  ).trim();
  const statusRaw = spRecord.status;
  const status =
    (
      typeof statusRaw === "string"
        ? statusRaw
        : Array.isArray(statusRaw)
          ? statusRaw[0]
          : ""
    ).trim() || "all";
  const categoryRaw = spRecord.category_id;
  const categoryId = (
    typeof categoryRaw === "string"
      ? categoryRaw
      : Array.isArray(categoryRaw)
        ? categoryRaw[0]
        : ""
  ).trim();
  const err = sp.error;
  const flashSaved = sp.saved === "1" || sp.saved === "true";
  const flashUploadError =
    sp.uploadError === "1" || sp.uploadError === "true";
  const cleanProductsHref = adminProductsUrlWithoutFlash(spRecord);

  const currentPage = parseAdminProductsPage(spRecord);
  const pageSize = parseAdminProductsPerPage(spRecord);
  const showCategories = parseAdminProductsCategoriesModal(spRecord);
  const rawCategoryErr =
    typeof sp.category_error === "string" ? sp.category_error : undefined;
  const categoryFormError =
    showCategories && (rawCategoryErr === "name" || rawCategoryErr === "db")
      ? rawCategoryErr
      : undefined;

  const categoriesCloseHref = adminProductsListHref({
    q,
    status,
    category_id: categoryId,
    page: currentPage,
    per_page: pageSize,
  });
  const categoriesOpenHref = adminProductsListHref({
    q,
    status,
    category_id: categoryId,
    page: currentPage,
    per_page: pageSize,
    categories: true,
  });

  if (showCategories && !canManageCategories) {
    redirect(categoriesCloseHref);
  }

  const supabase = await createSupabaseServerClient();

  const [categoryList, listResult, categoriesManage] = await Promise.all([
    fetchAdminCategoriesList(supabase),
    fetchAdminProductsList(supabase, {
      q,
      status,
      categoryId,
      lowStockMax: LOW_STOCK_MAX,
      page: currentPage,
      pageSize,
    }),
    showCategories
      ? fetchAdminCategoriesManageList(supabase)
      : Promise.resolve({ list: [], error: false }),
  ]);

  const {
    list,
    error: queryError,
    usedFallbackSelect,
    totalCount,
  } = listResult;

  const productRows = list.map(normalizeAdminProductRow);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (!queryError && totalCount > 0 && currentPage > totalPages) {
    redirect(
      adminProductsListHref({
        q,
        status,
        category_id: categoryId,
        page: totalPages,
        per_page: pageSize,
        categories: showCategories,
      }),
    );
  }

  const hasFilters = Boolean(q.trim() || status !== "all" || categoryId);

  const listReturnHref = adminProductsListHref({
    q,
    status,
    category_id: categoryId,
    page: currentPage,
    per_page: pageSize,
    categories: showCategories,
  });

  return (
    <>
      <div className="flex w-full min-w-0 max-w-none flex-col gap-4">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 gap-y-2">
          <div className="min-w-0">
            <h1 className={adminPageTitleClass}>
              Productos
            </h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {canManageCategories ? (
              <Link
                href={categoriesOpenHref}
                scroll={false}
                className={`${adminToolbarBtnBaseClass} ${adminToolbarBtnIdleClass}`}
              >
                Categorías
              </Link>
            ) : null}
            <Link
              href="/admin/products"
              className={adminToolbarIconBtnClass}
              title="Quitar filtros y recargar"
              aria-label="Actualizar"
            >
              <RefreshCw
                className="size-4 shrink-0"
                strokeWidth={2.25}
                aria-hidden
              />
            </Link>
            {canCreateProduct ? (
              <Link
                href="/admin/products/new"
                className={`${adminToolbarBtnBaseClass} ${adminToolbarBtnPrimaryClass}`}
              >
                + Nuevo producto
              </Link>
            ) : null}
          </div>
        </header>

        <div className="flex min-h-0 flex-col gap-4">
          {queryError ? (
            <p className="text-sm text-amber-700 dark:text-amber-300">
              No se pudo cargar productos desde Supabase. Revisa la conexión y
              el esquema.
            </p>
          ) : null}

          {!queryError && usedFallbackSelect ? (
            <p className="text-sm text-amber-700 dark:text-amber-300">
              La base está parcialmente migrada: se listan productos con un
              esquema compatible.
            </p>
          ) : null}

          {err === "stock" ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              No se pudo actualizar el stock. Intenta de nuevo.
            </p>
          ) : null}

          <ProductFiltersBar
            defaultQ={q}
            defaultStatus={status}
            defaultCategoryId={categoryId}
            defaultPerPage={pageSize}
            lowStockMax={LOW_STOCK_MAX}
            categories={categoryList}
            categoriesModalOpen={showCategories}
          />

          <section className="min-h-0 border-t border-zinc-200/70 pt-4 dark:border-zinc-800">
            {!queryError && totalCount === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {hasFilters
                    ? "No hay productos con estos criterios."
                    : "Aún no hay productos en el catálogo."}
                </p>
                {canCreateProduct ? (
                  <Link
                    href="/admin/products/new"
                    className="mt-3 inline-block text-sm font-medium text-zinc-800 underline-offset-2 hover:underline dark:text-zinc-200"
                  >
                    Crear el primero
                  </Link>
                ) : null}
              </div>
            ) : !queryError ? (
              <>
                {/* Móvil */}
                <ul
                  role="list"
                  className="divide-y divide-zinc-100 xl:hidden dark:divide-zinc-800"
                >
                  {productRows.map((p) => (
                    <li key={p.id} className="min-w-0 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="min-w-0 flex-1 no-underline"
                        >
                          <p className="font-mono text-[11px] tabular-nums text-zinc-500">
                            {p.code}
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {p.name}
                          </p>
                          <p className="mt-1.5 text-xs text-zinc-500">
                            Stock{" "}
                            <span className="font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
                              <StaticInteger value={p.stock_local} />
                            </span>
                          </p>
                          <p className="mt-1 text-[11px] text-zinc-500">
                            Costo{" "}
                            <span className="tabular-nums text-zinc-700 dark:text-zinc-300">
                              <StaticCopCents cents={p.costNetCents} />
                            </span>
                            <span className="mx-1 text-zinc-400">/</span>
                            <span className="tabular-nums text-zinc-700 dark:text-zinc-300">
                              <StaticCopCents cents={p.costGrossCents} />
                            </span>
                            <span className="ml-1 text-zinc-400">s/IVA · c/IVA</span>
                          </p>
                          <p className="mt-1.5 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                            <StaticCopCents cents={p.publicPriceCents} />
                          </p>
                        </Link>
                        <ProductTableActions
                          productId={p.id}
                          productName={p.name}
                          referenceLabel={p.code}
                          stockLocal={p.stock_local}
                          canEdit={canEditProduct}
                          canStock={canStockUpdate}
                          returnTo={listReturnHref}
                        />
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Desktop */}
                <div className="hidden min-w-0 overflow-x-auto xl:block">
                  <table className="w-full min-w-[960px] table-fixed text-left text-sm">
                    <colgroup>
                      <col className="w-[11%]" />
                      <col className="w-[28%]" />
                      <col className="w-[8%]" />
                      <col className="w-[12%]" />
                      <col className="w-[12%]" />
                      <col className="w-[13%]" />
                      <col className="w-[16%]" />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-zinc-200/70 dark:border-zinc-800">
                        <th className={thClass}>Referencia</th>
                        <th className={thClass}>Producto</th>
                        <th className={`${thClass} text-right`}>Stock</th>
                        <th className={`${thClass} text-right`}>Costo s/IVA</th>
                        <th className={`${thClass} text-right`}>Costo c/IVA</th>
                        <th className={`${thClass} text-right`}>Precio c/IVA</th>
                        <th className={`${thClass} pr-2 text-right`}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productRows.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b border-zinc-100/80 last:border-0 transition hover:bg-zinc-50/50 dark:border-zinc-800/80 dark:hover:bg-zinc-900/40"
                        >
                          <td
                            className={`${tdClass} font-mono text-xs tabular-nums text-zinc-600 dark:text-zinc-400`}
                          >
                            {p.code}
                          </td>
                          <td className={`${tdClass} min-w-0`}>
                            <Link
                              href={`/admin/products/${p.id}`}
                              className="block truncate font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                            >
                              {p.name}
                            </Link>
                          </td>
                          <td
                            className={`${tdClass} text-right tabular-nums font-medium text-zinc-800 dark:text-zinc-200`}
                          >
                            <StaticInteger value={p.stock_local} />
                          </td>
                          <td
                            className={`${tdClass} text-right tabular-nums text-zinc-700 dark:text-zinc-300`}
                          >
                            <StaticCopCents cents={p.costNetCents} />
                          </td>
                          <td
                            className={`${tdClass} text-right tabular-nums text-zinc-700 dark:text-zinc-300`}
                          >
                            <StaticCopCents cents={p.costGrossCents} />
                          </td>
                          <td
                            className={`${tdClass} text-right font-medium tabular-nums text-zinc-900 dark:text-zinc-50`}
                          >
                            <StaticCopCents cents={p.publicPriceCents} />
                          </td>
                          <td className={`${tdClass} pr-2 text-right`}>
                            <div className="flex justify-end">
                              <ProductTableActions
                                productId={p.id}
                                productName={p.name}
                                referenceLabel={p.code}
                                stockLocal={p.stock_local}
                                canEdit={canEditProduct}
                                canStock={canStockUpdate}
                                returnTo={listReturnHref}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <AdminProductsPagination
                  page={currentPage}
                  pageSize={pageSize}
                  totalCount={totalCount}
                  filters={{
                    q,
                    status,
                    category_id: categoryId,
                    categories: showCategories,
                  }}
                />
              </>
            ) : null}
          </section>
        </div>
      </div>

      {flashSaved || flashUploadError ? (
        <AdminProductsFlashToast
          saved={flashSaved}
          uploadError={flashUploadError}
          cleanHref={cleanProductsHref}
        />
      ) : null}

      {showCategories ? (
        <CategoriesModal closeHref={categoriesCloseHref}>
          <CategoriesPanel
            list={categoriesManage.list}
            loadError={categoriesManage.error}
            categoryError={categoryFormError}
          />
        </CategoriesModal>
      ) : null}
    </>
  );
}
