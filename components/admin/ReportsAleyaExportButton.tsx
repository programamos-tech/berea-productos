"use client";

import { useEffect, useRef, useState } from "react";

function mayOfYearFromYm(ym: string): string {
  const y = ym.slice(0, 4);
  return /^\d{4}$/.test(y) ? `${y}-05` : "2026-05";
}

export function ReportsAleyaExportButton({
  defaultYearMonth,
}: {
  defaultYearMonth: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [fromMonth, setFromMonth] = useState(() =>
    mayOfYearFromYm(defaultYearMonth),
  );
  const [toMonth, setToMonth] = useState(defaultYearMonth);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setToMonth(defaultYearMonth);
    setFromMonth((prev) => {
      const may = mayOfYearFromYm(defaultYearMonth);
      // Si el “hasta” sigue en el mismo año que mayo sugerido, mantener mayo como desde.
      if (prev.slice(0, 4) === defaultYearMonth.slice(0, 4)) return may;
      return may;
    });
  }, [defaultYearMonth]);

  useEffect(() => {
    if (!open) return;
    const onDown = (ev: MouseEvent) => {
      if (!wrapRef.current?.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  async function handleExport() {
    if (!fromMonth || !toMonth) return;
    const from = fromMonth <= toMonth ? fromMonth : toMonth;
    const to = fromMonth <= toMonth ? toMonth : fromMonth;
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to });
      const res = await fetch(
        `/api/admin/reports/aleya-export?${params.toString()}`,
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
      const filename =
        match?.[1] ??
        (from === to
          ? `ventas-aleya-${from}.csv`
          : `ventas-aleya-${from}_a_${to}.csv`);
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
      setLoading(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-red-200/70 bg-white px-2.5 py-1.5 text-xs font-medium text-red-950 shadow-[0_1px_2px_0_rgb(220_38_38/0.06)] transition hover:border-red-300/80 hover:bg-red-50/50 disabled:cursor-wait disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:shadow-none dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4 shrink-0 text-red-900/50 dark:text-zinc-400"
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
          className="absolute right-0 top-[calc(100%+0.35rem)] z-40 w-[min(100vw-1.5rem,20rem)] rounded-xl border border-red-200/60 bg-white p-4 shadow-[0_16px_48px_-24px_rgba(220,38,38,0.18)] dark:border-zinc-700 dark:bg-zinc-900"
          role="dialog"
          aria-label="Exportar ventas mensuales"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400 dark:text-zinc-500">
            Periodo a exportar
          </p>
          <p className="mt-1 text-xs leading-relaxed text-stone-500 dark:text-zinc-400">
            <span className="font-medium text-stone-600 dark:text-zinc-300">
              VENTA TOTAL
            </span>{" "}
            es lo cobrado (descuentos POS, mayorista y cupones). También incluye
            venta a precio de lista y la columna DESCUENTO.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[10px] font-medium uppercase tracking-wide text-stone-400 dark:text-zinc-500">
                Desde
              </span>
              <input
                type="month"
                value={fromMonth}
                onChange={(e) => setFromMonth(e.target.value)}
                className="mt-1 w-full rounded-lg border border-red-200/70 bg-white px-2.5 py-2 text-sm text-red-950 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-medium uppercase tracking-wide text-stone-400 dark:text-zinc-500">
                Hasta
              </span>
              <input
                type="month"
                value={toMonth}
                onChange={(e) => setToMonth(e.target.value)}
                className="mt-1 w-full rounded-lg border border-red-200/70 bg-white px-2.5 py-2 text-sm text-red-950 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => {
              setFromMonth(mayOfYearFromYm(defaultYearMonth));
              setToMonth(defaultYearMonth);
            }}
            className="mt-2 text-left text-[11px] font-medium text-red-800/80 underline-offset-2 hover:underline dark:text-zinc-300"
          >
            Usar mayo → mes actual
          </button>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={loading || !fromMonth || !toMonth}
            className="mt-3 w-full rounded-lg bg-red-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-red-900 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
          >
            {loading ? "Generando…" : "Descargar CSV"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
