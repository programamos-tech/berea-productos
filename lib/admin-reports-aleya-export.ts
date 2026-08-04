import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchOrderItemsInChunks,
  fetchOrdersCreatedInReportYmdWindow,
} from "@/lib/admin-fetch-orders-for-report";
import {
  addCalendarDaysReport,
  createdAtBoundsForReportYmdRange,
  dayInRange,
  monthAleyaLabel,
  reportCalendarDayKeyFromIso,
  todayYmdInReportStore,
} from "@/lib/admin-report-range";
import {
  lineNetGrossCents,
  sumGrossProfitNetOnLinesForPaidOrders,
  sumRevenueNetGrossForOrders,
  type OrderItemRow,
  type OrderRowRef,
  type ProductVatRow,
} from "@/lib/order-revenue-vat";
import {
  unitPriceGrossCents,
  unitPriceNetCents,
  unitVatAmountCents,
} from "@/lib/product-vat-price";

export type AleyaExportCatalogProduct = {
  id: string;
  name: string;
  reference: string | null;
  price_cents: number;
  cost_cents: number;
  cost_gross_cents: number;
  has_vat: boolean | null;
  vat_percent: number | null;
};

/** Totales del mes por producto (columnas de movimiento del Excel). */
export type AleyaExportMonthStats = {
  qty: number;
  ivaAlePesos: number;
  costGrossPesos: number;
  /** Precio lista (catálogo con IVA) × unidades — sin descuentos. */
  catalogSalesGrossPesos: number;
  /** max(0, catálogo − cobrado): POS, mayorista, cupones, etc. */
  discountPesos: number;
  /** Lo realmente cobrado con IVA (igual que reportes / ticket). */
  salesGrossPesos: number;
  marginPesos: number;
};

/** Stock del mes: inicio reconstruido, vendido y restante actual. */
export type AleyaExportStockStats = {
  stockStart: number;
  stockSold: number;
  stockLeft: number;
};

export type AleyaExportSoldRow = {
  product: AleyaExportCatalogProduct | null;
  displayName: string;
  reference: string | null;
  month: AleyaExportMonthStats;
  stock: AleyaExportStockStats;
};

export type AleyaExportPayload = {
  yearMonth: string;
  monthLabel: string;
  rangeFrom: string;
  rangeTo: string;
  rows: AleyaExportSoldRow[];
  totals: AleyaExportMonthStats;
  /** Cuadre con tarjetas del dashboard (misma lógica). */
  reportIngresosConIva: number;
  reportIngresosSinIva: number;
  reportGananciaBruta: number;
  paidOrdersCount: number;
  expensesPesos: number;
  expensesCount: number;
};

function purchaseVatUnit(costNet: number, costGross: number): number {
  return Math.max(0, Math.round(costGross - costNet));
}

function catalogUnitMarginNet(product: AleyaExportCatalogProduct): number {
  const net = unitPriceNetCents(product.price_cents);
  return Math.max(0, net - Math.max(0, Math.round(product.cost_cents)));
}

function catalogIvaAleUnit(product: AleyaExportCatalogProduct): number {
  const saleVat = unitVatAmountCents(
    product.price_cents,
    product.has_vat,
    product.vat_percent,
  );
  const purchaseVat = purchaseVatUnit(
    product.cost_cents,
    product.cost_gross_cents || product.cost_cents,
  );
  return Math.max(0, saleVat - purchaseVat);
}

function emptyMonthStats(): AleyaExportMonthStats {
  return {
    qty: 0,
    ivaAlePesos: 0,
    costGrossPesos: 0,
    catalogSalesGrossPesos: 0,
    discountPesos: 0,
    salesGrossPesos: 0,
    marginPesos: 0,
  };
}

function emptyStockStats(): AleyaExportStockStats {
  return { stockStart: 0, stockSold: 0, stockLeft: 0 };
}

function addMonth(target: AleyaExportMonthStats, delta: AleyaExportMonthStats): void {
  target.qty += delta.qty;
  target.ivaAlePesos += delta.ivaAlePesos;
  target.costGrossPesos += delta.costGrossPesos;
  target.catalogSalesGrossPesos += delta.catalogSalesGrossPesos;
  target.discountPesos += delta.discountPesos;
  target.salesGrossPesos += delta.salesGrossPesos;
  target.marginPesos += delta.marginPesos;
}

function addStock(target: AleyaExportStockStats, delta: AleyaExportStockStats): void {
  target.stockStart += delta.stockStart;
  target.stockSold += delta.stockSold;
  target.stockLeft += delta.stockLeft;
}

function floorQty(v: unknown): number {
  return Math.max(0, Math.floor(Number(v ?? 0)));
}

/**
 * Variación neta de unidades desde el inicio del mes hasta hoy
 * (ajustes manuales + altas de producto). Las ventas se reconstruyen aparte.
 */
async function fetchNetStockAdjustmentsSince(
  supabase: SupabaseClient,
  fromYmd: string,
  toYmd: string,
  productIds: Set<string>,
): Promise<Map<string, number>> {
  const deltas = new Map<string, number>();
  if (productIds.size === 0) return deltas;

  const bounds = createdAtBoundsForReportYmdRange(fromYmd, toYmd);
  if (!bounds) return deltas;

  const pageSize = 400;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("admin_activity_log")
      .select("action_type, entity_id, metadata")
      .gte("created_at", bounds.gte)
      .lt("created_at", bounds.lt)
      .in("action_type", ["stock_adjusted", "product_created"])
      .order("created_at", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error("[aleya-export] stock adjustments:", error.message);
      break;
    }

    const rows = data ?? [];
    for (const row of rows) {
      const action = String(row.action_type ?? "");
      const productId = row.entity_id != null ? String(row.entity_id) : "";
      if (!productId || !productIds.has(productId)) continue;
      const m = (row.metadata ?? {}) as Record<string, unknown>;

      if (action === "stock_adjusted") {
        const prev = floorQty(m.previous_local) + floorQty(m.previous_warehouse);
        const next = floorQty(m.next_local) + floorQty(m.next_warehouse);
        deltas.set(productId, (deltas.get(productId) ?? 0) + (next - prev));
        continue;
      }

      if (action === "product_created") {
        const qty = floorQty(m.stock_local) + floorQty(m.stock_warehouse);
        deltas.set(productId, (deltas.get(productId) ?? 0) + qty);
      }
    }

    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  return deltas;
}

/** Unidades vendidas (pedidos pagados) desde fromYmd hasta toYmd, por producto. */
async function fetchPaidSoldQtyByProduct(
  supabase: SupabaseClient,
  fromYmd: string,
  toYmd: string,
  productIds: Set<string>,
): Promise<Map<string, number>> {
  const sold = new Map<string, number>();
  if (productIds.size === 0) return sold;

  const { rows: orderRows, error: ordersErr } =
    await fetchOrdersCreatedInReportYmdWindow(
      supabase,
      fromYmd,
      toYmd,
      "id,status,created_at",
    );
  if (ordersErr) {
    console.error("[aleya-export] stock sold window:", ordersErr);
    return sold;
  }

  const paidIds = (orderRows as { id?: string; status?: string; created_at?: string }[])
    .filter(
      (o) =>
        o.status === "paid" &&
        typeof o.created_at === "string" &&
        dayInRange(reportCalendarDayKeyFromIso(o.created_at), fromYmd, toYmd),
    )
    .map((o) => String(o.id))
    .filter(Boolean);

  if (paidIds.length === 0) return sold;

  const { rows: itemRows, error: itemsErr } = await fetchOrderItemsInChunks(
    supabase,
    paidIds,
    "product_id,quantity",
  );
  if (itemsErr) {
    console.error("[aleya-export] stock sold items:", itemsErr);
    return sold;
  }

  for (const raw of itemRows) {
    const productId = raw.product_id ? String(raw.product_id) : "";
    if (!productId || !productIds.has(productId)) continue;
    const qty = floorQty(raw.quantity);
    if (qty <= 0) continue;
    sold.set(productId, (sold.get(productId) ?? 0) + qty);
  }

  return sold;
}

async function fetchCurrentStockByProduct(
  supabase: SupabaseClient,
  productIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  for (let i = 0; i < productIds.length; i += 120) {
    const part = productIds.slice(i, i + 120);
    const { data, error } = await supabase
      .from("products")
      .select("id,stock_quantity")
      .in("id", part);
    if (error) {
      console.error("[aleya-export] current stock:", error.message);
      break;
    }
    for (const p of data ?? []) {
      map.set(String(p.id), floorQty(p.stock_quantity));
    }
  }
  return map;
}

function buildStockStats(params: {
  stockLeft: number;
  stockSoldMonth: number;
  soldSinceMonthStart: number;
  netAdjustSinceMonthStart: number;
}): AleyaExportStockStats {
  const stockLeft = Math.max(0, Math.round(params.stockLeft));
  const stockSold = Math.max(0, Math.round(params.stockSoldMonth));
  // current = start + ajustes − ventas ⇒ start = current − ajustes + ventas
  const stockStart = Math.max(
    0,
    Math.round(
      stockLeft - params.netAdjustSinceMonthStart + params.soldSinceMonthStart,
    ),
  );
  return { stockStart, stockSold, stockLeft };
}

/** Stock al cierre del periodo: actual menos movimientos posteriores al mes. */
function stockAtPeriodEnd(params: {
  currentStock: number;
  soldAfterPeriod: number;
  netAdjustAfterPeriod: number;
}): number {
  return Math.max(
    0,
    Math.round(
      params.currentStock -
        params.netAdjustAfterPeriod +
        params.soldAfterPeriod,
    ),
  );
}

function referenceSortKey(reference: string | null): number {
  const n = Number(String(reference ?? "").replace(/\D/g, ""));
  return Number.isFinite(n) ? n : 999_999;
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/**
 * Pesos COP enteros para celdas del CSV (sin `$` ni separador de miles).
 * Así Excel y Google Sheets importan número y `SUMA()` cuadra con TOTALES.
 */
export function formatAleyaMoneyCell(pesos: number): string {
  return String(Math.round(Number(pesos ?? 0)));
}

function moneyCell(pesos: number): string {
  return formatAleyaMoneyCell(pesos);
}

function intCell(n: number): string {
  return String(Math.max(0, Math.round(n)));
}

function buildCatalogCells(product: AleyaExportCatalogProduct): string[] {
  const costNet = Math.max(0, Math.round(product.cost_cents));
  const costGross = Math.max(
    costNet,
    Math.round(product.cost_gross_cents || costNet),
  );
  const priceNet = unitPriceNetCents(product.price_cents);
  const priceGross = unitPriceGrossCents(
    product.price_cents,
    product.has_vat,
    product.vat_percent,
  );
  const saleVat = Math.max(0, priceGross - priceNet);
  const purchaseVat = Math.max(0, costGross - costNet);
  const ivaAle = catalogIvaAleUnit(product);
  const unitMargin = catalogUnitMarginNet(product);

  return [
    moneyCell(costNet),
    moneyCell(purchaseVat),
    moneyCell(costGross),
    moneyCell(priceNet),
    moneyCell(saleVat),
    moneyCell(priceGross),
    moneyCell(ivaAle),
    moneyCell(unitMargin),
  ];
}

function buildMonthCells(stats: AleyaExportMonthStats): string[] {
  return [
    moneyCell(stats.ivaAlePesos),
    intCell(stats.qty),
    moneyCell(stats.costGrossPesos),
    moneyCell(stats.catalogSalesGrossPesos),
    moneyCell(stats.discountPesos),
    moneyCell(stats.salesGrossPesos),
    moneyCell(stats.marginPesos),
  ];
}

function buildStockCells(stock: AleyaExportStockStats): string[] {
  return [
    intCell(stock.stockStart),
    intCell(stock.stockSold),
    intCell(stock.stockLeft),
  ];
}

export function buildAleyaExportCsv(payload: AleyaExportPayload): string {
  const mes = payload.monthLabel;
  const headers = [
    "DESCRIPCIÓN",
    "COSTO COMPRA ANTES IVA ",
    "IVA DE COMPRA ",
    "TOTAL VALOR DE COMPRA CON IVA",
    "VENTA ANTES DE IVA ",
    "IVA DE VENTA ",
    "VALOR DE VENTA PUBLICO FINAL",
    "IVA ALEYA",
    "GANANCIA DEL PRODUCTO DESPUES IVA ",
    `IVA A PAGAR ALEYA ${mes}`,
    `VENDIDOS ${mes}`,
    "COSTO DE COMPRA MILAGROS",
    "VENTA CATÁLOGO ",
    "DESCUENTO ",
    "VENTA TOTAL ",
    "UTILIDAD",
    `STOCK INICIO ${mes}`,
    `STOCK VENDIDO ${mes}`,
    `STOCK QUEDÓ ${mes}`,
  ];

  const lines: string[] = [];
  lines.push(headers.map(csvEscape).join(","));
  lines.push("");

  for (const row of payload.rows) {
    const catalog = row.product ? buildCatalogCells(row.product) : Array(8).fill("");
    const desc = row.reference
      ? `${row.displayName} (ref. ${row.reference})`
      : row.displayName;
    const cells = [
      desc,
      ...catalog,
      ...buildMonthCells(row.month),
      ...buildStockCells(row.stock),
    ];
    lines.push(cells.map((c) => csvEscape(String(c))).join(","));
  }

  const t = payload.totals;
  const stockTotals = emptyStockStats();
  for (const row of payload.rows) addStock(stockTotals, row.stock);

  lines.push("");
  lines.push(
    [
      "TOTALES",
      ...Array(8).fill(""),
      ...buildMonthCells(t),
      ...buildStockCells(stockTotals),
    ]
      .map((c) => csvEscape(String(c)))
      .join(","),
  );

  lines.push("");
  lines.push(
    [
      "CUADRE CON REPORTES DEL MISMO MES",
      "",
      "Ingresos con IVA (reportes)",
      moneyCell(payload.reportIngresosConIva),
      "Suma VENTA TOTAL cobrada (este archivo)",
      moneyCell(t.salesGrossPesos),
      "Diferencia",
      moneyCell(t.salesGrossPesos - payload.reportIngresosConIva),
    ]
      .map((c) => csvEscape(String(c)))
      .join(","),
  );
  lines.push(
    [
      "",
      "",
      "Ganancia bruta (reportes)",
      moneyCell(payload.reportGananciaBruta),
      "Suma UTILIDAD (este archivo)",
      moneyCell(t.marginPesos),
      "Diferencia",
      moneyCell(t.marginPesos - payload.reportGananciaBruta),
    ]
      .map((c) => csvEscape(String(c)))
      .join(","),
  );

  const netMargin = t.marginPesos - payload.expensesPesos;
  lines.push("");
  lines.push(
    [
      "RESUMEN",
      `Mes: ${payload.yearMonth}`,
      `Pedidos pagados: ${payload.paidOrdersCount}`,
      `Unidades vendidas: ${t.qty}`,
      `Venta catálogo: ${moneyCell(t.catalogSalesGrossPesos)}`,
      `Descuentos (POS/mayorista/cupones): ${moneyCell(t.discountPesos)}`,
      `Venta cobrada: ${moneyCell(t.salesGrossPesos)}`,
      `Stock inicio (suma): ${intCell(stockTotals.stockStart)}`,
      `Stock quedó (suma): ${intCell(stockTotals.stockLeft)}`,
      `Ingresos sin IVA: ${moneyCell(payload.reportIngresosSinIva)}`,
      `GASTOS: ${moneyCell(payload.expensesPesos)}`,
      `UTILIDAD NETA: ${moneyCell(netMargin)}`,
    ]
      .map((c) => csvEscape(String(c)))
      .join(","),
  );

  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export async function fetchAleyaExportPayload(
  supabase: SupabaseClient,
  rangeFrom: string,
  rangeTo: string,
  yearMonth: string,
): Promise<{ payload: AleyaExportPayload | null; error: string | null }> {
  const monthLabel = monthAleyaLabel(yearMonth);

  const { rows: orderRows, error: ordersErr } =
    await fetchOrdersCreatedInReportYmdWindow(
      supabase,
      rangeFrom,
      rangeTo,
      "id,status,total_cents,created_at,wompi_reference",
    );

  if (ordersErr) {
    return { payload: null, error: ordersErr };
  }

  const paidOrders = (orderRows as OrderRowRef[]).filter(
    (o) =>
      o.status === "paid" &&
      typeof o.created_at === "string" &&
      dayInRange(reportCalendarDayKeyFromIso(o.created_at), rangeFrom, rangeTo),
  );

  const paidOrderIds = paidOrders.map((o) => o.id).filter(Boolean);
  const ordersById = new Map(paidOrders.map((o) => [o.id, o]));
  let orderItems: OrderItemRow[] = [];

  if (paidOrderIds.length > 0) {
    const { rows: itemRows, error: itemsErr } = await fetchOrderItemsInChunks(
      supabase,
      paidOrderIds,
      "order_id,product_id,quantity,unit_price_cents,product_name_snapshot",
    );
    if (itemsErr) {
      return { payload: null, error: itemsErr };
    }
    orderItems = itemRows as OrderItemRow[];
  }

  const soldProductIds = new Set<string>();
  for (const raw of orderItems) {
    if (raw.product_id) soldProductIds.add(String(raw.product_id));
  }

  const productsById = new Map<string, AleyaExportCatalogProduct>();
  if (soldProductIds.size > 0) {
    const ids = [...soldProductIds];
    for (let i = 0; i < ids.length; i += 120) {
      const part = ids.slice(i, i + 120);
      const { data, error } = await supabase
        .from("products")
        .select(
          "id,name,reference,price_cents,cost_cents,cost_gross_cents,has_vat,vat_percent",
        )
        .in("id", part);
      if (error) return { payload: null, error: error.message };
      for (const p of data ?? []) {
        productsById.set(String(p.id), {
          id: String(p.id),
          name: String(p.name ?? "Producto"),
          reference: p.reference != null ? String(p.reference) : null,
          price_cents: Number(p.price_cents ?? 0),
          cost_cents: Number(p.cost_cents ?? 0),
          cost_gross_cents: Number(p.cost_gross_cents ?? p.cost_cents ?? 0),
          has_vat: p.has_vat as boolean | null,
          vat_percent: p.vat_percent != null ? Number(p.vat_percent) : null,
        });
      }
    }
  }

  const monthByProductId = new Map<string, AleyaExportMonthStats>();
  const orphanByKey = new Map<
    string,
    { name: string; month: AleyaExportMonthStats }
  >();

  for (const raw of orderItems) {
    const orderId = String(raw.order_id ?? "");
    const order = ordersById.get(orderId);
    if (!order) continue;

    const qty = Math.max(0, Math.floor(Number(raw.quantity ?? 0)));
    if (qty <= 0) continue;

    const productId = raw.product_id ? String(raw.product_id) : null;
    const item: OrderItemRow = {
      order_id: orderId,
      product_id: productId,
      quantity: qty,
      unit_price_cents: Math.max(
        0,
        Math.round(Number(raw.unit_price_cents ?? 0)),
      ),
    };

    const catalog = productId ? productsById.get(productId) : undefined;
    const vatRow: ProductVatRow | undefined = catalog
      ? {
          id: catalog.id,
          price_cents: catalog.price_cents,
          has_vat: catalog.has_vat,
          vat_percent: catalog.vat_percent,
          cost_cents: catalog.cost_cents,
        }
      : undefined;

    const lg = lineNetGrossCents(order, item, vatRow);
    if (!lg) continue;

    const costNet = catalog ? Math.max(0, Math.round(catalog.cost_cents)) : 0;
    const costGross = catalog
      ? Math.max(costNet, Math.round(catalog.cost_gross_cents || costNet))
      : 0;
    const catalogUnitGross = catalog
      ? unitPriceGrossCents(
          catalog.price_cents,
          catalog.has_vat,
          catalog.vat_percent,
        )
      : 0;
    const catalogSalesGross = catalog ? catalogUnitGross * qty : lg.gross;
    const discountPesos = Math.max(0, catalogSalesGross - lg.gross);
    const purchaseVatLine = Math.max(0, costGross - costNet) * qty;
    const saleVatCharged = Math.max(0, lg.gross - lg.net);
    const ivaAlePesos = Math.max(0, saleVatCharged - purchaseVatLine);

    const delta: AleyaExportMonthStats = {
      qty,
      ivaAlePesos,
      costGrossPesos: costGross * qty,
      catalogSalesGrossPesos: catalogSalesGross,
      discountPesos,
      salesGrossPesos: lg.gross,
      marginPesos: lg.net - costNet * qty,
    };

    if (productId) {
      const bucket = monthByProductId.get(productId) ?? emptyMonthStats();
      addMonth(bucket, delta);
      monthByProductId.set(productId, bucket);
    } else {
      const snap = String(
        (raw as { product_name_snapshot?: string }).product_name_snapshot ??
          "Sin catálogo",
      ).trim();
      const key = snap || "Sin catálogo";
      if (!orphanByKey.has(key)) {
        orphanByKey.set(key, { name: key, month: emptyMonthStats() });
      }
      addMonth(orphanByKey.get(key)!.month, delta);
    }
  }

  const productsByIdForReport = new Map<string, ProductVatRow>();
  for (const [id, p] of productsById) {
    productsByIdForReport.set(id, {
      id: p.id,
      price_cents: p.price_cents,
      has_vat: p.has_vat,
      vat_percent: p.vat_percent,
      cost_cents: p.cost_cents,
    });
  }

  const rev = sumRevenueNetGrossForOrders(
    paidOrders,
    orderItems,
    productsByIdForReport,
  );
  const reportGananciaBruta = sumGrossProfitNetOnLinesForPaidOrders(
    paidOrders,
    orderItems,
    productsByIdForReport,
  );

  const soldRows: AleyaExportSoldRow[] = [];

  const productIdList = [...monthByProductId.keys()];
  const productIdSet = new Set(productIdList);
  const todayYmd = todayYmdInReportStore();
  const stockToYmd = todayYmd < rangeFrom ? rangeFrom : todayYmd;
  const dayAfterMonth = addCalendarDaysReport(rangeTo, 1);
  const hasAfterMonth = dayAfterMonth <= stockToYmd;

  const [
    currentStockById,
    soldSinceStart,
    netAdjustSinceStart,
    soldAfterMonth,
    netAdjustAfterMonth,
  ] = await Promise.all([
    fetchCurrentStockByProduct(supabase, productIdList),
    fetchPaidSoldQtyByProduct(supabase, rangeFrom, stockToYmd, productIdSet),
    fetchNetStockAdjustmentsSince(
      supabase,
      rangeFrom,
      stockToYmd,
      productIdSet,
    ),
    hasAfterMonth
      ? fetchPaidSoldQtyByProduct(
          supabase,
          dayAfterMonth,
          stockToYmd,
          productIdSet,
        )
      : Promise.resolve(new Map<string, number>()),
    hasAfterMonth
      ? fetchNetStockAdjustmentsSince(
          supabase,
          dayAfterMonth,
          stockToYmd,
          productIdSet,
        )
      : Promise.resolve(new Map<string, number>()),
  ]);

  for (const [productId, month] of monthByProductId) {
    if (month.qty <= 0) continue;
    const product = productsById.get(productId) ?? null;
    const currentStock = currentStockById.get(productId) ?? 0;
    const stockLeft = stockAtPeriodEnd({
      currentStock,
      soldAfterPeriod: soldAfterMonth.get(productId) ?? 0,
      netAdjustAfterPeriod: netAdjustAfterMonth.get(productId) ?? 0,
    });
    const stock = buildStockStats({
      stockLeft: currentStock,
      stockSoldMonth: month.qty,
      soldSinceMonthStart: soldSinceStart.get(productId) ?? 0,
      netAdjustSinceMonthStart: netAdjustSinceStart.get(productId) ?? 0,
    });
    // stockStart usa current; stockLeft es cierre del mes exportado
    stock.stockLeft = stockLeft;
    soldRows.push({
      product,
      displayName: product?.name ?? "Producto",
      reference: product?.reference ?? null,
      month,
      stock,
    });
  }

  for (const { name, month } of orphanByKey.values()) {
    if (month.qty <= 0) continue;
    soldRows.push({
      product: null,
      displayName: name,
      reference: null,
      month,
      stock: {
        stockStart: 0,
        stockSold: month.qty,
        stockLeft: 0,
      },
    });
  }

  soldRows.sort((a, b) => {
    const ra = referenceSortKey(a.reference);
    const rb = referenceSortKey(b.reference);
    if (ra !== rb) return ra - rb;
    return a.displayName.localeCompare(b.displayName, "es");
  });

  const totals = emptyMonthStats();
  for (const row of soldRows) addMonth(totals, row.month);

  const { data: expenseRows, error: expensesErr } = await supabase
    .from("store_expenses")
    .select("amount_cents,expense_date,is_cancelled")
    .gte("expense_date", rangeFrom)
    .lte("expense_date", rangeTo)
    .limit(2000);

  if (expensesErr) {
    return { payload: null, error: expensesErr.message };
  }

  let expensesPesos = 0;
  let expensesCount = 0;
  for (const e of expenseRows ?? []) {
    if ((e as { is_cancelled?: boolean }).is_cancelled === true) continue;
    const raw =
      typeof e.expense_date === "string" ? e.expense_date.slice(0, 10) : "";
    if (!raw || !dayInRange(raw, rangeFrom, rangeTo)) continue;
    expensesPesos += Math.max(0, Math.round(Number(e.amount_cents ?? 0)));
    expensesCount += 1;
  }

  return {
    payload: {
      yearMonth,
      monthLabel,
      rangeFrom,
      rangeTo,
      rows: soldRows,
      totals,
      reportIngresosConIva: rev.gross,
      reportIngresosSinIva: rev.net,
      reportGananciaBruta,
      paidOrdersCount: paidOrders.length,
      expensesPesos,
      expensesCount,
    },
    error: null,
  };
}

export function aleyaExportFilename(yearMonth: string): string {
  return `ventas-aleya-${yearMonth}.csv`;
}

export function aleyaExportRangeFilename(fromYm: string, toYm: string): string {
  if (fromYm === toYm) return aleyaExportFilename(fromYm);
  return `ventas-aleya-${fromYm}_a_${toYm}.csv`;
}

/** Une varios meses en un CSV (BOM una sola vez; sección por mes). */
export function buildAleyaExportMultiMonthCsv(
  payloads: AleyaExportPayload[],
): string {
  if (payloads.length === 0) return "\uFEFF\r\n";
  if (payloads.length === 1) return buildAleyaExportCsv(payloads[0]!);

  const chunks: string[] = [];
  for (let i = 0; i < payloads.length; i++) {
    const p = payloads[i]!;
    let body = buildAleyaExportCsv(p).replace(/^\uFEFF/, "").replace(/\r?\n$/, "");
    if (i > 0) {
      chunks.push("");
      chunks.push(`===== ${p.monthLabel} ${p.yearMonth} =====`);
      chunks.push("");
    }
    chunks.push(body);
  }
  return `\uFEFF${chunks.join("\r\n")}\r\n`;
}
