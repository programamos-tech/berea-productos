"use client";

import { RefreshCw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  adminFilterInputClass,
  adminFilterLabelClass,
  adminToolbarIconBtnClass,
} from "@/lib/admin-ui";
import type { CreditListFilter } from "@/lib/admin-order-credits";

function IconSearch() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="pointer-events-none size-4 text-zinc-400 dark:text-zinc-500"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" strokeLinecap="round" />
    </svg>
  );
}

function buildQuery(
  pathname: string,
  next: { q?: string; estado?: CreditListFilter },
  current: URLSearchParams,
) {
  const p = new URLSearchParams(current.toString());
  if (next.q !== undefined) {
    if (next.q.trim()) p.set("q", next.q.trim());
    else p.delete("q");
  }
  if (next.estado !== undefined) {
    if (next.estado === "pending") p.delete("estado");
    else p.set("estado", next.estado);
  }
  const qs = p.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

type Props = {
  initialQ: string;
};

export function CreditosFiltersBar({ initialQ }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(initialQ);
  const estado = (searchParams.get("estado") ?? "pending") as CreditListFilter;

  /* eslint-disable react-hooks/set-state-in-effect -- sincronizar con la URL (atrás/adelante), mismo patrón que ventas */
  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const pushQuery = useCallback(
    (patch: { q?: string; estado?: CreditListFilter }) => {
      router.replace(buildQuery(pathname, patch, searchParams));
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      const urlQ = searchParams.get("q") ?? "";
      if (q.trim() === urlQ.trim()) return;
      pushQuery({ q });
    }, 380);
    return () => clearTimeout(t);
  }, [q, pushQuery, searchParams]);

  const estadoValue: CreditListFilter =
    estado === "paid" || estado === "cancelled" || estado === "all"
      ? estado
      : "pending";

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-12 lg:items-end lg:gap-3">
      <div className="relative min-w-0 sm:col-span-2 lg:col-span-8">
        <label htmlFor="creditos-q" className={adminFilterLabelClass}>
          Buscar
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
            <IconSearch />
          </span>
          <input
            id="creditos-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cliente, factura…"
            className={`${adminFilterInputClass} pl-8`}
            autoComplete="off"
            aria-label="Buscar por cliente o factura"
          />
        </div>
      </div>
      <div className="min-w-0 sm:col-span-2 lg:col-span-4">
        <label htmlFor="creditos-estado" className={adminFilterLabelClass}>
          Estado
        </label>
        <select
          id="creditos-estado"
          value={estadoValue}
          onChange={(e) =>
            pushQuery({ estado: e.target.value as CreditListFilter })
          }
          className={adminFilterInputClass}
        >
          <option value="pending">Pendientes</option>
          <option value="paid">Pagadas</option>
          <option value="cancelled">Anuladas</option>
          <option value="all">Todas</option>
        </select>
      </div>
    </div>
  );
}

export function CreditosRefreshButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className={adminToolbarIconBtnClass}
      aria-label="Actualizar créditos"
      title="Actualizar"
    >
      <RefreshCw className="size-4 shrink-0" strokeWidth={2.25} aria-hidden />
    </button>
  );
}
