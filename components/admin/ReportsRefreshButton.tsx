"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

const btnClass =
  "inline-flex size-8 items-center justify-center rounded-lg border border-red-200/70 bg-white text-red-950/85 shadow-[0_1px_2px_0_rgb(220_38_38/0.06)] transition hover:border-red-300/80 hover:bg-red-50/50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:shadow-none dark:hover:border-zinc-600 dark:hover:bg-zinc-800";

export function ReportsRefreshButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className={btnClass}
      aria-label="Actualizar reportes"
      title="Actualizar"
    >
      <RefreshCw className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
    </button>
  );
}
