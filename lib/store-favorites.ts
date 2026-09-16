/** Clave de localStorage para IDs de productos favoritos (orden de guardado). */
export const STORE_FAVORITES_STORAGE_KEY = "tiendas-store-favorites-v1" as const;

export function storeFavoritesStorageKey(tenantSlug: string): string {
  return `${STORE_FAVORITES_STORAGE_KEY}:${tenantSlug}`;
}

export function parseFavoriteIdsFromStorage(storageKey: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export function writeFavoriteIdsToStorage(storageKey: string, ids: string[]) {
  localStorage.setItem(storageKey, JSON.stringify(ids));
}
