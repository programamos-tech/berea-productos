"use client";

import type { ReportVista } from "@/lib/admin-report-range";
import {
  adminToolbarBtnActiveClass,
  adminToolbarBtnBaseClass,
  adminToolbarBtnIdleClass,
} from "@/lib/admin-ui";
import { useReportsNavPending } from "@/components/admin/ReportsNavPending";
import { CalendarRange, Store } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useOptimistic, useTransition } from "react";

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

function hrefForVista(
  next: ReportVista,
  searchParams: URLSearchParams,
  todayKey?: string,
): string {
  const params = new URLSearchParams(searchParams.toString());
  if (next === "tienda") {
    params.delete("vista");
    params.delete("from");
    params.delete("to");
  } else {
    params.set("vista", "dia");
    params.delete("mes");
    // Rango por defecto = hoy → URL estable y prefetchable.
    if (todayKey && !params.get("from") && !params.get("to")) {
      params.set("from", todayKey);
      params.set("to", todayKey);
    }
  }
  const qs = params.toString();
  return qs ? `/admin?${qs}` : "/admin";
}

export function ReportsVistaFilter({
  vista,
  todayKey,
}: {
  vista: ReportVista;
  /** YYYY-MM-DD en zona de la tienda; acelera el salto a “Por periodo”. */
  todayKey?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { markNav, isPending: navPending } = useReportsNavPending();
  const [pending, startTransition] = useTransition();
  const [optimisticVista, setOptimisticVista] = useOptimistic(vista);
  const busy = pending || navPending;

  useEffect(() => {
    const base = new URLSearchParams(searchParams.toString());
    router.prefetch(hrefForVista("dia", base, todayKey));
    router.prefetch(hrefForVista("tienda", base));
  }, [router, searchParams, todayKey]);

  function select(next: ReportVista) {
    if (next === optimisticVista || busy) return;
    const href = hrefForVista(
      next,
      new URLSearchParams(searchParams.toString()),
      todayKey,
    );
    markNav(href);
    startTransition(() => {
      setOptimisticVista(next);
      router.push(href);
    });
  }

  return (
    <div
      className={`inline-flex shrink-0 flex-nowrap items-center gap-2 ${busy ? "opacity-90" : ""}`}
      role="group"
      aria-label="Tipo de reporte"
      aria-busy={busy}
    >
      {options.map((opt) => {
        const active = optimisticVista === opt.id;
        const Icon = opt.Icon;
        const shortLabel = opt.id === "tienda" ? "Tienda" : "Periodo";
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => select(opt.id)}
            disabled={busy}
            onMouseEnter={() => {
              router.prefetch(
                hrefForVista(
                  opt.id,
                  new URLSearchParams(searchParams.toString()),
                  todayKey,
                ),
              );
            }}
            aria-pressed={active}
            title={opt.hint}
            className={`${adminToolbarBtnBaseClass} shrink-0 px-2.5 sm:px-3 ${active ? adminToolbarBtnActiveClass : adminToolbarBtnIdleClass} disabled:cursor-wait`}
          >
            <Icon className="size-4 shrink-0" strokeWidth={2.25} aria-hidden />
            <span className="xl:hidden">{shortLabel}</span>
            <span className="hidden xl:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
