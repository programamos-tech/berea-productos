"use client";

import { signOutAdmin } from "@/app/actions/admin/auth";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type Props = {
  displayName: string;
  email: string;
  /** Avatar renderizado en el servidor (p. ej. `AdminUserAvatar`). */
  avatar: ReactNode;
};

export function AdminUserMenu({ displayName, email, avatar }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="ml-1 flex min-w-0 select-none items-center gap-2.5 rounded-xl bg-transparent py-1 pl-2 pr-1 text-left outline-none ring-0 ring-offset-0 [-webkit-tap-highlight-color:transparent] [-webkit-user-select:none] [caret-color:transparent] transition-opacity hover:bg-transparent dark:hover:bg-transparent active:opacity-90 focus:outline-none focus-visible:outline-none"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <div className="hidden min-w-0 lg:block">
          <p className="truncate text-sm font-semibold text-stone-900 dark:text-zinc-100">
            {displayName}
          </p>
          <p
            className="truncate text-[11px] font-medium text-stone-500 dark:text-zinc-400"
            title={email || undefined}
          >
            {email || "—"}
          </p>
        </div>
        {avatar}
        <span
          className={`hidden shrink-0 text-stone-400 transition-transform duration-200 dark:text-zinc-500 lg:inline ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open ? (
        <div
          id="admin-logout-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-logout-title"
          className="absolute right-0 top-full z-[100] mt-2 w-[min(18rem,calc(100vw-2rem))] origin-top-right rounded-2xl border border-[color-mix(in_srgb,var(--admin-coral)_28%,transparent)] bg-white p-4 shadow-[0_16px_48px_-16px_color-mix(in_srgb,var(--admin-coral-deep)_22%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--admin-coral-deep)_8%,transparent)] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_16px_48px_-16px_rgba(0,0,0,0.45)] dark:ring-white/[0.06] sm:w-80 sm:p-5"
        >
          <Link
            href="/admin/cuenta"
            onClick={() => setOpen(false)}
            className="block rounded-xl border border-[color-mix(in_srgb,var(--admin-coral)_32%,transparent)] bg-[var(--admin-coral-mist)]/50 px-3.5 py-2.5 text-sm font-semibold text-[var(--admin-coral-deep)] transition hover:border-[color-mix(in_srgb,var(--admin-coral)_48%,transparent)] hover:bg-[var(--admin-coral-mist)] dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Mi cuenta
          </Link>
          <h2
            id="admin-logout-title"
            className="mt-4 text-base font-semibold text-[var(--admin-coral-deep)] dark:text-zinc-100"
          >
            Cerrar sesión
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-zinc-400">
            ¿Seguro que quieres salir? Vas a tener que volver a iniciar sesión.
          </p>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-[color-mix(in_srgb,var(--admin-coral)_32%,transparent)] bg-white px-3.5 py-2.5 text-sm font-semibold text-[var(--admin-coral-deep)] transition hover:border-[color-mix(in_srgb,var(--admin-coral)_48%,transparent)] hover:bg-[var(--admin-coral-mist)]/60 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              Cancelar
            </button>
            <form action={signOutAdmin} className="sm:inline">
              <button
                type="submit"
                className="w-full rounded-xl border border-[var(--admin-coral-deep)] bg-[var(--admin-coral-deep)] px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:border-[var(--admin-coral-hover)] hover:bg-[var(--admin-coral-hover)] sm:w-auto"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
