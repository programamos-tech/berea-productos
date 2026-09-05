/**
 * Auditoría abril 2026: dashboard (lógica order-revenue-vat) vs Excel vs CSV legacy.
 * Uso: node scripts/audit-april-profit.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SALE_VAT_PERCENT = 19;

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') inQ = false;
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur);
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
      cur = "";
    } else cur += c;
  }
  if (cur || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

function csvToObjects(filename) {
  const p = path.join(ROOT, filename);
  if (!fs.existsSync(p)) return [];
  const rows = parseCSV(fs.readFileSync(p, "utf8"));
  const headers = rows[0];
  return rows.slice(1).map((r) => {
    const o = {};
    headers.forEach((h, i) => {
      o[h] = r[i] ?? "";
    });
    return o;
  });
}

function moneyCO(raw) {
  if (raw == null || raw === "") return 0;
  const s = String(raw)
    .replace(/\$/g, "")
    .replace(/\s/g, "")
    .replace(/−/g, "-")
    .trim();
  if (s === "-" || s === "#REF!" || s === "#REF") return 0;
  const neg = s.startsWith("-") || s.startsWith("(");
  const n = s.replace(/[^0-9.,-]/g, "");
  if (!n || n === "-") return 0;
  const cleaned = n.replace(/\./g, "").replace(",", ".");
  const v = Math.round(parseFloat(cleaned));
  return neg && v > 0 ? -v : v;
}

function unitPriceNetCents(price_cents) {
  return Math.max(0, Math.round(Number(price_cents ?? 0)));
}

function unitPriceGrossCents(price_cents, has_vat) {
  const base = unitPriceNetCents(price_cents);
  if (!has_vat) return base;
  return Math.round(base * (1 + SALE_VAT_PERCENT / 100));
}

function unitNetFromPosChargedUnitCents(chargedUnitCents, has_vat) {
  const g = Math.max(0, Math.round(Number(chargedUnitCents ?? 0)));
  if (!has_vat) return g;
  return Math.round(g / (1 + SALE_VAT_PERCENT / 100));
}

function isPosOrder(wompiReference) {
  return String(wompiReference ?? "").startsWith("POS:");
}

function lineNetGrossCents(order, it, p) {
  const qty = Math.max(0, Math.floor(Number(it.quantity ?? 0)));
  if (qty <= 0) return null;
  const unit = Math.max(0, Math.round(Number(it.unit_price_cents ?? 0)));
  const pos = isPosOrder(order.wompi_reference);

  if (pos) {
    if (p && p.has_vat === true) {
      const catalogNet = unitPriceNetCents(p.price_cents);
      const catalogGross = unitPriceGrossCents(p.price_cents, true);
      const dn = Math.abs(unit - catalogNet);
      const dg = Math.abs(unit - catalogGross);
      const tol = Math.max(2, Math.round(catalogNet * 0.005));
      if (dn < dg && dn <= tol) {
        return {
          net: unit * qty,
          gross: unitPriceGrossCents(unit, true) * qty,
        };
      }
      return {
        gross: unit * qty,
        net: unitNetFromPosChargedUnitCents(unit, true) * qty,
      };
    }
    const line = unit * qty;
    return { net: line, gross: line };
  }
  if (p?.has_vat) {
    const catalogNet = unitPriceNetCents(p.price_cents);
    const tol = Math.max(4, Math.round(catalogNet * 0.02));
    if (Math.abs(unit - catalogNet) <= tol) {
      return {
        net: unit * qty,
        gross: unitPriceGrossCents(unit, true) * qty,
      };
    }
  }
  const lineGross = unit * qty;
  const lineNet = p?.has_vat
    ? unitNetFromPosChargedUnitCents(unit, true) * qty
    : lineGross;
  return { net: lineNet, gross: lineGross };
}

function fmt(n) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

function normName(s) {
  return String(s ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\sÁÉÍÓÚÑ]/gi, "");
}

function reportDayKeyBogota(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}

// --- Excel ---
const excelPath = path.join(ROOT, "VENTAS 2026 ALEYA.xlsx - ABRIL.csv");
const excelRows = parseCSV(fs.readFileSync(excelPath, "utf8"));
const excelProducts = [];
for (let i = 2; i < excelRows.length; i++) {
  const r = excelRows[i];
  const name = (r[0] ?? "").replace(/\s+/g, " ").trim();
  if (!name || name.startsWith(",")) continue;
  const vendGuac = Number(String(r[25] ?? "").replace(/[^\d]/g, "")) || 0;
  const utilGuac = moneyCO(r[28]);
  const ventGuac = moneyCO(r[27]);
  const costGuac = moneyCO(r[26]);
  const vendRed = Number(String(r[21] ?? "").replace(/[^\d]/g, "")) || 0;
  const utilRed = moneyCO(r[24]);
  const ventRed = moneyCO(r[23]);
  const costUnit = moneyCO(r[1]);
  const pricePublic = moneyCO(r[6]);
  if (vendGuac === 0 && vendRed === 0 && utilGuac === 0 && ventGuac === 0) continue;
  excelProducts.push({
    name,
    norm: normName(name),
    costUnit,
    pricePublic,
    vendGuac,
    ventGuac,
    utilGuac,
    costGuac,
    vendRed,
    ventRed,
    utilRed,
  });
}

const excelTotals = {
  vendGuac: excelProducts.reduce((s, p) => s + p.vendGuac, 0),
  ventGuac: excelProducts.reduce((s, p) => s + p.ventGuac, 0),
  utilGuac: excelProducts.reduce((s, p) => s + p.utilGuac, 0),
  vendRed: excelProducts.reduce((s, p) => s + p.vendRed, 0),
  ventRed: excelProducts.reduce((s, p) => s + p.ventRed, 0),
  utilRed: excelProducts.reduce((s, p) => s + p.utilRed, 0),
};

// Footer Excel (fila 68 = índice 67; gastos/util neta en col 30 filas 71-72)
const footerRow = excelRows[67] ?? [];
const excelFooter = {
  totalVendidos: Number(String(footerRow[20] ?? "").replace(/[^\d]/g, "")) || 0,
  vendRed: Number(String(footerRow[21] ?? "").replace(/[^\d]/g, "")) || 0,
  ventRed: moneyCO(footerRow[23]),
  utilRed: moneyCO(footerRow[24]),
  vendGuac: Number(String(footerRow[25] ?? "").replace(/[^\d]/g, "")) || 0,
  ventGuac: moneyCO(footerRow[27]),
  utilGuac: moneyCO(footerRow[28]),
  gastos: moneyCO(excelRows[70]?.[30]),
  utilNetGuac: moneyCO(excelRows[71]?.[30]),
  utilGeneral: moneyCO(excelRows[73]?.[26]),
};

// --- CSV legacy → simular orders ---
const sales = csvToObjects("sales_rows.csv");
const saleItems = csvToObjects("sale_items_rows.csv");
const products = csvToObjects("products_rows.csv");

const productsByRef = new Map();
const productsById = new Map();
const productsByNormName = new Map();
for (const p of products) {
  const ref = String(p.reference ?? "").trim();
  const priceNet = Math.round(Number(p.price_before_tax || p.price || 0));
  const costNet = Math.round(Number(p.cost_before_tax || p.cost || 0));
  const priceGross = Math.round(Number(p.price || 0));
  const has_vat = priceGross > priceNet + 1 || priceNet > 0;
  const row = {
    id: p.id,
    name: p.name,
    reference: ref,
    price_cents: priceNet,
    cost_cents: costNet,
    has_vat,
    vat_percent: 19,
  };
  if (ref) productsByRef.set(ref, row);
  productsById.set(p.id, row);
  productsByNormName.set(normName(p.name), row);
}

const aprilSales = sales.filter((s) => {
  if (s.status !== "completed") return false;
  const day = reportDayKeyBogota(s.created_at);
  return day >= "2026-04-01" && day <= "2026-04-30";
});

const saleIdSet = new Set(aprilSales.map((s) => s.id));
const orders = aprilSales.map((s) => ({
  id: s.id,
  status: "paid",
  total_cents: Math.round(Number(s.total || 0)),
  created_at: s.created_at,
  wompi_reference: "POS:legacy",
}));

const items = saleItems
  .filter((it) => saleIdSet.has(it.sale_id))
  .map((it) => {
    const qty = Number(it.quantity || 0);
    const lineTotal = Math.round(Number(it.total || 0));
    const unitCsv = Math.round(Number(it.unit_price || 0));
    const unitEffective =
      lineTotal > 0 && qty > 0 ? Math.round(lineTotal / qty) : unitCsv;
    return {
      order_id: it.sale_id,
      product_id: it.product_id,
      quantity: qty,
      unit_price_cents: unitEffective,
      line_total_cents: lineTotal,
      product_reference_code: it.product_reference_code,
      product_name: it.product_name,
    };
  });

const prodMap = productsById;

let grossRev = 0;
let netRev = 0;
let grossProfit = 0;
let sumOrderTotals = 0;
let sumLineTotals = 0;
let totalUnits = 0;
const byRef = new Map();

for (const o of orders) {
  sumOrderTotals += o.total_cents;
  const lines = items.filter((i) => i.order_id === o.id);
  for (const it of lines) {
    sumLineTotals += it.line_total_cents;
    totalUnits += Math.max(0, Math.floor(Number(it.quantity ?? 0)));
    let p = it.product_id ? prodMap.get(it.product_id) : undefined;
    if (!p && it.product_reference_code) {
      p = productsByRef.get(String(it.product_reference_code).trim());
    }
    if (!p && it.product_name) {
      p = productsByNormName.get(normName(it.product_name));
    }
    const lg = lineNetGrossCents(o, it, p);
    if (!lg) continue;
    grossRev += lg.gross;
    netRev += lg.net;
    const qty = Math.max(0, Math.floor(Number(it.quantity ?? 0)));
    const costUnit =
      p?.cost_cents != null && Number.isFinite(Number(p.cost_cents))
        ? Math.max(0, Math.round(Number(p.cost_cents)))
        : 0;
    const margin = lg.net - costUnit * qty;
    grossProfit += margin;

    const refKey = p?.reference || it.product_reference_code || normName(it.product_name);
    if (!byRef.has(refKey)) {
      byRef.set(refKey, {
        name: p?.name || it.product_name,
        ref: refKey,
        qty: 0,
        grossRev: 0,
        netRev: 0,
        margin: 0,
        costUnit,
      });
    }
    const agg = byRef.get(refKey);
    agg.qty += qty;
    agg.grossRev += lg.gross;
    agg.netRev += lg.net;
    agg.margin += margin;
  }
}

// Egresos CSV
const expenses = csvToObjects("expenses_rows.csv");
let egresosCsv = 0;
let egresosCsvCount = 0;
for (const e of expenses) {
  const day = String(e.date ?? "").slice(0, 10);
  if (day < "2026-04-01" || day > "2026-04-30") continue;
  if (String(e.status ?? "").toLowerCase() === "cancelled") continue;
  egresosCsv += Math.round(Number(e.amount || 0));
  egresosCsvCount++;
}

// Comparación producto a producto (Excel Guacarí vs CSV margen)
const productDiffs = [];
for (const ex of excelProducts) {
  if (ex.vendGuac === 0 && ex.utilGuac === 0) continue;
  let csv = null;
  for (const [ref, agg] of byRef) {
    if (normName(agg.name) === ex.norm) {
      csv = agg;
      break;
    }
  }
  if (!csv) {
    for (const [ref, agg] of byRef) {
      if (ex.norm.includes(normName(agg.name)) || normName(agg.name).includes(ex.norm)) {
        csv = agg;
        break;
      }
    }
  }
  productDiffs.push({
    name: ex.name,
    excelQty: ex.vendGuac,
    csvQty: csv?.qty ?? 0,
    excelUtil: ex.utilGuac,
    csvMargin: csv?.margin ?? 0,
    excelVent: ex.ventGuac,
    csvNetRev: csv?.netRev ?? 0,
    diffUtil: (csv?.margin ?? 0) - ex.utilGuac,
    diffQty: (csv?.qty ?? 0) - ex.vendGuac,
  });
}
productDiffs.sort((a, b) => Math.abs(b.diffUtil) - Math.abs(a.diffUtil));

// Dashboard prod (referencia usuario — no disponible en env local)
const DASHBOARD = {
  ventasConIva: 65185256,
  ventasCount: 666,
  ingresosSinIva: 54777462,
  gananciaBruta: 13556025,
  egresos: 11235914,
  egresosCount: 77,
  gananciaNeta: 2320111,
};

console.log("\n=== AUDITORÍA ABRIL 2026 — GANANCIA vs EXCEL ===\n");

console.log("1) TOTALES EXCEL (footer hoja ABRIL)");
console.log(`   Ventas Guacarí:     ${fmt(excelFooter.ventGuac)} (${excelFooter.vendGuac} uds)`);
console.log(`   Utilidad Guacarí:   ${fmt(excelFooter.utilGuac)}`);
console.log(`   Ventas Redistrib.:  ${fmt(excelFooter.ventRed)} (${excelFooter.vendRed} uds)`);
console.log(`   Utilidad Redistrib.:${fmt(excelFooter.utilRed)}`);
console.log(`   Ventas combinadas:  ${fmt(excelFooter.ventGuac + excelFooter.ventRed)}`);
console.log(`   Utilidad combinada: ${fmt(excelFooter.utilGuac + excelFooter.utilRed)} (Excel UTILIDAD GENERAL: ${fmt(excelFooter.utilGeneral)})`);
console.log(`   Gastos abril:       ${fmt(excelFooter.gastos)}`);
console.log(`   Utilidad neta (Excel, solo canal Guacarí): ${fmt(excelFooter.utilNetGuac)}`);

console.log("\n2) DASHBOARD PRODUCCIÓN (captura usuario)");
console.log(`   Ventas con IVA:     ${fmt(DASHBOARD.ventasConIva)} (${DASHBOARD.ventasCount} pedidos)`);
console.log(`   Ingresos sin IVA:   ${fmt(DASHBOARD.ingresosSinIva)}`);
console.log(`   Ganancia bruta:     ${fmt(DASHBOARD.gananciaBruta)}`);
console.log(`   Egresos:            ${fmt(DASHBOARD.egresos)} (${DASHBOARD.egresosCount} mov.)`);
console.log(`   Ganancia neta:      ${fmt(DASHBOARD.gananciaNeta)}`);

console.log(`\n3) CSV LEGACY (misma lógica que dashboard, ${orders.length} pedidos abril Bogotá)`);
console.log(`   Suma total pedidos: ${fmt(sumOrderTotals)}`);
console.log(`   Suma líneas (total): ${fmt(sumLineTotals)} (${totalUnits} uds)`);
console.log(`   Ingresos con IVA (líneas calc): ${fmt(grossRev)}`);
console.log(`   Ingresos sin IVA (líneas): ${fmt(netRev)}`);
console.log(`   Ganancia bruta (líneas):     ${fmt(grossProfit)}`);
console.log(`   Egresos CSV export:          ${fmt(egresosCsv)} (${egresosCsvCount} mov.)`);
console.log(`   Ganancia neta CSV:           ${fmt(grossProfit - egresosCsv)}`);

console.log("\n4) RECONCILIACIÓN DASHBOARD ↔ EXCEL");
const dashVsExcelVentas = DASHBOARD.ventasConIva - (excelFooter.ventGuac + excelFooter.ventRed);
const dashVsExcelBruta = DASHBOARD.gananciaBruta - (excelFooter.utilGuac + excelFooter.utilRed);
console.log(`   Δ Ventas dashboard − Excel (Guac+Redist): ${fmt(dashVsExcelVentas)} (${((dashVsExcelVentas / DASHBOARD.ventasConIva) * 100).toFixed(2)}%)`);
console.log(`   Δ Bruta dashboard − Excel utilidad total:  ${fmt(dashVsExcelBruta)}`);
console.log(`   Δ Bruta dashboard − Excel solo Guacarí:    ${fmt(DASHBOARD.gananciaBruta - excelFooter.utilGuac)}`);
console.log(`   Egresos: Excel = Dashboard = ${fmt(excelFooter.gastos)} ✓`);
console.log(`   Δ Neta dashboard − Excel neta Guacarí:     ${fmt(DASHBOARD.gananciaNeta - excelFooter.utilNetGuac)}`);

console.log("\n5) TOP 15 DIFERENCIAS POR PRODUCTO (CSV margen vs Excel UTILIDAD GUACARÍ)");
for (const d of productDiffs.slice(0, 15)) {
  console.log(
    `   ${d.name.slice(0, 42).padEnd(42)} | uds ${String(d.csvQty).padStart(4)}/${String(d.excelQty).padStart(4)} | util CSV ${fmt(d.csvMargin).padStart(14)} vs Excel ${fmt(d.excelUtil).padStart(14)} | Δ ${fmt(d.diffUtil)}`,
  );
}

console.log("\n6) CAUSAS PRINCIPALES DE DIFERENCIA");
const qtyMismatch = productDiffs.filter((d) => d.diffQty !== 0).length;
const onlyExcel = productDiffs.filter((d) => d.csvQty === 0 && d.excelQty > 0).length;
console.log(`   Productos con cantidades distintas Guacarí: ${qtyMismatch}/${productDiffs.length}`);
console.log(`   Productos solo en Excel (0 en CSV): ${onlyExcel}`);
console.log(`   CSV suma pedidos (${fmt(sumOrderTotals)}) ≠ dashboard (${fmt(DASHBOARD.ventasConIva)}): Δ ${fmt(DASHBOARD.ventasConIva - sumOrderTotals)}`);
console.log(`   → El export sales_rows.csv no refleja total_cents de producción; usar Supabase orders para cifra exacta.`);
console.log(`   → Excel split Guacarí/Redistribución no existe en el POS; dashboard suma TODO el canal.`);
console.log(`   → Excel usa precio catálogo fijo × unidades; sistema usa precio real cobrado por línea (descuentos).`);
console.log(`   → Excel UTILIDAD usa margen unitario teórico; sistema resta cost_cents del catálogo al neto vendido.`);
