"use client";

import { Info } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { formatCop } from "@/lib/money";

export function ReportProfitInfoTip({
  mode,
  margenCents,
  egresosCents,
  resultadoCents,
}: {
  mode: "neta" | "bruta";
  margenCents: number;
  egresosCents: number;
  resultadoCents: number;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const tipId = useId();
  const isLoss = resultadoCents < 0;

  useEffect(() => {
    if (!open) return;
    const onDown = (ev: MouseEvent) => {
      if (!wrapRef.current?.contains(ev.target as Node)) setOpen(false);
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={wrapRef} className="relative inline-flex">
      <button
        type="button"
        className="inline-flex size-4 items-center justify-center rounded-full text-zinc-400 transition hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
        aria-expanded={open}
        aria-controls={tipId}
        aria-label="Qué significa este número"
        onClick={() => setOpen((v) => !v)}
      >
        <Info className="size-3" strokeWidth={2.25} aria-hidden />
      </button>

      {open ? (
        <span
          id={tipId}
          role="tooltip"
          className="absolute left-0 top-[calc(100%+0.4rem)] z-40 w-[min(18.5rem,calc(100vw-2rem))] rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-left text-[11px] leading-snug text-zinc-600 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.35)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.7)]"
        >
          {mode === "neta" ? (
            <>
              <span className="block font-medium text-zinc-800 dark:text-zinc-100">
                Margen de lo vendido − egresos del mes
              </span>
              <span className="mt-1.5 block">
                El margen es precio sin IVA menos el costo del producto. No es
                el total de ingresos ni lo que hay en caja o en cuentas.
              </span>
              <span className="mt-2 block tabular-nums text-zinc-500 dark:text-zinc-400">
                Margen {formatCop(margenCents)} − egresos{" "}
                {formatCop(egresosCents)} ={" "}
                <span
                  className={
                    isLoss
                      ? "font-medium text-red-600 dark:text-red-400"
                      : "font-medium text-emerald-600 dark:text-emerald-400"
                  }
                >
                  {isLoss ? "pérdida" : "ganancia"}{" "}
                  {formatCop(Math.abs(resultadoCents))}
                </span>
              </span>
            </>
          ) : (
            <>
              <span className="block font-medium text-zinc-800 dark:text-zinc-100">
                Margen de productos del periodo
              </span>
              <span className="mt-1.5 block">
                Precio sin IVA menos el costo. Acá no se restan egresos; para
                ver eso usá «Cómo va la tienda».
              </span>
              <span className="mt-2 block tabular-nums text-zinc-500 dark:text-zinc-400">
                Margen {formatCop(margenCents)}
              </span>
            </>
          )}
        </span>
      ) : null}
    </span>
  );
}
