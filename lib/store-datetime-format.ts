import { REPORT_STORE_TIME_ZONE } from "@/lib/admin-report-range";

const TZ = { timeZone: REPORT_STORE_TIME_ZONE } as const;

/** Node vs browser a veces usan NBSP / narrow-NBSP en am/pm → rompe hidratación. */
function normalizeLocaleText(s: string): string {
  return s
    .replace(/[\u00A0\u202F\u2009]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Fecha corta + hora (lista ventas / tarjetas). */
export function formatStoreVentaFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const time = d.toLocaleTimeString("es-CO", {
    ...TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const date = d.toLocaleDateString("es-CO", {
    ...TZ,
    day: "numeric",
    month: "short",
  });
  return normalizeLocaleText(`${time} · ${date}`);
}

export function formatStoreDateTime(
  iso: string | null | undefined,
  options: Intl.DateTimeFormatOptions,
): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return normalizeLocaleText(d.toLocaleString("es-CO", { ...TZ, ...options }));
}

export function formatStoreInvoiceDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return normalizeLocaleText(
    d.toLocaleString("es-CO", {
      ...TZ,
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  );
}

export function formatStoreInvoiceDateNumeric(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return normalizeLocaleText(
    d.toLocaleDateString("es-CO", {
      ...TZ,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
  );
}

/** Hora HH:mm en calendario tienda (p. ej. junto a fecha de factura de proveedor). */
export function formatStoreTimeHourMinute(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return normalizeLocaleText(
    d.toLocaleTimeString("es-CO", {
      ...TZ,
      hour: "2-digit",
      minute: "2-digit",
    }),
  );
}
