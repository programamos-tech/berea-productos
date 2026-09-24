"use client";

import { useState, useTransition } from "react";
import { updateKitsEnabledAction } from "@/app/actions/admin/platform-settings";

export function KitsModuleSettings({
  enabled,
  canEdit,
}: {
  enabled: boolean;
  canEdit: boolean;
}) {
  const [on, setOn] = useState(enabled);
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (!canEdit || pending) return;
    const next = !on;
    setOn(next);
    startTransition(async () => {
      const result = await updateKitsEnabledAction(next);
      if (!result.ok) setOn(!next);
    });
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Kits</p>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={`Kits: ${on ? "encendido" : "apagado"}`}
        disabled={!canEdit || pending}
        onClick={toggle}
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
    </div>
  );
}
