"use client";

import { REPORT_STORE_TIME_ZONE, type ReportVista } from "@/lib/admin-report-range";
import { useEffect, useState } from "react";

function formatTime(now: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: REPORT_STORE_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(now);
}

function sentenceCase(label: string): string {
  const t = label.trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** «Viernes 4 de Septiembre de 2026» en zona de la tienda. */
function formatCorteDate(now: Date): string {
  const weekday = new Intl.DateTimeFormat("es-CO", {
    timeZone: REPORT_STORE_TIME_ZONE,
    weekday: "long",
  }).format(now);
  const day = new Intl.DateTimeFormat("es-CO", {
    timeZone: REPORT_STORE_TIME_ZONE,
    day: "numeric",
  }).format(now);
  const month = new Intl.DateTimeFormat("es-CO", {
    timeZone: REPORT_STORE_TIME_ZONE,
    month: "long",
  }).format(now);
  const year = new Intl.DateTimeFormat("es-CO", {
    timeZone: REPORT_STORE_TIME_ZONE,
    year: "numeric",
  }).format(now);
  return `${sentenceCase(weekday)} ${day} de ${sentenceCase(month)} de ${year}`;
}

/** Subtítulo contextual + hora en vivo (Bogotá). */
export function ReportsHeaderMeta({
  vista,
  periodLabel,
  isCurrentTiendaMonth = true,
}: {
  vista: ReportVista;
  monthLabel?: string;
  periodLabel: string;
  isCurrentTiendaMonth?: boolean;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const time = formatTime(now);
  const lead =
    vista === "tienda"
      ? isCurrentTiendaMonth
        ? `Así va la tienda · a corte de ${formatCorteDate(now)}`
        : `Así le fue a la tienda · ${sentenceCase(periodLabel)}`
      : `Por periodo · ${periodLabel}`;

  return (
    <p className="mt-0.5 text-xs text-zinc-500">
      <span>{lead}</span>
      <span className="mx-1.5 text-zinc-400 dark:text-zinc-600">·</span>
      <time dateTime={now.toISOString()} className="tabular-nums">
        {time}
      </time>
    </p>
  );
}
