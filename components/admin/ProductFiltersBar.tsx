"use client";

import {
  adminFilterInputClass,
  adminFilterLabelClass,
} from "@/lib/admin-ui";

type Category = { id: string; name: string };

type Props = {
  defaultQ: string;
  defaultStatus: string;
  defaultCategoryId: string;
  defaultPerPage: number;
  lowStockMax: number;
  categories: Category[];
  /** Conserva el modal de categorías abierto al aplicar filtros. */
  categoriesModalOpen?: boolean;
};

export function ProductFiltersBar({
  defaultQ,
  defaultStatus,
  defaultCategoryId,
  defaultPerPage,
  lowStockMax,
  categories,
  categoriesModalOpen = false,
}: Props) {
  return (
    <form
      method="get"
      action="/admin/products"
      className="grid gap-2 sm:grid-cols-2 lg:grid-cols-12 lg:items-end lg:gap-3"
    >
      {categoriesModalOpen ? (
        <input type="hidden" name="categories" value="1" />
      ) : null}
      <input type="hidden" name="page" value="1" />
      <input type="hidden" name="per_page" value={String(defaultPerPage)} />
      <div className="min-w-0 sm:col-span-2 lg:col-span-5">
        <label htmlFor="q" className={adminFilterLabelClass}>
          Nombre / código
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={defaultQ}
          placeholder="Buscar…"
          enterKeyHint="search"
          className={adminFilterInputClass}
          autoComplete="off"
        />
      </div>
      <div className="min-w-0 lg:col-span-3">
        <label htmlFor="status" className={adminFilterLabelClass}>
          Estado
        </label>
        <select
          id="status"
          name="status"
          defaultValue={defaultStatus}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className={adminFilterInputClass}
        >
          <option value="all">Todos</option>
          <option value="active">Publicados</option>
          <option value="draft">Borradores</option>
          <option value="low">Stock bajo (1–{lowStockMax})</option>
          <option value="out">Sin stock</option>
        </select>
      </div>
      <div className="min-w-0 sm:col-span-2 lg:col-span-4">
        <label htmlFor="category_id" className={adminFilterLabelClass}>
          Categoría
        </label>
        <select
          id="category_id"
          name="category_id"
          defaultValue={defaultCategoryId}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className={adminFilterInputClass}
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
}
