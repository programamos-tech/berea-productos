"use client";

import Link from "next/link";
import { Eye, Package, Pencil } from "lucide-react";
import { useState } from "react";
import { UpdateProductStockModal } from "@/components/admin/UpdateProductStockModal";

const actionBtnClass =
  "inline-flex size-8 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

const actionIconClass = "size-4 shrink-0";

type Props = {
  productId: string;
  productName: string;
  referenceLabel: string;
  stockLocal: number;
  canEdit: boolean;
  canStock: boolean;
  /** URL del listado (con filtros) para volver tras guardar. */
  returnTo: string;
};

export function ProductTableActions({
  productId,
  productName,
  referenceLabel,
  stockLocal,
  canEdit,
  canStock,
  returnTo,
}: Props) {
  const [stockOpen, setStockOpen] = useState(false);

  return (
    <div className="flex shrink-0 flex-nowrap items-center justify-end gap-0.5">
      <Link
        href={`/admin/products/${productId}`}
        className={actionBtnClass}
        title="Ver detalle del producto"
        aria-label="Ver detalle"
      >
        <Eye className={actionIconClass} strokeWidth={1.75} aria-hidden />
      </Link>
      {canEdit ? (
        <Link
          href={`/admin/products/${productId}/edit`}
          className={actionBtnClass}
          title="Editar producto"
          aria-label="Editar"
        >
          <Pencil className={actionIconClass} strokeWidth={1.75} aria-hidden />
        </Link>
      ) : null}
      {canStock ? (
        <>
          <button
            type="button"
            onClick={() => setStockOpen(true)}
            className={actionBtnClass}
            title="Actualizar stock del punto"
            aria-label="Actualizar stock"
          >
            <Package className={actionIconClass} strokeWidth={1.75} aria-hidden />
          </button>
          <UpdateProductStockModal
            open={stockOpen}
            onClose={() => setStockOpen(false)}
            productId={productId}
            productName={productName}
            referenceLabel={referenceLabel}
            stockLocal={stockLocal}
            returnTo={returnTo}
          />
        </>
      ) : null}
    </div>
  );
}
