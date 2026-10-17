"use client";

import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FirstSupplierModal } from "@/components/admin/FirstSupplierModal";
import {
  adminFilterInputClass,
  adminFilterLabelClass,
  adminToolbarBtnBaseClass,
  adminToolbarBtnIdleClass,
  adminToolbarIconBtnClass,
} from "@/lib/admin-ui";

export type SupplierDebtFilter = "all" | "balance" | "empty";

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
  next: { q?: string; estado?: SupplierDebtFilter },
  current: URLSearchParams,
) {
  const p = new URLSearchParams(current.toString());
  if (next.q !== undefined) {
    if (next.q.trim()) p.set("q", next.q.trim());
    else p.delete("q");
  }
  if (next.estado !== undefined) {
    if (next.estado === "all") p.delete("estado");
    else p.set("estado", next.estado);
  }
  const qs = p.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function ProveedoresFiltersBar({ initialQ }: { initialQ: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(initialQ);
  const estado = (searchParams.get("estado") ?? "all") as SupplierDebtFilter;

  /* eslint-disable react-hooks/set-state-in-effect -- sincronizar con la URL (atrás/adelante), mismo patrón que ventas */
  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const pushQuery = useCallback(
    (patch: { q?: string; estado?: SupplierDebtFilter }) => {
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

  const estadoValue: SupplierDebtFilter =
    estado === "balance" || estado === "empty" ? estado : "all";

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-12 lg:items-end lg:gap-3">
      <div className="relative min-w-0 sm:col-span-2 lg:col-span-8">
        <label htmlFor="proveedores-q" className={adminFilterLabelClass}>
          Buscar
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
            <IconSearch />
          </span>
          <input
            id="proveedores-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nombre, NIT, teléfono…"
            className={`${adminFilterInputClass} pl-8`}
            autoComplete="off"
            aria-label="Buscar proveedor"
          />
        </div>
      </div>
      <div className="min-w-0 sm:col-span-2 lg:col-span-4">
        <label htmlFor="proveedores-estado" className={adminFilterLabelClass}>
          Estado
        </label>
        <select
          id="proveedores-estado"
          value={estadoValue}
          onChange={(e) => pushQuery({ estado: e.target.value as SupplierDebtFilter })}
          className={adminFilterInputClass}
        >
          <option value="all">Todos</option>
          <option value="balance">Con saldo</option>
          <option value="empty">Sin órdenes</option>
        </select>
      </div>
    </div>
  );
}

const orderButtonClass =
  "inline-flex items-center justify-center rounded-lg border border-[var(--admin-coral)] bg-[var(--admin-coral)] px-3 py-2 text-sm font-semibold text-white transition hover:border-[var(--admin-coral-hover)] hover:bg-[var(--admin-coral-hover)]";

export function ProveedoresHeaderActions({
  needsSupplier,
  startOpen,
  supplierError,
}: {
  needsSupplier: boolean;
  startOpen: boolean;
  supplierError: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(startOpen);

  const closeModal = useCallback(() => {
    setOpen(false);
    if (!searchParams.get("crear") && !searchParams.get("error")) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("crear");
    next.delete("error");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, router, searchParams]);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Link
        href="/admin/proveedores/nuevo"
        className={`${adminToolbarBtnBaseClass} ${adminToolbarBtnIdleClass}`}
      >
        Nuevo proveedor
      </Link>
      {needsSupplier ? (
        <button type="button" onClick={() => setOpen(true)} className={orderButtonClass}>
          Nueva orden de compra
        </button>
      ) : (
        <Link href="/admin/proveedores/nueva-orden" className={orderButtonClass}>
          Nueva orden de compra
        </Link>
      )}
      <button
        type="button"
        onClick={() => router.refresh()}
        className={adminToolbarIconBtnClass}
        aria-label="Actualizar proveedores"
        title="Actualizar"
      >
        <RefreshCw className="size-4 shrink-0" strokeWidth={2.25} aria-hidden />
      </button>
      {open ? (
        <FirstSupplierModal
          returnTo="lista"
          dismissLabel="Ahora no"
          errorMessage={supplierError}
          onClose={closeModal}
        />
      ) : null}
    </div>
  );
}
