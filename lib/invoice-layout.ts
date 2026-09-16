export const INVOICE_LAYOUTS = ["ticket", "letter"] as const;

export type InvoiceLayout = (typeof INVOICE_LAYOUTS)[number];

export const DEFAULT_INVOICE_LAYOUT: InvoiceLayout = "ticket";

export function parseInvoiceLayout(raw: unknown): InvoiceLayout {
  if (raw === "letter" || raw === "ticket") return raw;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const value = (raw as Record<string, unknown>).invoice_layout;
    if (value === "letter" || value === "ticket") return value;
  }
  return DEFAULT_INVOICE_LAYOUT;
}

export function invoiceLayoutLabel(layout: InvoiceLayout): string {
  return layout === "letter" ? "Hoja carta" : "Tira térmica";
}
