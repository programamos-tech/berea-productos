"use client";

import { useFormStatus } from "react-dom";
import { updateHigherSalePriceAction } from "@/app/actions/admin/platform-settings";

function HigherPriceSwitch({
  enabled,
  canEdit,
}: {
  enabled: boolean;
  canEdit: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      role="switch"
      aria-checked={enabled}
      aria-label={`Precio mayor en la factura: ${enabled ? "encendido" : "apagado"}`}
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

export function HigherSalePriceSettings({
  enabled,
  canEdit,
}: {
  enabled: boolean;
  canEdit: boolean;
}) {
  return (
    <form action={updateHigherSalePriceAction} className="flex items-start justify-between gap-4">
      <input type="hidden" name="enabled" value={enabled ? "0" : "1"} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Precio mayor en la factura
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Si lo enciendes, en la factura se puede cobrar más que el precio del catálogo.
          Ese monto ya incluye el IVA: el sistema parte la base y el 19 % desde lo cobrado,
          sin sumar otro 19 % encima. Si el producto no maneja IVA, lo escrito es el total.
        </p>
      </div>
      <HigherPriceSwitch enabled={enabled} canEdit={canEdit} />
    </form>
  );
}
