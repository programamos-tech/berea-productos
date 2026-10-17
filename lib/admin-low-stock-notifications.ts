/** Misma franja que el filtro «Stock bajo» del inventario: 1–4 unidades. */
export const LOW_STOCK_MAX = 4;

export type LowStockNotice = {
  id: string;
  name: string;
  reference: string;
  quantity: number;
  read: boolean;
};

export type LowStockRow = {
  id: string;
  name: string;
  reference: string;
  quantity: number;
};

type SeenEntry = { qty: number; read: boolean };

export type LowStockSeen = Record<string, SeenEntry>;

const STORAGE_KEY = "admin_low_stock_seen_v1";

function parseSeen(value: unknown): LowStockSeen {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: LowStockSeen = {};
  for (const [id, entry] of Object.entries(value)) {
    if (!entry || typeof entry !== "object") continue;
    const qty = Number((entry as { qty?: unknown }).qty);
    const read = (entry as { read?: unknown }).read === true;
    if (!Number.isFinite(qty)) continue;
    out[id] = { qty: Math.max(0, Math.floor(qty)), read };
  }
  return out;
}

export function loadLowStockSeen(branchId: string): LowStockSeen {
  if (typeof window === "undefined" || !branchId) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parseSeen((parsed as Record<string, unknown>)[branchId]);
  } catch {
    return {};
  }
}

export function persistLowStockSeen(branchId: string, seen: LowStockSeen) {
  if (typeof window === "undefined" || !branchId) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    const all =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? { ...(parsed as Record<string, unknown>) }
        : {};
    all[branchId] = seen;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

/**
 * Avisa 1–4 unidades, y también el paso a cero si antes ya estaba bajo.
 * Un producto que siempre estuvo en cero no entra: el catálogo nace así.
 * Si la cantidad baja respecto a la última lectura, vuelve a quedar sin leer.
 */
export function reconcileLowStock(
  rows: LowStockRow[],
  seen: LowStockSeen,
): { notices: LowStockNotice[]; seen: LowStockSeen } {
  const next: LowStockSeen = {};
  const notices: LowStockNotice[] = [];

  for (const row of rows) {
    const quantity = Math.max(0, Math.floor(row.quantity));
    if (quantity > LOW_STOCK_MAX) continue;
    const prev = seen[row.id];
    if (quantity === 0 && !prev) continue;
    const read = Boolean(prev?.read && quantity >= prev.qty);
    next[row.id] = { qty: quantity, read };
    notices.push({ ...row, quantity, read });
  }

  notices.sort(
    (a, b) => a.quantity - b.quantity || a.name.localeCompare(b.name, "es"),
  );
  return { notices, seen: next };
}
