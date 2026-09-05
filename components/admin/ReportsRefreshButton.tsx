"use client";

import { RefreshCw } from "lucide-react";
import { adminToolbarIconBtnClass } from "@/lib/admin-ui";
import { useRouter } from "next/navigation";

export function ReportsRefreshButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className={adminToolbarIconBtnClass}
      aria-label="Actualizar reportes"
      title="Actualizar"
    >
      <RefreshCw className="size-4 shrink-0" strokeWidth={2.25} aria-hidden />
    </button>
  );
}
