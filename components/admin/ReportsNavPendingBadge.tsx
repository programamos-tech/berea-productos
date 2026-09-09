"use client";

import { LoaderCircle } from "lucide-react";
import { useReportsNavPending } from "@/components/admin/ReportsNavPending";

/** Indicador discreto junto a los filtros cuando cambia la vista / rango. */
export function ReportsNavPendingBadge() {
  const { isPending } = useReportsNavPending();
  if (!isPending) return null;
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-zinc-500"
      aria-live="polite"
    >
      <LoaderCircle
        className="size-3.5 animate-spin"
        strokeWidth={2.25}
        aria-hidden
      />
      Cargando…
    </span>
  );
}
