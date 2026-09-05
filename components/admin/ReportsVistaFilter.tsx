"use client";

import type { ReportVista } from "@/lib/admin-report-range";
import { CalendarRange, Store } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const options: Array<{
  id: ReportVista;
  label: string;
  hint: string;
  Icon: typeof CalendarRange;
}> = [
  {
    id: "tienda",
    label: "Cómo va la tienda",
    hint: "Mes completo o en curso: caja, cuentas y resultado",
    Icon: Store,
  },
  {
    id: "dia",
    label: "Por periodo",
    hint: "Ventas y cobros del día, semana, mes u otro rango",
    Icon: CalendarRange,
  },
];

const btnBase =
  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-[0_1px_2px_0_rgb(190_24_93/0.06)] transition dark:shadow-none";

const btnIdle =
  "border-rose-200/70 bg-white text-rose-950/85 hover:border-rose-300/80 hover:bg-rose-50/50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200";

const btnActive =
  "border-rose-800 bg-rose-800 text-white hover:bg-rose-700 dark:border-rose-500 dark:bg-rose-600 dark:text-white dark:hover:bg-rose-500";

export function ReportsVistaFilter({ vista }: { vista: ReportVista }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function select(next: ReportVista) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "tienda") {
      // Vista por defecto: sin param.
      params.delete("vista");
      params.delete("from");
      params.delete("to");
      // Conserva `mes` si ya estaba eligiendo un mes histórico.
    } else {
      params.set("vista", "dia");
      params.delete("mes");
    }
    const qs = params.toString();
    router.push(qs ? `/admin?${qs}` : "/admin");
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-2" role="group" aria-label="Tipo de reporte">
      {options.map((opt) => {
        const active = vista === opt.id;
        const Icon = opt.Icon;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => select(opt.id)}
            aria-pressed={active}
            title={opt.hint}
            className={`${btnBase} ${active ? btnActive : btnIdle}`}
          >
            <Icon className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
