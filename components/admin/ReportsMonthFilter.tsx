"use client";

import {
  prettyYearMonthLabel,
  recentYearMonthsInclusive,
} from "@/lib/admin-report-range";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const panelClass =
  "absolute left-0 right-0 top-[calc(100%+0.35rem)] z-40 w-full rounded-xl border border-zinc-200 bg-white p-2 shadow-[0_16px_48px_-24px_rgba(24,24,27,0.22)] sm:left-auto sm:right-0 sm:w-[min(100vw-1.5rem,16rem)] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_16px_48px_-24px_rgba(0,0,0,0.55)]";

function sentenceCase(label: string): string {
  const t = label.trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function ReportsMonthFilter({
  selectedYm,
  currentYm,
  monthsBack = 12,
}: {
  selectedYm: string;
  currentYm: string;
  monthsBack?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const months = useMemo(
    () => recentYearMonthsInclusive(currentYm, Math.max(1, monthsBack)),
    [currentYm, monthsBack],
  );

  useEffect(() => {
    if (!open) return;
    const onDown = (ev: MouseEvent) => {
      if (!wrapRef.current?.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function selectMonth(ym: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("vista");
    params.delete("from");
    params.delete("to");
    if (ym === currentYm) {
      params.delete("mes");
    } else {
      params.set("mes", ym);
    }
    const qs = params.toString();
    router.push(qs ? `/admin?${qs}` : "/admin");
    setOpen(false);
  }

  const summary =
    selectedYm === currentYm
      ? `${sentenceCase(prettyYearMonthLabel(selectedYm))} · hasta hoy`
      : sentenceCase(prettyYearMonthLabel(selectedYm));

  return (
    <div ref={wrapRef} className="relative max-w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 max-w-full items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:shadow-none dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="min-w-0 truncate tabular-nums">{summary}</span>
        <svg
          viewBox="0 0 24 24"
          className={`size-4 shrink-0 text-zinc-400 transition dark:text-zinc-400 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div className={panelClass} role="listbox" aria-label="Mes de la tienda">
          <ul className="max-h-[min(20rem,50vh)] overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {months.map((ym) => {
              const active = ym === selectedYm;
              const label =
                ym === currentYm
                  ? `${sentenceCase(prettyYearMonthLabel(ym))} · hasta hoy`
                  : sentenceCase(prettyYearMonthLabel(ym));
              return (
                <li key={ym}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => selectMonth(ym)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                      active
                        ? "bg-zinc-900 font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "font-medium text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
