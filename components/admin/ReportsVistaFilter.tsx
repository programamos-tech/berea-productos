"use client";

import type { ReportVista } from "@/lib/admin-report-range";
import { useRouter, useSearchParams } from "next/navigation";

const options: Array<{ id: ReportVista; label: string; hint: string }> = [
  {
    id: "dia",
    label: "Del día",
    hint: "Ventas y cobros del periodo",
  },
  {
    id: "tienda",
    label: "Cómo va la tienda",
    hint: "Caja, transferencias y egresos",
  },
];

export function ReportsVistaFilter({ vista }: { vista: ReportVista }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function select(next: ReportVista) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "dia") params.delete("vista");
    else params.set("vista", next);
    const qs = params.toString();
    router.push(qs ? `/admin?${qs}` : "/admin");
  }

  return (
    <div
      className="inline-flex rounded-lg border border-rose-200/70 bg-white p-0.5 shadow-[0_1px_2px_0_rgb(190_24_93/0.06)] dark:border-zinc-700 dark:bg-zinc-950 dark:shadow-none"
      role="group"
      aria-label="Tipo de reporte"
    >
      {options.map((opt) => {
        const active = vista === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => select(opt.id)}
            aria-pressed={active}
            title={opt.hint}
            className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold tracking-wide transition sm:px-3 ${
              active
                ? "bg-rose-950 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-950"
                : "text-rose-950/70 hover:bg-rose-50/70 hover:text-rose-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
