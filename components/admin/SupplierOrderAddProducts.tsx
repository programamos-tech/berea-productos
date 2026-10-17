"use client";

import { useEffect, useMemo, useState } from "react";
import { addSupplierInvoiceLinesAction } from "@/app/actions/admin/suppliers";
import { AdminFormSubmitButton, adminPrimarySubmitButtonClass } from "@/components/admin/AdminFormSubmitButton";
import {
  ProductMoneyInput,
  productInputClass as inputClass,
  productLabelClass as labelClass,
} from "@/components/admin/product-form-primitives";
import { formatCop } from "@/lib/money";
import { DEFAULT_SUPPLIER_VAT_BPS, supplierLineGrossCents, supplierLineNetCents } from "@/lib/supplier-invoices";

type ProductHit = {
  id: string;
  name: string;
  reference: string | null;
  price_cents: number;
  cost_cents?: number | null;
};

type DraftLine = {
  key: string;
  product: ProductHit;
  quantity: number;
  unitPriceCents: number;
};

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function SupplierOrderAddProducts({
  invoiceId,
  supplierId,
}: {
  invoiceId: string;
  supplierId: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debounced = useDebounced(query, 280);
  const [hits, setHits] = useState<ProductHit[]>([]);
  const [lines, setLines] = useState<DraftLine[]>([]);

  useEffect(() => {
    const q = debounced.trim();
    if (q.length < 1) {
      setHits([]);
      return;
    }
    let cancelled = false;
    void fetch(`/api/admin/products-search?q=${encodeURIComponent(q)}`)
      .then(async (r) => (r.ok ? r.json() : { products: [] }))
      .then((j: { products?: ProductHit[] }) => {
        if (!cancelled) setHits(j.products ?? []);
      })
      .catch(() => {
        if (!cancelled) setHits([]);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const payload = useMemo(
    () =>
      JSON.stringify({
        lines: lines.map((l) => ({
          productId: l.product.id,
          productName: l.product.name,
          quantity: l.quantity,
          unitPriceCents: l.unitPriceCents,
          vatRateBps: DEFAULT_SUPPLIER_VAT_BPS,
        })),
      }),
    [lines],
  );

  function addHit(product: ProductHit) {
    const cost = Math.floor(Number(product.cost_cents ?? 0));
    const unit = cost > 0 ? cost : Math.max(0, Math.floor(Number(product.price_cents ?? 0)));
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.product.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { key: crypto.randomUUID(), product, quantity: 1, unitPriceCents: unit }];
    });
    setQuery("");
    setHits([]);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-zinc-800 underline-offset-2 hover:underline dark:text-zinc-200"
      >
        Agregar productos
      </button>
    );
  }

  return (
    <form action={addSupplierInvoiceLinesAction} className="mt-4 space-y-3 border-t border-zinc-200/70 pt-4 dark:border-zinc-800">
      <input type="hidden" name="invoice_id" value={invoiceId} />
      <input type="hidden" name="supplier_id" value={supplierId} />
      <input type="hidden" name="payload" value={payload} readOnly />
      <div>
        <label htmlFor="add-product-q" className={labelClass}>
          Producto
        </label>
        <input
          id="add-product-q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o referencia…"
          className={inputClass}
          autoComplete="off"
        />
        {hits.length > 0 ? (
          <ul className="mt-1 max-h-48 overflow-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950">
            {hits.map((hit) => (
              <li key={hit.id}>
                <button
                  type="button"
                  onClick={() => addHit(hit)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <span className="min-w-0 truncate text-zinc-900 dark:text-zinc-100">{hit.name}</span>
                  {hit.reference ? (
                    <span className="shrink-0 font-mono text-xs text-zinc-500">{hit.reference}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {lines.length > 0 ? (
        <ul className="space-y-3">
          {lines.map((line) => {
            const gross = supplierLineGrossCents(
              supplierLineNetCents(line.quantity, line.unitPriceCents),
              DEFAULT_SUPPLIER_VAT_BPS,
            );
            return (
              <li key={line.key} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_5rem_9rem_auto] sm:items-end">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{line.product.name}</p>
                <label className="text-xs text-zinc-500">
                  Cant.
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((l) =>
                          l.key === line.key
                            ? { ...l, quantity: Math.max(1, Math.floor(Number(e.target.value) || 1)) }
                            : l,
                        ),
                      )
                    }
                    className={`${inputClass} mt-1`}
                  />
                </label>
                <div>
                  <p className="text-xs text-zinc-500">Costo unitario</p>
                  <div className="mt-1">
                    <ProductMoneyInput
                      name={`unit-${line.key}`}
                      value={line.unitPriceCents}
                      onChange={(n) =>
                        setLines((prev) => prev.map((l) => (l.key === line.key ? { ...l, unitPriceCents: n } : l)))
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 pb-2 sm:flex-col sm:items-end">
                  <span className="text-sm font-semibold tabular-nums">{formatCop(gross)}</span>
                  <button
                    type="button"
                    onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                    className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    Quitar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
      <p className="text-xs text-zinc-500">
        El total de la orden pasa a ser la suma de los productos. Cada uno queda surtido por este proveedor.
      </p>
      <div className="flex items-center gap-2">
        <AdminFormSubmitButton
          className={`${adminPrimarySubmitButtonClass} px-4 py-2.5`}
          disabled={lines.length === 0}
        >
          Guardar productos
        </AdminFormSubmitButton>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setLines([]);
          }}
          className="rounded-lg px-3 py-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
        >
          Cerrar
        </button>
      </div>
    </form>
  );
}
