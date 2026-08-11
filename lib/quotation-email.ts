import {
  invoiceLegalName,
  invoiceLogoPath,
  invoiceStoreAddress,
  invoiceStoreCity,
  invoiceTaxNit,
  invoiceTradeName,
  storeTaxRegime,
} from "@/lib/brand";
import { formatCop } from "@/lib/money";
import { getPublicSiteUrl } from "@/lib/public-site-url";

export type QuotationEmailLine = {
  name: string;
  quantity: number;
  unitPriceCents: number;
};

export function buildQuotationEmailHtml(input: {
  invoiceRef: string;
  customerName: string;
  createdAt: string | null;
  totalCents: number;
  lines: QuotationEmailLine[];
}): { subject: string; html: string; text: string } {
  const logoUrl = `${getPublicSiteUrl().replace(/\/$/, "")}${invoiceLogoPath.startsWith("/") ? "" : "/"}${invoiceLogoPath}`;
  const dateLabel = input.createdAt
    ? new Date(input.createdAt).toLocaleString("es-CO", {
        timeZone: "America/Bogota",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

  const rowsHtml = input.lines
    .map((l) => {
      const lineTotal = l.unitPriceCents * l.quantity;
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#18181b">${escapeHtml(l.name)}</td>
        <td style="padding:8px 8px;border-bottom:1px solid #eee;font-size:14px;text-align:center;color:#52525b">${l.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;text-align:right;color:#18181b">${formatCop(l.unitPriceCents)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;text-align:right;font-weight:600;color:#18181b">${formatCop(lineTotal)}</td>
      </tr>`;
    })
    .join("");

  const subject = `Cotización ${input.invoiceRef} · ${invoiceTradeName}`;
  const html = `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:24px;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:28px 24px;border:1px solid #e4e4e7">
    <div style="text-align:center;margin-bottom:20px">
      <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(invoiceTradeName)}" width="140" style="max-width:140px;height:auto" />
      <p style="margin:12px 0 0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#71717a">Cotización</p>
      <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#18181b">${escapeHtml(invoiceLegalName)}</p>
      ${invoiceTaxNit ? `<p style="margin:4px 0 0;font-size:12px;color:#71717a">NIT ${escapeHtml(invoiceTaxNit)}</p>` : ""}
      ${storeTaxRegime ? `<p style="margin:2px 0 0;font-size:12px;color:#71717a">${escapeHtml(storeTaxRegime)}</p>` : ""}
      ${invoiceStoreAddress || invoiceStoreCity ? `<p style="margin:8px 0 0;font-size:12px;color:#71717a">${escapeHtml([invoiceStoreAddress, invoiceStoreCity].filter(Boolean).join(" · "))}</p>` : ""}
    </div>
    <p style="margin:0;font-size:14px;color:#3f3f46">Hola <strong>${escapeHtml(input.customerName)}</strong>,</p>
    <p style="margin:8px 0 0;font-size:14px;color:#52525b;line-height:1.5">
      Te enviamos la cotización <strong>#${escapeHtml(input.invoiceRef)}</strong> (${escapeHtml(dateLabel)}).
      Este documento es una pre-factura: los precios y totales quedan sujetos a disponibilidad al momento de facturar.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-top:20px">
      <thead>
        <tr>
          <th style="text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#a1a1aa;padding-bottom:8px">Producto</th>
          <th style="text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#a1a1aa;padding-bottom:8px">Cant.</th>
          <th style="text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#a1a1aa;padding-bottom:8px">Unit.</th>
          <th style="text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#a1a1aa;padding-bottom:8px">Total</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <p style="margin:20px 0 0;text-align:right;font-size:12px;color:#71717a">Total cotizado</p>
    <p style="margin:4px 0 0;text-align:right;font-size:24px;font-weight:700;color:#18181b">${formatCop(input.totalCents)}</p>
    <p style="margin:28px 0 0;font-size:12px;color:#a1a1aa;line-height:1.5;text-align:center">
      ${escapeHtml(invoiceTradeName)} · Gracias por tu interés
    </p>
  </div>
</body>
</html>`;

  const textLines = input.lines
    .map(
      (l) =>
        `- ${l.name} x${l.quantity} · ${formatCop(l.unitPriceCents)} = ${formatCop(l.unitPriceCents * l.quantity)}`,
    )
    .join("\n");

  const text = `Cotización #${input.invoiceRef}
${invoiceLegalName}
Cliente: ${input.customerName}
Fecha: ${dateLabel}

${textLines}

Total: ${formatCop(input.totalCents)}

Esta es una pre-factura; al facturar se confirma stock y cobro.
`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
