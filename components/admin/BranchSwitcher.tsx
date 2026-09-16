"use client";

import { switchBranchAction } from "@/app/actions/admin/branches";
import type { BranchRef } from "@/lib/branch-context";
import { MapPin } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRef } from "react";

export function BranchSwitcher({
  active,
  branches,
  className = "",
  appearance = "default",
}: {
  active: BranchRef;
  branches: BranchRef[];
  className?: string;
  appearance?: "default" | "bare";
}) {
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);
  const bare = appearance === "bare";

  if (branches.length <= 1) {
    return (
      <div
        className={`${bare ? "flex" : "hidden rounded-lg border border-zinc-200 px-2.5 py-1.5 sm:flex dark:border-zinc-700"} items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 ${className}`}
      >
        {!bare ? <MapPin className="size-3.5" aria-hidden /> : null}
        <span className="max-w-32 truncate">{active.name}</span>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={switchBranchAction}
      className={`shrink-0 ${className}`}
    >
      <input type="hidden" name="return_to" value={pathname} />
      <label
        className={`${bare ? "" : "rounded-lg border border-zinc-200 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"} flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200`}
      >
        {!bare ? <MapPin className="size-3.5 shrink-0" aria-hidden /> : null}
        <span className="sr-only">Sucursal activa</span>
        <select
          name="branch_id"
          value={active.id}
          onChange={() => formRef.current?.requestSubmit()}
          className={`${bare ? "w-full max-w-full" : "max-w-28 sm:max-w-40"} bg-transparent outline-none`}
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
