"use client";

import { switchBranchAction } from "@/app/actions/admin/branches";
import type { BranchRef } from "@/lib/branch-context";
import { MapPin } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRef } from "react";

export function BranchSwitcher({
  active,
  branches,
}: {
  active: BranchRef;
  branches: BranchRef[];
}) {
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);

  if (branches.length <= 1) {
    return (
      <div className="hidden items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 sm:flex dark:border-zinc-700 dark:text-zinc-200">
        <MapPin className="size-3.5" aria-hidden />
        <span className="max-w-32 truncate">{active.name}</span>
      </div>
    );
  }

  return (
    <form ref={formRef} action={switchBranchAction} className="shrink-0">
      <input type="hidden" name="return_to" value={pathname} />
      <label className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
        <MapPin className="size-3.5 shrink-0" aria-hidden />
        <span className="sr-only">Sucursal activa</span>
        <select
          name="branch_id"
          value={active.id}
          onChange={() => formRef.current?.requestSubmit()}
          className="max-w-28 bg-transparent outline-none sm:max-w-40"
          aria-label="Sucursal activa"
        >
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
