"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  adminFilterInputClass,
  adminFilterLabelClass,
} from "@/lib/admin-ui";

export type CustomerKindFilter = "all" | "retail" | "wholesale";
/** Activos = última compra ≤ 90 días; inactivos = compraron antes; nunca = 0 compras. */
export type CustomerActivityFilter = "all" | "active" | "inactive" | "never";

function buildCustomersQuery(
  pathname: string,
  next: {
    q?: string;
    kind?: CustomerKindFilter;
    activity?: CustomerActivityFilter;
  },
  current: URLSearchParams,
) {
  const p = new URLSearchParams(current.toString());
  if (next.q !== undefined) {
    if (next.q.trim()) p.set("q", next.q.trim());
    else p.delete("q");
    p.delete("page");
  }
  if (next.kind !== undefined) {
    if (next.kind === "all") p.delete("kind");
    else p.set("kind", next.kind);
    p.delete("page");
  }
  if (next.activity !== undefined) {
    if (next.activity === "all") p.delete("activity");
    else p.set("activity", next.activity);
    p.delete("page");
  }
  const qs = p.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

type CustomersSearchBarProps = {
  initialQ: string;
  initialKind: CustomerKindFilter;
  initialActivity: CustomerActivityFilter;
};

export function CustomersSearchBar({
  initialQ,
  initialKind,
  initialActivity,
}: CustomersSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(initialQ);
  const [kind, setKind] = useState<CustomerKindFilter>(initialKind);
  const [activity, setActivity] =
    useState<CustomerActivityFilter>(initialActivity);

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
    const k = searchParams.get("kind");
    setKind(k === "wholesale" || k === "retail" ? k : "all");
    const a = searchParams.get("activity");
    setActivity(
      a === "active" || a === "inactive" || a === "never" ? a : "all",
    );
  }, [searchParams]);

  const pushQuery = useCallback(
    (patch: {
      q?: string;
      kind?: CustomerKindFilter;
      activity?: CustomerActivityFilter;
    }) => {
      router.replace(buildCustomersQuery(pathname, patch, searchParams));
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

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-12 lg:items-end lg:gap-3">
      <div className="min-w-0 sm:col-span-2 lg:col-span-5">
        <label htmlFor="customer-q" className={adminFilterLabelClass}>
          Buscar
        </label>
        <input
          id="customer-q"
          name="q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nombre, email, documento o teléfono…"
          className={adminFilterInputClass}
          autoComplete="off"
          aria-label="Buscar clientes"
        />
      </div>
      <div className="min-w-0 lg:col-span-3">
        <label htmlFor="customer-kind" className={adminFilterLabelClass}>
          Tipo
        </label>
        <select
          id="customer-kind"
          name="kind"
          value={kind}
          onChange={(e) => {
            const next = e.target.value as CustomerKindFilter;
            setKind(next);
            pushQuery({ kind: next });
          }}
          className={adminFilterInputClass}
          aria-label="Filtrar por tipo de cliente"
        >
          <option value="all">Todos</option>
          <option value="retail">Minorista</option>
          <option value="wholesale">Mayorista</option>
        </select>
      </div>
      <div className="min-w-0 lg:col-span-4">
        <label htmlFor="customer-activity" className={adminFilterLabelClass}>
          Actividad
        </label>
        <select
          id="customer-activity"
          name="activity"
          value={activity}
          onChange={(e) => {
            const next = e.target.value as CustomerActivityFilter;
            setActivity(next);
            pushQuery({ activity: next });
          }}
          className={adminFilterInputClass}
          aria-label="Filtrar por actividad de compra"
        >
          <option value="all">Todos</option>
          <option value="active">Activos (90 días)</option>
          <option value="inactive">Inactivos</option>
          <option value="never">Sin compras</option>
        </select>
      </div>
    </div>
  );
}
