"use client";

import { REPORT_STORE_TIME_ZONE } from "@/lib/admin-report-range";
import { useEffect, useState } from "react";

function formatParts(now: Date): { date: string; time: string } {
  const date = new Intl.DateTimeFormat("es-CO", {
    timeZone: REPORT_STORE_TIME_ZONE,
    day: "numeric",
    month: "short",
  }).format(now);
  const time = new Intl.DateTimeFormat("es-CO", {
    timeZone: REPORT_STORE_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  return { date, time };
}

/** Subtítulo: mes en vista · fecha de hoy · hora (Bogotá, se actualiza). */
export function ReportsHeaderMeta({ monthLabel }: { monthLabel: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const { date, time } = formatParts(now);

  return (
    <p className="mt-0.5 text-xs text-rose-950/50 dark:text-zinc-500">
      <span className="capitalize">{monthLabel}</span>
      <span className="mx-1.5 text-zinc-400 dark:text-zinc-600">·</span>
      <span className="tabular-nums">{date}</span>
      <span className="mx-1.5 text-zinc-400 dark:text-zinc-600">·</span>
      <time dateTime={now.toISOString()} className="tabular-nums">
        {time}
      </time>
    </p>
  );
}
