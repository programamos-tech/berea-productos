"use client";

import Link from "next/link";
import { useState } from "react";
import { ProductDeleteConfirmForm } from "@/components/admin/ProductDeleteConfirmForm";
import { UpdateProductStockModal } from "@/components/admin/UpdateProductStockModal";

const btnIcon =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800";

const btnIdle =
  "inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800";

const btnPrimary =
  "inline-flex items-center justify-center rounded-lg border border-[var(--admin-coral)] bg-[var(--admin-coral)] px-2.5 py-1.5 text-xs font-medium text-white transition hover:border-[var(--admin-coral-hover)] hover:bg-[var(--admin-coral-hover)]";

type Props = {
  productId: string;
  productName: string;
  referenceLabel: string;
  stockLocal: number;
};

export function AdminProductDetailToolbar({
  productId,
  productName,
  referenceLabel,
  stockLocal,
}: Props) {
  const [stockOpen, setStockOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Link
        href={`/admin/products/${productId}/edit`}
        className={btnPrimary}
        title="Editar producto"
      >
        Editar
      </Link>
      <button
        type="button"
        onClick={() => setStockOpen(true)}
        className={btnIdle}
        title="Actualizar stock del punto"
        aria-label="Actualizar stock"
      >
        Stock
      </button>
      <ProductDeleteConfirmForm
        productId={productId}
        productName={productName}
        variant="header"
      />
      <Link
        href="/admin/products"
        className={btnIcon}
        title="Volver al inventario"
        aria-label="Volver al inventario"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="size-4"
          aria-hidden
        >
          <path
            d="m15 18-6-6 6-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
      <UpdateProductStockModal
        open={stockOpen}
        onClose={() => setStockOpen(false)}
        productId={productId}
        productName={productName}
        referenceLabel={referenceLabel}
        stockLocal={stockLocal}
        returnTo={`/admin/products/${productId}`}
      />
    </div>
  );
}
