"use client";

import { RefreshCw } from "lucide-react";
import { adminToolbarIconBtnClass } from "@/lib/admin-ui";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function ReportsRefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => {
        if (pending) return;
        startTransition(() => {
          router.refresh();
        });
      }}
      disabled={pending}
      className={`${adminToolbarIconBtnClass} disabled:cursor-wait`}
      aria-label="Actualizar reportes"
      aria-busy={pending}
      title="Actualizar"
    >
      <RefreshCw
        className={`size-4 shrink-0 ${pending ? "animate-spin" : ""}`}
        strokeWidth={2.25}
        aria-hidden
      />
    </button>
  );
}
