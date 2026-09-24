"use client";

import { useFormStatus } from "react-dom";
import { updateProductCatalogFieldAction } from "@/app/actions/admin/platform-settings";
import {
  PRODUCT_CATALOG_FIELDS,
  type ProductCatalogFieldId,
  type ProductCatalogFields,
} from "@/lib/product-catalog-fields";

function FieldSwitch({
  enabled,
  label,
  canEdit,
}: {
  enabled: boolean;
  label: string;
  canEdit: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      role="switch"
      aria-checked={enabled}
      aria-label={`${label}: ${enabled ? "encendido" : "apagado"}`}
      disabled={!canEdit || pending}
      className={[
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition",
        enabled
          ? "border-zinc-900 bg-zinc-900 dark:border-zinc-100 dark:bg-zinc-100"
          : "border-zinc-300 bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800",
        !canEdit || pending ? "cursor-not-allowed opacity-60" : "",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block size-5 rounded-full bg-white shadow-sm transition dark:bg-zinc-950",
          enabled ? "translate-x-6" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}

export function ProductCatalogFieldSettings({
  fields,
  canEdit,
}: {
  fields: ProductCatalogFields;
  canEdit: boolean;
}) {
  return (
    <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {PRODUCT_CATALOG_FIELDS.map((field) => (
        <li key={field.id} className="py-3 first:pt-0 last:pb-0">
          <CatalogFieldRow
            id={field.id}
            label={field.label}
            enabled={fields[field.id]}
            canEdit={canEdit}
          />
        </li>
      ))}
    </ul>
  );
}

function CatalogFieldRow({
  id,
  label,
  enabled,
  canEdit,
}: {
  id: ProductCatalogFieldId;
  label: string;
  enabled: boolean;
  canEdit: boolean;
}) {
  return (
    <form
      action={updateProductCatalogFieldAction}
      className="flex items-center justify-between gap-4"
    >
      <input type="hidden" name="field_id" value={id} />
      <input type="hidden" name="enabled" value={enabled ? "0" : "1"} />
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {label}
      </p>
      <FieldSwitch enabled={enabled} label={label} canEdit={canEdit} />
    </form>
  );
}
