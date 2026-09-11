export type QuotationStockNotice = {
  name: string;
  need: number;
  hadLocal: number;
  hadWarehouse: number;
  tookLocal: number;
  tookWarehouse: number;
};

export function allocateAvailableStock(
  need: number,
  local: number,
  warehouse: number,
): { takeL: number; takeW: number; short: number } {
  const n = Math.max(0, Math.floor(need));
  const l = Math.max(0, Math.floor(local));
  const w = Math.max(0, Math.floor(warehouse));
  const takeL = Math.min(l, n);
  const takeW = Math.min(w, n - takeL);
  return { takeL, takeW, short: n - takeL - takeW };
}

export function encodeQuotationStockNotices(
  rows: QuotationStockNotice[],
): string {
  const slim = rows.slice(0, 24).map((r) => ({
    name: String(r.name ?? "Producto").slice(0, 80),
    need: Math.max(0, Math.floor(Number(r.need) || 0)),
    hadLocal: Math.max(0, Math.floor(Number(r.hadLocal) || 0)),
    hadWarehouse: Math.max(0, Math.floor(Number(r.hadWarehouse) || 0)),
    tookLocal: Math.max(0, Math.floor(Number(r.tookLocal) || 0)),
    tookWarehouse: Math.max(0, Math.floor(Number(r.tookWarehouse) || 0)),
  }));
  return Buffer.from(JSON.stringify(slim), "utf8").toString("base64url");
}

export function decodeQuotationStockNotices(
  raw: string | null | undefined,
): QuotationStockNotice[] {
  if (!raw) return [];
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: QuotationStockNotice[] = [];
    for (const row of parsed) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      out.push({
        name: String(r.name ?? "Producto").slice(0, 80),
        need: Math.max(0, Math.floor(Number(r.need) || 0)),
        hadLocal: Math.max(0, Math.floor(Number(r.hadLocal) || 0)),
        hadWarehouse: Math.max(0, Math.floor(Number(r.hadWarehouse) || 0)),
        tookLocal: Math.max(0, Math.floor(Number(r.tookLocal) || 0)),
        tookWarehouse: Math.max(0, Math.floor(Number(r.tookWarehouse) || 0)),
      });
    }
    return out;
  } catch {
    return [];
  }
}

export function quotationConvertErrorMessage(code: string | undefined): string | null {
  switch (code) {
    case "payment":
      return "El efectivo y la transferencia deben sumar el total de la cotización.";
    case "missing":
      return "No se encontró la cotización.";
    case "not_quotation":
      return "Esa cotización ya no se puede facturar (ya fue cobrada o anulada).";
    case "db":
      return "No se pudo guardar la factura. Intentá de nuevo.";
    case "stock":
      return "No había stock suficiente para facturar. Revisá local y bodega e intentá de nuevo.";
    default:
      return null;
  }
}
