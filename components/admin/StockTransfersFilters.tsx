"use client";

import { Search } from "lucide-react";
import { adminFilterInputClass } from "@/lib/admin-ui";

type Props = {
  q: string;
  status: string;
};

export function StockTransfersFilters({ q, status }: Props) {
  return (
    <form action="/admin/traslados" className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">Buscar traslados</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
          strokeWidth={2}
          aria-hidden
        />
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por código o sucursal..."
          className={`${adminFilterInputClass} pl-9`}
        />
      </label>
      <select
        name="status"
        defaultValue={status}
        aria-label="Estado"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className={`${adminFilterInputClass} sm:w-52`}
      >
        <option value="all">Todos los estados</option>
        <option value="in_transit">En camino</option>
        <option value="received">Recibido</option>
        <option value="cancelled">Anulado</option>
      </select>
    </form>
  );
}
