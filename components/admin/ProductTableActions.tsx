"use client";

import Link from "next/link";
import { useState } from "react";
import { UpdateProductStockModal } from "@/components/admin/UpdateProductStockModal";

const actionBtnClass =
  "inline-flex size-9 items-center justify-center rounded-lg text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-white";

function IconEye() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.1}
      className="size-5"
      aria-hidden
    >
      <path
        d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.5" />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.1}
      className="size-5"
      aria-hidden
    >
      <path
        d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBox() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.1}
      className="size-5 shrink-0"
      aria-hidden
    >
      <path d="M21 16V8l-9-5-9 5v8l9 5 9-5z" strokeLinejoin="round" />
      <path d="M3.3 7L12 12l8.7-5M12 22V12" strokeLinejoin="round" />
    </svg>
  );
}

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
    <div className="flex shrink-0 flex-nowrap items-center justify-end gap-1">
      <Link
        href={`/admin/products/${productId}`}
        className={actionBtnClass}
        title="Ver detalle del producto"
        aria-label="Ver detalle"
      >
        <IconEye />
      </Link>
      {canEdit ? (
        <Link
          href={`/admin/products/${productId}/edit`}
          className={actionBtnClass}
          title="Editar producto"
          aria-label="Editar"
        >
          <IconPencil />
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
            <IconBox />
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
