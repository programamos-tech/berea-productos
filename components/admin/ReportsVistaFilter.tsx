"use client";

import type { ReportVista } from "@/lib/admin-report-range";
import { useRouter, useSearchParams } from "next/navigation";

const options: Array<{ id: ReportVista; label: string; hint: string }> = [
  {
    id: "dia",
    label: "Del día",
    hint: "Ventas y cobros del periodo que elijas",
  },
  {
    id: "tienda",
    label: "Cómo va la tienda",
    hint: "Mes en curso + caja de hoy (arrastre)",
  },
];

const btnBase =
  "inline-flex items-center rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-[0_1px_2px_0_rgb(190_24_93/0.06)] transition dark:shadow-none";

const btnIdle =
  "border-rose-200/70 bg-white text-rose-950/85 hover:border-rose-300/80 hover:bg-rose-50/50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800";

const btnActive =
  "border-rose-300/90 bg-rose-50/80 text-rose-950 hover:bg-rose-50 dark:border-zinc-500 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-400 dark:hover:bg-zinc-900";

export function ReportsVistaFilter({ vista }: { vista: ReportVista }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function select(next: ReportVista) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "dia") {
      params.delete("vista");
    } else {
      params.set("vista", next);
      // La vista tienda fija el mes en curso; no arrastra from/to del filtro de fechas.
      params.delete("from");
      params.delete("to");
    }
    const qs = params.toString();
    router.push(qs ? `/admin?${qs}` : "/admin");
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-2" role="group" aria-label="Tipo de reporte">
      {options.map((opt) => {
        const active = vista === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => select(opt.id)}
            aria-pressed={active}
            title={opt.hint}
            className={`${btnBase} ${active ? btnActive : btnIdle}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
