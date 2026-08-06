import type { SupabaseClient } from "@supabase/supabase-js";
import { createdAtBoundsForReportYmdRange } from "@/lib/admin-report-range";
import type { VentaEstadoFilter, VentaPagoFilter } from "@/lib/ventas-sales";

export type VentaOrderRow = {
  id: string;
  status: string;
  customer_name: string;
  total_cents: number;
  created_at: string;
  wompi_reference: string | null;
  customer_email: string | null;
};

/** Columnas presentes en prod y local (sin checkout_payment_method). */
const VENTAS_SELECT =
  "id,status,customer_name,total_cents,created_at,wompi_reference,customer_email";

type VentasFilterOpts = {
  q?: string;
  status: VentaEstadoFilter;
  payment: VentaPagoFilter;
  dateFrom: string | null;
  dateTo: string | null;
};

function sanitizeIlikeQuery(q: string): string {
  return q.replace(/[%_\\,]/g, "").trim().slice(0, 80);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyVentaPagoFilter(query: any, payment: VentaPagoFilter) {
  if (payment === "all") return query;
  if (payment === "cash") {
    return query.eq("wompi_reference", "POS:cash");
  }
  if (payment === "transfer") {
    return query.eq("wompi_reference", "POS:transfer");
  }
  if (payment === "mixed") {
    return query.eq("wompi_reference", "POS:mixed");
  }
  if (payment === "online") {
    return query.not("wompi_reference", "like", "POS:%");
  }
  return query;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyVentaTextFilter(query: any, q: string) {
  const term = sanitizeIlikeQuery(q);
  if (!term) return query;
  const pattern = `%${term}%`;
  const compact = term.replace(/-/g, "").toLowerCase();
  const orParts = [
    `customer_name.ilike.${pattern}`,
    `customer_email.ilike.${pattern}`,
  ];
  if (/^[0-9a-f-]{8,}$/i.test(term)) {
    orParts.push(`id.ilike.%${compact}%`);
  }
  return query.or(orParts.join(","));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyVentasFilters(query: any, opts: VentasFilterOpts) {
  if (opts.dateFrom || opts.dateTo) {
    const lo = opts.dateFrom ?? "1970-01-01";
    const hi = opts.dateTo ?? opts.dateFrom ?? "1970-01-01";
    const fromYmd = lo <= hi ? lo : hi;
    const toYmd = lo <= hi ? hi : lo;
    const bounds = createdAtBoundsForReportYmdRange(fromYmd, toYmd);
    if (bounds) {
      query = query.gte("created_at", bounds.gte).lt("created_at", bounds.lt);
    }
  }

  if (opts.status !== "all") {
    query = query.eq("status", opts.status);
  }

  query = applyVentaPagoFilter(query, opts.payment);

  if (opts.q?.trim()) {
    query = applyVentaTextFilter(query, opts.q);
  }

  return query;
}

export type FetchAdminVentasPageOpts = VentasFilterOpts & {
  page: number;
  pageSize: number;
};

export type FetchAdminVentasPageResult = {
  rows: VentaOrderRow[];
  total: number;
  error: string | null;
};

export async function fetchAdminVentasPage(
  supabase: SupabaseClient,
  opts: FetchAdminVentasPageOpts,
): Promise<FetchAdminVentasPageResult> {
  const safePage = Math.max(1, Math.floor(opts.page));
  const safeSize = Math.min(100, Math.max(1, Math.floor(opts.pageSize)));
  const from = (safePage - 1) * safeSize;
  const to = from + safeSize - 1;

  const listRes = await applyVentasFilters(
    supabase.from("orders").select(VENTAS_SELECT, { count: "exact" }),
    opts,
  )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (listRes.error) {
    return {
      rows: [],
      total: 0,
      error: listRes.error.message,
    };
  }

  return {
    rows: (listRes.data ?? []) as VentaOrderRow[],
    total: listRes.count ?? 0,
    error: null,
  };
}
