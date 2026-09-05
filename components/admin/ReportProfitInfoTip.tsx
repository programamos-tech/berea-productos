"use client";

import { Info } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatCop } from "@/lib/money";

type Pos = { top: number; left: number; maxWidth: number };

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
  const [pos, setPos] = useState<Pos | null>(null);
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const tipId = useId();
  const isLoss = resultadoCents < 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) {
      setPos(null);
      return;
    }
    const place = () => {
      const r = btnRef.current!.getBoundingClientRect();
      const pad = 12;
      const maxWidth = Math.min(296, window.innerWidth - pad * 2);
      let left = r.left;
      if (left + maxWidth > window.innerWidth - pad) {
        left = Math.max(pad, window.innerWidth - pad - maxWidth);
      }
      setPos({
        top: r.bottom + 8,
        left,
        maxWidth,
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (ev: MouseEvent) => {
      const t = ev.target as Node;
      if (btnRef.current?.contains(t) || tipRef.current?.contains(t)) return;
      setOpen(false);
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

  const panel =
    open && pos && mounted
      ? createPortal(
          <div
            ref={tipRef}
            id={tipId}
            role="tooltip"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: pos.maxWidth,
              zIndex: 10000,
            }}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-left text-[11px] font-normal normal-case leading-snug tracking-normal text-zinc-600 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.45)] dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
          >
            {mode === "neta" ? (
              <>
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  Margen de lo vendido − egresos del mes
                </p>
                <p className="mt-1.5">
                  El margen es precio sin IVA menos el costo del producto. No es
                  el total de ingresos ni lo que hay en caja o en cuentas.
                </p>
                <p className="mt-2 tabular-nums text-zinc-500 dark:text-zinc-400">
                  Margen {formatCop(margenCents)} − egresos{" "}
                  {formatCop(egresosCents)} ={" "}
                  <span
                    className={
                      isLoss
                        ? "font-semibold text-red-600 dark:text-red-400"
                        : "font-semibold text-emerald-600 dark:text-emerald-400"
                    }
                  >
                    {isLoss ? "pérdida" : "ganancia"}{" "}
                    {formatCop(Math.abs(resultadoCents))}
                  </span>
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  Margen de productos del periodo
                </p>
                <p className="mt-1.5">
                  Precio sin IVA menos el costo. Acá no se restan egresos; para
                  ver eso usá «Cómo va la tienda».
                </p>
                <p className="mt-2 tabular-nums text-zinc-500 dark:text-zinc-400">
                  Margen {formatCop(margenCents)}
                </p>
              </>
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="inline-flex size-4 shrink-0 items-center justify-center rounded-full normal-case tracking-normal text-zinc-400 transition hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
        aria-expanded={open}
        aria-controls={tipId}
        aria-label="Qué significa este número"
        onClick={() => setOpen((v) => !v)}
      >
        <Info className="size-3" strokeWidth={2.25} aria-hidden />
      </button>
      {panel}
    </>
  );
}
