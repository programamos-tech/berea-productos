"use client";

import type { ReportVista } from "@/lib/admin-report-range";
import {
  adminToolbarBtnActiveClass,
  adminToolbarBtnBaseClass,
  adminToolbarBtnIdleClass,
} from "@/lib/admin-ui";
import { CalendarRange, Store } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

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

export function ReportsVistaFilter({ vista }: { vista: ReportVista }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function select(next: ReportVista) {
    if (next === vista || pending) return;
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
    startTransition(() => {
      router.push(qs ? `/admin?${qs}` : "/admin");
    });
  }

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-2 transition-opacity ${pending ? "opacity-70" : ""}`}
      role="group"
      aria-label="Tipo de reporte"
      aria-busy={pending}
    >
      {options.map((opt) => {
        const active = vista === opt.id;
        const Icon = opt.Icon;
        const shortLabel = opt.id === "tienda" ? "Tienda" : "Periodo";
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => select(opt.id)}
            aria-pressed={active}
            disabled={pending}
            title={opt.hint}
            className={`${adminToolbarBtnBaseClass} ${active ? adminToolbarBtnActiveClass : adminToolbarBtnIdleClass} disabled:cursor-wait`}
          >
            <Icon className="size-4 shrink-0" strokeWidth={2.25} aria-hidden />
            <span className="sm:hidden">{shortLabel}</span>
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
