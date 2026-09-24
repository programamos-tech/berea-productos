"use client";

import { useState, useTransition } from "react";
import { updateProductCatalogFieldAction } from "@/app/actions/admin/platform-settings";
import {
  PRODUCT_CATALOG_FIELDS,
  type ProductCatalogFields,
} from "@/lib/product-catalog-fields";

export function ProductCatalogFieldSettings({
  fields,
  canEdit,
}: {
  fields: ProductCatalogFields;
  canEdit: boolean;
}) {
  const [values, setValues] = useState(fields);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggle(id: keyof ProductCatalogFields) {
    if (!canEdit || pendingId) return;
    const next = !values[id];
    setValues((prev) => ({ ...prev, [id]: next }));
    setPendingId(id);
    startTransition(async () => {
      const result = await updateProductCatalogFieldAction(id, next);
      if (!result.ok) {
        setValues((prev) => ({ ...prev, [id]: !next }));
      }
      setPendingId(null);
    });
  }

  return (
    <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {PRODUCT_CATALOG_FIELDS.map((field) => {
        const on = values[field.id];
        const pending = pendingId === field.id;
        return (
          <li
            key={field.id}
            className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {field.label}
            </p>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-label={`${field.label}: ${on ? "encendido" : "apagado"}`}
              disabled={!canEdit || pending}
              onClick={() => toggle(field.id)}
              className={[
                "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors",
                on
                  ? "border-zinc-900 bg-zinc-900 dark:border-zinc-100 dark:bg-zinc-100"
                  : "border-zinc-300 bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800",
                !canEdit || pending ? "cursor-not-allowed opacity-60" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-block size-5 rounded-full bg-white shadow-sm transition-transform duration-200 dark:bg-zinc-950",
                  on ? "translate-x-6" : "translate-x-1",
                ].join(" ")}
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
