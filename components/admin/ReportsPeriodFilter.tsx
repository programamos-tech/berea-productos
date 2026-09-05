"use client";

import {
  AdminDateInput,
  ADMIN_DATE_PORTAL_SELECTOR,
} from "@/components/admin/product-form-primitives";
import { prettyReportPeriodLabel } from "@/lib/admin-report-range";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const panelClass =
  "absolute left-0 right-0 top-[calc(100%+0.35rem)] z-40 w-full rounded-xl border border-[color-mix(in_srgb,var(--admin-coral)_28%,transparent)] bg-white p-4 shadow-[0_16px_48px_-24px_color-mix(in_srgb,var(--admin-coral-deep)_28%,transparent)] sm:left-auto sm:right-0 sm:w-[min(100vw-1.5rem,22rem)] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_16px_48px_-24px_rgba(0,0,0,0.55)]";

const tabBtn =
  "flex-1 rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wide transition";

const outlineBtn =
  "w-full rounded-lg border border-[color-mix(in_srgb,var(--admin-coral)_35%,transparent)] bg-white px-3 py-2.5 text-sm font-semibold text-[var(--admin-coral-deep)] transition hover:bg-[var(--admin-coral-mist)] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800";

const primaryBtn =
  "w-full rounded-lg bg-[var(--admin-coral)] px-3 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[color-mix(in_srgb,var(--admin-coral-deep)_18%,transparent)] transition hover:bg-[var(--admin-coral-hover)] dark:shadow-none";

const labelClass =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--admin-coral-deep)]/45 dark:text-zinc-500";

export function ReportsPeriodFilter({
  rangeFrom,
  rangeTo,
  todayKey,
}: {
  rangeFrom: string;
  rangeTo: string;
  todayKey: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"day" | "range">("day");
  const [singleDay, setSingleDay] = useState(todayKey);
  const [from, setFrom] = useState(rangeFrom);
  const [to, setTo] = useState(rangeTo);

  useEffect(() => {
    setFrom(rangeFrom);
    setTo(rangeTo);
    setSingleDay(rangeFrom === rangeTo ? rangeFrom : todayKey);
  }, [rangeFrom, rangeTo, todayKey]);

  useEffect(() => {
    if (!open) return;
    const onDown = (ev: MouseEvent) => {
      const t = ev.target as HTMLElement | null;
      if (t?.closest?.(ADMIN_DATE_PORTAL_SELECTOR)) return;
      if (!wrapRef.current?.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const summary = useMemo(
    () => prettyReportPeriodLabel(rangeFrom, rangeTo, todayKey),
    [rangeFrom, rangeTo, todayKey],
  );

  function applyParams(nextFrom: string, nextTo: string) {
    let a = nextFrom;
    let b = nextTo;
    if (a > b) [a, b] = [b, a];
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", a);
    params.set("to", b);
    router.push(`/admin?${params.toString()}`);
    setOpen(false);
  }

  function applyToday() {
    applyParams(todayKey, todayKey);
  }

  return (
    <div ref={wrapRef} className="relative flex max-w-full flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 max-w-full items-center gap-2 rounded-lg border border-[color-mix(in_srgb,var(--admin-coral)_35%,transparent)] bg-white px-3 text-sm font-medium text-[var(--admin-coral-deep)] shadow-sm transition hover:border-[color-mix(in_srgb,var(--admin-coral)_55%,transparent)] hover:bg-[var(--admin-coral-mist)] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:shadow-none dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="min-w-0 truncate tabular-nums">{summary}</span>
        <svg
          viewBox="0 0 24 24"
          className={`size-4 shrink-0 text-[var(--admin-coral)]/55 transition dark:text-zinc-400 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div className={panelClass} role="dialog" aria-label="Filtro de periodo">
          <button type="button" onClick={applyToday} className={primaryBtn}>
            Solo hoy
          </button>

          <div className="mt-3 flex gap-1 rounded-lg bg-[var(--admin-coral-mist)] p-1 dark:bg-zinc-800/80">
            <button
              type="button"
              className={`${tabBtn} ${
                tab === "day"
                  ? "bg-white text-[var(--admin-coral-deep)] shadow-sm dark:bg-zinc-950 dark:text-zinc-100 dark:shadow-none"
                  : "text-[var(--admin-coral-deep)]/65 hover:text-[var(--admin-coral-deep)] dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
              onClick={() => setTab("day")}
            >
              Un día
            </button>
            <button
              type="button"
              className={`${tabBtn} ${
                tab === "range"
                  ? "bg-white text-[var(--admin-coral-deep)] shadow-sm dark:bg-zinc-950 dark:text-zinc-100 dark:shadow-none"
                  : "text-[var(--admin-coral-deep)]/65 hover:text-[var(--admin-coral-deep)] dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
              onClick={() => setTab("range")}
            >
              Rango
            </button>
          </div>

          {tab === "day" ? (
            <div className="mt-4 space-y-3">
              <p className={labelClass}>Día específico</p>
              <AdminDateInput
                name="report_day"
                value={singleDay}
                onChange={setSingleDay}
              />
              <button
                type="button"
                onClick={() => applyParams(singleDay, singleDay)}
                className={outlineBtn}
              >
                Aplicar
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div>
                <p className={`mb-1.5 ${labelClass}`}>Desde</p>
                <AdminDateInput
                  name="report_from"
                  value={from}
                  onChange={setFrom}
                />
              </div>
              <div>
                <p className={`mb-1.5 ${labelClass}`}>Hasta</p>
                <AdminDateInput name="report_to" value={to} onChange={setTo} />
              </div>
              <button
                type="button"
                onClick={() => applyParams(from, to)}
                className={outlineBtn}
              >
                Aplicar rango
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
