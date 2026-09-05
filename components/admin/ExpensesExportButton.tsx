"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const MONTH_LABELS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

function parseYm(ym: string): { y: number; m: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(ym.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (!Number.isFinite(y) || mo < 1 || mo > 12) return null;
  return { y, m: mo };
}

function formatYm(y: number, m: number): string {
  return `${y}-${String(m).padStart(2, "0")}`;
}

function labelYm(ym: string): string {
  const p = parseYm(ym);
  if (!p) return ym;
  return `${MONTH_LABELS[p.m - 1]} ${p.y}`;
}

/** Meses desde mayo del año (o ene) hasta `endYm`, más reciente arriba. */
function monthListEndingAt(endYm: string): string[] {
  const end = parseYm(endYm);
  if (!end) return endYm ? [endYm] : [];
  const startM = end.m >= 5 ? 5 : 1;
  const out: string[] = [];
  for (let m = startM; m <= end.m; m++) {
    out.push(formatYm(end.y, m));
  }
  return out.reverse();
}

export function ExpensesExportButton({
  defaultYearMonth,
}: {
  defaultYearMonth: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loadingYm, setLoadingYm] = useState<string | null>(null);

  const months = useMemo(
    () => monthListEndingAt(defaultYearMonth),
    [defaultYearMonth],
  );

  useEffect(() => {
    if (!open) return;
    const onDown = (ev: MouseEvent) => {
      if (!wrapRef.current?.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  async function handleExportMonth(ym: string) {
    setLoadingYm(ym);
    try {
      const res = await fetch(
        `/api/admin/expenses/export?month=${encodeURIComponent(ym)}`,
      );
      if (!res.ok) {
        let message = "No se pudo exportar.";
        try {
          const body = (await res.json()) as { error?: string };
          if (body.error) message = body.error;
        } catch {
          /* ignore */
        }
        window.alert(message);
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `egresos-${ym}.csv`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch {
      window.alert("Error de red al exportar. Probá de nuevo.");
    } finally {
      setLoadingYm(null);
    }
  }

  const busy = loadingYm != null;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className="inline-flex h-10 max-w-full items-center gap-2 rounded-lg border border-[color-mix(in_srgb,var(--admin-coral)_35%,transparent)] bg-white px-3 text-sm font-medium text-[var(--admin-coral-deep)] shadow-sm transition hover:border-[color-mix(in_srgb,var(--admin-coral)_55%,transparent)] hover:bg-[var(--admin-coral-mist)] disabled:cursor-wait disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:shadow-none dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4 shrink-0 text-[var(--admin-coral)]/70 dark:text-zinc-400"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            d="M12 3v12m0 0l4-4m-4 4L8 11M4 19h16"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Exportar CSV
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+0.35rem)] z-40 w-[min(100vw-1.5rem,16rem)] overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--admin-coral)_28%,transparent)] bg-white shadow-[0_16px_48px_-24px_color-mix(in_srgb,var(--admin-coral-deep)_28%,transparent)] dark:border-zinc-700 dark:bg-zinc-900"
          role="dialog"
          aria-label="Exportar egresos por mes"
        >
          <p className="border-b border-[color-mix(in_srgb,var(--admin-coral)_18%,transparent)] px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--admin-coral-deep)]/50 dark:border-zinc-700 dark:text-zinc-500">
            Mes a exportar
          </p>
          <ul className="max-h-64 overflow-y-auto py-1">
            {months.map((ym) => {
              const loading = loadingYm === ym;
              return (
                <li key={ym}>
                  <button
                    type="button"
                    onClick={() => void handleExportMonth(ym)}
                    disabled={busy}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-[var(--admin-coral-deep)] transition hover:bg-[var(--admin-coral-mist)] disabled:opacity-60 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <span>{labelYm(ym)}</span>
                    {loading ? (
                      <span className="text-[11px] font-semibold text-[var(--admin-coral)]">
                        …
                      </span>
                    ) : null}
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
