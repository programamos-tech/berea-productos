export const STOCK_TRANSFER_STATUSES = [
  "in_transit",
  "received",
  "cancelled",
] as const;

export type StockTransferStatus = (typeof STOCK_TRANSFER_STATUSES)[number];

export function isStockTransferStatus(
  raw: string | null | undefined,
): raw is StockTransferStatus {
  return (
    raw === "in_transit" || raw === "received" || raw === "cancelled"
  );
}

export function stockTransferStatusLabel(status: StockTransferStatus): string {
  if (status === "in_transit") return "En camino";
  if (status === "received") return "Recibido";
  return "Anulado";
}

export function formatTransferWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(date);
}

export function stockTransferErrorMessage(raw: string | null | undefined): string {
  const msg = String(raw ?? "");
  const insufficient = msg.match(/insufficient_stock:([^\n]+)/);
  if (insufficient?.[1]) {
    return `No hay suficiente stock de ${insufficient[1].trim()} en la sucursal de origen.`;
  }
  if (msg.includes("already_closed")) {
    return "Ese traslado ya se recibió o se anuló.";
  }
  if (msg.includes("not_allowed")) {
    return "No puedes confirmar este traslado.";
  }
  if (msg.includes("invalid_transfer") || msg.includes("product_not_found")) {
    return "Revisa las sucursales y las cantidades.";
  }
  return "No se pudo guardar el traslado.";
}
