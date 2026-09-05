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
  "border-rose-200/70 bg-white text-rose-950/85 hover:border-rose-300/80 hover:bg-rose-50/50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200";

/** Activo «Del día»: rose sólido. */
const btnActiveDia =
  "border-rose-800 bg-rose-800 text-white hover:bg-rose-700 dark:border-rose-500 dark:bg-rose-600 dark:text-white dark:hover:bg-rose-500";

/** Activo «Cómo va la tienda»: teal para marcar liquidez / ahora. */
const btnActiveTienda =
  "border-teal-700 bg-teal-700 text-white hover:bg-teal-600 dark:border-teal-400 dark:bg-teal-500 dark:text-zinc-950 dark:hover:bg-teal-400";

export function ReportsVistaFilter({ vista }: { vista: ReportVista }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function select(next: ReportVista) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "dia") {
      params.delete("vista");
    } else {
      params.set("vista", next);
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
        const activeClass =
          opt.id === "tienda" ? btnActiveTienda : btnActiveDia;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => select(opt.id)}
            aria-pressed={active}
            title={opt.hint}
            className={`${btnBase} ${active ? activeClass : btnIdle}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
