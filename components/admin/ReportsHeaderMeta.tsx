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

/** Subtítulo contextual + hora en vivo (Bogotá). */
export function ReportsHeaderMeta({
  vista,
  monthLabel,
  periodLabel,
}: {
  vista: ReportVista;
  monthLabel: string;
  periodLabel: string;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const time = formatTime(now);
  const lead =
    vista === "tienda"
      ? `Así va la tienda · ${sentenceCase(monthLabel)}`
      : `Por periodo · ${periodLabel}`;

  return (
    <p className="mt-0.5 text-xs text-rose-950/50 dark:text-zinc-500">
      <span>{lead}</span>
      <span className="mx-1.5 text-zinc-400 dark:text-zinc-600">·</span>
      <time dateTime={now.toISOString()} className="tabular-nums">
        {time}
      </time>
    </p>
  );
}
