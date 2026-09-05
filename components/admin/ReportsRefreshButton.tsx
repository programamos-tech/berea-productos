"use client";

import { useRouter } from "next/navigation";

const btnClass =
  "rounded-lg border border-rose-200/70 bg-white px-2.5 py-1.5 text-xs text-rose-950/85 shadow-[0_1px_2px_0_rgb(190_24_93/0.06)] transition hover:border-rose-300/80 hover:bg-rose-50/50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:shadow-none dark:hover:border-zinc-600 dark:hover:bg-zinc-800";

export function ReportsRefreshButton() {
  const router = useRouter();
  return (
    <button type="button" onClick={() => router.refresh()} className={btnClass}>
      Actualizar
    </button>
  );
}
