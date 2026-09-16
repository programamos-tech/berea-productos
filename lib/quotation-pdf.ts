import { readFile } from "fs/promises";
import { join } from "path";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import {
  adminSidebarLogoPath,
  invoiceLegalName as envInvoiceLegalName,
  invoiceLogoPath as envInvoiceLogoPath,
  invoiceStoreAddress as envInvoiceStoreAddress,
  invoiceStoreCity as envInvoiceStoreCity,
  invoiceTaxNit as envInvoiceTaxNit,
  invoiceTradeName as envInvoiceTradeName,
  storeSupportEmail as envStoreSupportEmail,
  storeSupportHours as envStoreSupportHours,
  storeSupportPhone as envStoreSupportPhone,
  storeTaxRegime as envStoreTaxRegime,
} from "@/lib/brand";
import { formatCop } from "@/lib/money";
import { getPublicSiteUrl } from "@/lib/public-site-url";
import {
  resolveInvoiceLogoSrc,
  tenantBrandToInvoiceFields,
  type InvoiceBrandFields,
} from "@/lib/tenant-brand";

export type QuotationPdfLine = {
  name: string;
  reference?: string | null;
  quantity: number;
  unitPriceCents: number;
};

export type QuotationPdfInput = {
  invoiceRef: string;
  customerName: string;
  customerEmail?: string | null;
  customerDocumentId?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  createdAt: string | null;
  totalCents: number;
  lines: QuotationPdfLine[];
  /** Tenant brand; omit to use env defaults (Aleya). */
  brand?: InvoiceBrandFields;
};

const INK = hexToRgb("#18181b");
const MUTED = hexToRgb("#52525b");
const FAINT = hexToRgb("#71717a");
const LINE = hexToRgb("#d4d4d8");
const HAIR = hexToRgb("#e4e4e7");
const WHITE = rgb(1, 1, 1);

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = Number.parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/** pdf-lib WinAnsi no soporta NBSP / espacios tipográficos de Intl. */
function pdfText(s: string): string {
  return s
    .replace(/\u00a0|\u202f|\u2009/g, " ")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "?");
}

function money(cents: number): string {
  return pdfText(formatCop(cents));
}

function wrapLines(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = pdfText(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const lines: string[] = [];
  let current = words[0]!;
  for (let i = 1; i < words.length; i++) {
    const next = `${current} ${words[i]}`;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      lines.push(current);
      current = words[i]!;
    }
  }
  lines.push(current);
  return lines;
}

function drawText(
  page: PDFPage,
  text: string,
  opts: {
    x: number;
    y: number;
    size: number;
    font: PDFFont;
    color?: ReturnType<typeof rgb>;
    maxWidth?: number;
  },
): number {
  const color = opts.color ?? INK;
  const lines = opts.maxWidth
    ? wrapLines(opts.font, text, opts.size, opts.maxWidth)
    : [pdfText(text)];
  let y = opts.y;
  for (const line of lines) {
    page.drawText(line, {
      x: opts.x,
      y,
      size: opts.size,
      font: opts.font,
      color,
    });
    y -= opts.size * 1.35;
  }
  return y;
}

async function loadLogoBytes(logoPath: string): Promise<Uint8Array | null> {
  try {
    const src = resolveInvoiceLogoSrc(logoPath);
    if (/^https?:\/\//i.test(src)) {
      const res = await fetch(src);
      if (!res.ok) return null;
      return new Uint8Array(await res.arrayBuffer());
    }
    const rel = src.startsWith("/") ? src.slice(1) : src;
    const buf = await readFile(join(process.cwd(), "public", rel));
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

async function embedLogoImage(pdf: PDFDocument, logoPath: string) {
  const bytes = await loadLogoBytes(logoPath);
  if (!bytes) return null;
  try {
    return await pdf.embedPng(bytes);
  } catch {
    try {
      return await pdf.embedJpg(bytes);
    } catch {
      return null;
    }
  }
}

/**
 * Genera PDF de cotización (carta), blanco y negro, alineado a la plataforma.
 * Usa `input.brand` cuando hay tenant; si no, env de Aleya.
 */
export async function buildQuotationPdf(
  input: QuotationPdfInput,
): Promise<Uint8Array> {
  const brand = input.brand ?? tenantBrandToInvoiceFields(null);
  const invoiceLegalName = brand.invoiceLegalName || envInvoiceLegalName;
  const invoiceTradeName = brand.invoiceTradeName || envInvoiceTradeName;
  const invoiceTaxNit = brand.invoiceTaxNit || envInvoiceTaxNit;
  const storeTaxRegime = brand.storeTaxRegime || envStoreTaxRegime;
  const invoiceStoreAddress =
    brand.invoiceStoreAddress || envInvoiceStoreAddress;
  const invoiceStoreCity = brand.invoiceStoreCity || envInvoiceStoreCity;
  const invoiceLogoPath = brand.invoiceLogoPath || envInvoiceLogoPath;
  const storeSupportPhone = brand.storeSupportPhone || envStoreSupportPhone;
  const storeSupportEmail = brand.storeSupportEmail || envStoreSupportEmail;
  const storeSupportHours = brand.storeSupportHours || envStoreSupportHours;

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 612; // Letter
  const pageHeight = 792;
  const marginX = 48;
  const contentWidth = pageWidth - marginX * 2;

  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - 44;

  const ensureSpace = (needed: number) => {
    if (y - needed < 64) {
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - 48;
    }
  };

  const siteUrl = getPublicSiteUrl().replace(/^https?:\/\//, "");
  const avatarSize = 48;
  const logo = await embedLogoImage(pdf, invoiceLogoPath);
  const headerMaxW = contentWidth - (logo ? avatarSize + 16 : 0);

  y =
    drawText(page, "COTIZACION COMERCIAL", {
      x: marginX,
      y,
      size: 8,
      font: fontBold,
      color: FAINT,
    }) + 6;
  y =
    drawText(page, invoiceLegalName, {
      x: marginX,
      y,
      size: 16,
      font: fontBold,
      color: INK,
      maxWidth: headerMaxW,
    }) + 4;
  y = drawText(page, `${invoiceTradeName} · NIT ${invoiceTaxNit} · ${storeTaxRegime}`, {
    x: marginX,
    y,
    size: 9,
    font,
    color: MUTED,
    maxWidth: headerMaxW,
  });
  const addr = [invoiceStoreAddress, invoiceStoreCity].filter(Boolean).join(" · ");
  if (addr) {
    y = drawText(page, addr, {
      x: marginX,
      y: y + 2,
      size: 8,
      font,
      color: MUTED,
      maxWidth: headerMaxW,
    });
  }
  const contactLine = [
    storeSupportPhone,
    storeSupportEmail,
    siteUrl,
    storeSupportHours,
  ]
    .filter(Boolean)
    .join(" · ");
  y = drawText(page, contactLine, {
    x: marginX,
    y: y + 4,
    size: 8,
    font,
    color: FAINT,
    maxWidth: headerMaxW,
  });

  if (logo) {
    const avatarX = pageWidth - marginX - avatarSize;
    const avatarY = pageHeight - 44 - avatarSize + 10;
    page.drawCircle({
      x: avatarX + avatarSize / 2,
      y: avatarY + avatarSize / 2,
      size: avatarSize / 2,
      color: WHITE,
      borderColor: LINE,
      borderWidth: 0.8,
    });
    const pad = 7;
    const maxInner = avatarSize - pad * 2;
    const scale = Math.min(maxInner / logo.width, maxInner / logo.height);
    const w = logo.width * scale;
    const h = logo.height * scale;
    page.drawImage(logo, {
      x: avatarX + (avatarSize - w) / 2,
      y: avatarY + (avatarSize - h) / 2,
      width: w,
      height: h,
    });
  }

  y -= 10;
  page.drawRectangle({
    x: marginX,
    y,
    width: contentWidth,
    height: 0.8,
    color: LINE,
  });
  y -= 22;

  page.drawRectangle({
    x: marginX,
    y: y - 5,
    width: 78,
    height: 16,
    color: WHITE,
    borderColor: LINE,
    borderWidth: 0.7,
  });
  page.drawText("COTIZACION", {
    x: marginX + 8,
    y: y - 1,
    size: 7,
    font: fontBold,
    color: MUTED,
  });
  y -= 28;
  page.drawText(`#${pdfText(input.invoiceRef)}`, {
    x: marginX,
    y,
    size: 20,
    font: fontBold,
    color: INK,
  });

  const dateLabel = input.createdAt
    ? new Date(input.createdAt).toLocaleString("es-CO", {
        timeZone: "America/Bogota",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
  const dateStr = pdfText(dateLabel);
  const dateW = font.widthOfTextAtSize(dateStr, 10);
  page.drawText(dateStr, {
    x: pageWidth - marginX - dateW,
    y: y + 4,
    size: 10,
    font,
    color: MUTED,
  });
  y -= 24;

  const customerLines: string[] = [pdfText(input.customerName)];
  if (input.customerDocumentId?.trim()) {
    customerLines.push(`Documento: ${pdfText(input.customerDocumentId.trim())}`);
  }
  if (input.customerPhone?.trim()) {
    customerLines.push(`Telefono: ${pdfText(input.customerPhone.trim())}`);
  }
  if (
    input.customerEmail?.trim() &&
    !input.customerEmail.includes("@local.invalid")
  ) {
    customerLines.push(`Correo: ${pdfText(input.customerEmail.trim())}`);
  }
  if (input.customerAddress?.trim()) {
    customerLines.push(`Direccion: ${pdfText(input.customerAddress.trim())}`);
  }
  const boxH = 22 + customerLines.length * 12;
  ensureSpace(boxH + 20);
  page.drawRectangle({
    x: marginX,
    y: y + 8,
    width: contentWidth,
    height: 0.7,
    color: LINE,
  });
  page.drawText("CLIENTE", {
    x: marginX,
    y: y - 6,
    size: 7,
    font: fontBold,
    color: FAINT,
  });
  let custY = y - 20;
  for (let i = 0; i < customerLines.length; i++) {
    page.drawText(customerLines[i]!, {
      x: marginX,
      y: custY,
      size: i === 0 ? 11 : 9,
      font: i === 0 ? fontBold : font,
      color: INK,
    });
    custY -= 12;
  }
  y = custY - 6;
  page.drawRectangle({
    x: marginX,
    y,
    width: contentWidth,
    height: 0.7,
    color: LINE,
  });
  y -= 18;

  // Tabla
  const colCant = marginX;
  const colDesc = marginX + 36;
  const colUnit = pageWidth - marginX - 160;
  const colTotal = pageWidth - marginX - 70;
  const descWidth = colUnit - colDesc - 8;

  ensureSpace(40);
  page.drawText("CANT.", {
    x: colCant,
    y: y,
    size: 8,
    font: fontBold,
    color: FAINT,
  });
  page.drawText("DESCRIPCION", {
    x: colDesc,
    y,
    size: 8,
    font: fontBold,
    color: FAINT,
  });
  page.drawText("V. UNIT.", {
    x: colUnit,
    y,
    size: 8,
    font: fontBold,
    color: FAINT,
  });
  page.drawText("TOTAL", {
    x: colTotal,
    y,
    size: 8,
    font: fontBold,
    color: FAINT,
  });
  y -= 8;
  page.drawRectangle({
    x: marginX,
    y: y,
    width: contentWidth,
    height: 0.8,
    color: MUTED,
  });
  y -= 16;

  for (const line of input.lines) {
    const nameLines = wrapLines(font, line.name, 9, descWidth);
    const ref = line.reference?.trim();
    const rowH = Math.max(16, nameLines.length * 11 + (ref ? 10 : 0) + 6);
    ensureSpace(rowH + 8);

    page.drawText(String(line.quantity), {
      x: colCant,
      y: y - 2,
      size: 9,
      font: fontBold,
      color: INK,
    });

    let ny = y - 2;
    for (const nl of nameLines) {
      page.drawText(nl, {
        x: colDesc,
        y: ny,
        size: 9,
        font,
        color: INK,
      });
      ny -= 11;
    }
    if (ref) {
      page.drawText(`Ref. ${pdfText(ref)}`, {
        x: colDesc,
        y: ny,
        size: 7,
        font,
        color: MUTED,
      });
    }

    const unitStr = money(line.unitPriceCents);
    const totalStr = money(line.unitPriceCents * line.quantity);
    page.drawText(unitStr, {
      x: colUnit + 70 - font.widthOfTextAtSize(unitStr, 9),
      y: y - 2,
      size: 9,
      font,
      color: INK,
    });
    page.drawText(totalStr, {
      x: pageWidth - marginX - fontBold.widthOfTextAtSize(totalStr, 9),
      y: y - 2,
      size: 9,
      font: fontBold,
      color: INK,
    });

    y -= rowH;
    page.drawRectangle({
      x: marginX,
      y: y + 4,
      width: contentWidth,
      height: 0.5,
      color: HAIR,
    });
  }

  // Total
  ensureSpace(56);
  y -= 12;
  const totalBoxW = 200;
  const totalBoxH = 40;
  page.drawRectangle({
    x: pageWidth - marginX - totalBoxW,
    y: y - totalBoxH + 12,
    width: totalBoxW,
    height: totalBoxH,
    color: WHITE,
    borderColor: LINE,
    borderWidth: 0.9,
  });
  page.drawText("TOTAL COTIZADO", {
    x: pageWidth - marginX - totalBoxW + 12,
    y: y - 2,
    size: 8,
    font: fontBold,
    color: FAINT,
  });
  const totalStr = money(input.totalCents);
  page.drawText(totalStr, {
    x:
      pageWidth -
      marginX -
      12 -
      fontBold.widthOfTextAtSize(totalStr, 14),
    y: y - 20,
    size: 14,
    font: fontBold,
    color: INK,
  });
  y -= totalBoxH + 16;

  // Pie
  ensureSpace(90);
  page.drawRectangle({
    x: marginX,
    y: y,
    width: contentWidth,
    height: 0.8,
    color: LINE,
  });
  y -= 16;
  const footer1 = pdfText(`${invoiceLegalName} · NIT ${invoiceTaxNit}`);
  const f1w = font.widthOfTextAtSize(footer1, 8);
  page.drawText(footer1, {
    x: (pageWidth - f1w) / 2,
    y,
    size: 8,
    font,
    color: INK,
  });
  y -= 12;
  const footer2 = pdfText(
    `Tel. ${storeSupportPhone} · ${storeSupportEmail} · ${siteUrl}`,
  );
  const f2w = font.widthOfTextAtSize(footer2, 7);
  page.drawText(footer2, {
    x: Math.max(marginX, (pageWidth - f2w) / 2),
    y,
    size: 7,
    font,
    color: MUTED,
  });
  y -= 14;
  const note =
    "Documento de cotizacion (pre-factura). Valores sujetos a disponibilidad al facturar. IVA incluido.";
  const noteLines = wrapLines(font, note, 7, contentWidth - 20);
  for (const nl of noteLines) {
    const nw = font.widthOfTextAtSize(nl, 7);
    page.drawText(nl, {
      x: (pageWidth - nw) / 2,
      y,
      size: 7,
      font,
      color: FAINT,
    });
    y -= 10;
  }

  y -= 8;
  const powered = "POWERED BY";
  const pw = font.widthOfTextAtSize(powered, 6);
  page.drawText(powered, {
    x: (pageWidth - pw) / 2,
    y,
    size: 6,
    font: fontBold,
    color: FAINT,
  });
  y -= 16;
  const bereaLogo = await embedLogoImage(pdf, adminSidebarLogoPath);
  if (bereaLogo) {
    const maxW = 86;
    const maxH = 14;
    const scale = Math.min(maxW / bereaLogo.width, maxH / bereaLogo.height);
    const w = bereaLogo.width * scale;
    const h = bereaLogo.height * scale;
    page.drawImage(bereaLogo, {
      x: (pageWidth - w) / 2,
      y: y - h + 8,
      width: w,
      height: h,
    });
  }

  return pdf.save();
}

export function quotationPdfFilename(
  invoiceRef: string,
  tradeName?: string,
): string {
  const safe = invoiceRef.replace(/[^\w.-]+/g, "_");
  const brand = (tradeName ?? envInvoiceTradeName)
    .replace(/[^\w.-]+/g, "")
    .slice(0, 24);
  return `Cotizacion_${safe}_${brand || "tienda"}.pdf`;
}
