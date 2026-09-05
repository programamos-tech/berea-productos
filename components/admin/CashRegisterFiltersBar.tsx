"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminDateInput } from "@/components/admin/product-form-primitives";
import {
  adminFilterInputClass,
  adminFilterLabelClass,
} from "@/lib/admin-ui";

export type CajaStatusFilter = "all" | "open" | "closed";

function buildCajaQuery(
  pathname: string,
  patch: {
    q?: string;
    status?: CajaStatusFilter;
    from?: string;
    to?: string;
  },
  current: URLSearchParams,
) {
  const p = new URLSearchParams(current.toString());
  for (const [key, val] of Object.entries(patch)) {
    if (val === undefined) continue;
    const t = String(val).trim();
    if (!t || (key === "status" && t === "all")) p.delete(key);
    else p.set(key, t);
  }
  p.delete("page");
  // Keep operational query flags (error / preview) out of filter resets only when clearing page
  const qs = p.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

type Props = {
  initialQ: string;
  initialStatus: CajaStatusFilter;
  initialFrom: string;
  initialTo: string;
};

export function CashRegisterFiltersBar({
  initialQ,
  initialStatus,
  initialFrom,
  initialTo,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(initialQ);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const status = (searchParams.get("status") ?? initialStatus) as CajaStatusFilter;

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
    setFrom(searchParams.get("from") ?? "");
    setTo(searchParams.get("to") ?? "");
  }, [searchParams]);

  const pushQuery = useCallback(
    (patch: {
      q?: string;
      status?: CajaStatusFilter;
      from?: string;
      to?: string;
    }) => {
      router.replace(buildCajaQuery(pathname, patch, searchParams));
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

  const statusValue: CajaStatusFilter =
    status === "open" || status === "closed" ? status : "all";

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-12 lg:items-end lg:gap-3">
      <div className="min-w-0 sm:col-span-2 lg:col-span-4">
        <label htmlFor="caja-q" className={adminFilterLabelClass}>
          Buscar
        </label>
        <input
          id="caja-q"
          name="q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Día (AAAA-MM-DD) o nota…"
          className={adminFilterInputClass}
          autoComplete="off"
          aria-label="Buscar cierres por día o nota"
        />
      </div>
      <div className="min-w-0 lg:col-span-2">
        <label htmlFor="caja-status" className={adminFilterLabelClass}>
          Estado
        </label>
        <select
          id="caja-status"
          value={statusValue}
          onChange={(e) =>
            pushQuery({ status: e.target.value as CajaStatusFilter })
          }
          className={adminFilterInputClass}
          aria-label="Filtrar por estado de caja"
        >
          <option value="all">Todos</option>
          <option value="open">Abierta</option>
          <option value="closed">Cerrada</option>
        </select>
      </div>
      <div className="min-w-0 lg:col-span-3">
        <label htmlFor="caja-from" className={adminFilterLabelClass}>
          Desde
        </label>
        <AdminDateInput
          id="caja-from"
          name="from"
          value={from}
          allowEmpty
          emptyLabel="dd/mm/aaaa"
          className={adminFilterInputClass}
          onChange={(next) => {
            setFrom(next);
            pushQuery({ from: next });
          }}
        />
      </div>
      <div className="min-w-0 lg:col-span-3">
        <label htmlFor="caja-to" className={adminFilterLabelClass}>
          Hasta
        </label>
        <AdminDateInput
          id="caja-to"
          name="to"
          value={to}
          allowEmpty
          emptyLabel="dd/mm/aaaa"
          className={adminFilterInputClass}
          onChange={(next) => {
            setTo(next);
            pushQuery({ to: next });
          }}
        />
      </div>
    </div>
  );
}
