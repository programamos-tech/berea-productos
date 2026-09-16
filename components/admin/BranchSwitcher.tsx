"use client";

import { switchBranchAction } from "@/app/actions/admin/branches";
import type { BranchRef } from "@/lib/branch-context";
import {
  shouldUnoptimizeStorageImageUrl,
  storagePublicObjectUrl,
} from "@/lib/storage-public-url";
import { Check, ChevronDown, MapPin } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

function BranchOptionMark({ branch }: { branch: BranchRef }) {
  const logoUrl = storagePublicObjectUrl(branch.logoPath);
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt=""
        width={28}
        height={28}
        unoptimized={shouldUnoptimizeStorageImageUrl(logoUrl)}
        className="size-7 shrink-0 rounded-md border border-zinc-200 bg-white object-cover dark:border-zinc-700"
      />
    );
  }
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
      {branch.name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

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
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const bare = appearance === "bare";

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!formRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

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
      className={`relative shrink-0 ${className}`}
    >
      <input type="hidden" name="return_to" value={pathname} />
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className={`${bare ? "" : "rounded-lg border border-zinc-200 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"} flex w-full items-center gap-1.5 text-left text-xs font-medium text-zinc-700 outline-none transition hover:text-zinc-950 focus-visible:ring-2 focus-visible:ring-zinc-400/50 dark:text-zinc-200 dark:hover:text-white`}
      >
        {!bare ? <MapPin className="size-3.5 shrink-0" aria-hidden /> : null}
        <span className="min-w-0 flex-1 truncate">{active.name}</span>
        <ChevronDown
          className={`size-3.5 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Cambiar sucursal"
          className="absolute left-0 top-full z-[80] mt-1.5 w-full min-w-40 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-xl shadow-zinc-950/10 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/30"
        >
          {branches.map((branch) => (
            <button
              key={branch.id}
              type={branch.id === active.id ? "button" : "submit"}
              name={branch.id === active.id ? undefined : "branch_id"}
              value={branch.id === active.id ? undefined : branch.id}
              role="menuitemradio"
              aria-checked={branch.id === active.id}
              onClick={() => setOpen(false)}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-zinc-400/50 ${
                branch.id === active.id
                  ? "bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800/70 dark:hover:text-white"
              }`}
            >
              <BranchOptionMark branch={branch} />
              <span className="min-w-0 flex-1 truncate">{branch.name}</span>
              {branch.id === active.id ? (
                <Check className="size-3.5 shrink-0" aria-hidden />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </form>
  );
}
