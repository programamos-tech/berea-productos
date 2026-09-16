"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  parseFavoriteIdsFromStorage,
  storeFavoritesStorageKey,
  writeFavoriteIdsToStorage,
} from "@/lib/store-favorites";
import { useStorefrontBrand } from "@/components/store/StorefrontBrandProvider";

type StoreFavoritesContextValue = {
  /** IDs en el orden en que el usuario los agregó */
  ids: readonly string[];
  ready: boolean;
  has: (productId: string) => boolean;
  toggle: (productId: string) => void;
  count: number;
};

const StoreFavoritesContext = createContext<StoreFavoritesContextValue | null>(
  null,
);

export function StoreFavoritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const chrome = useStorefrontBrand();
  const storageKey = storeFavoritesStorageKey(chrome.tenantSlug);
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setIds(parseFavoriteIdsFromStorage(storageKey));
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey) {
        setIds(parseFavoriteIdsFromStorage(storageKey));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey]);

  const toggle = useCallback((productId: string) => {
    setIds((prev) => {
      const next = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      try {
        writeFavoriteIdsToStorage(storageKey, next);
      } catch {
        /* quota u otro */
      }
      return next;
    });
  }, [storageKey]);

  const has = useCallback(
    (productId: string) => ids.includes(productId),
    [ids],
  );

  const value = useMemo(
    (): StoreFavoritesContextValue => ({
      ids,
      ready,
      has,
      toggle,
      count: ids.length,
    }),
    [ids, ready, has, toggle],
  );

  return (
    <StoreFavoritesContext.Provider value={value}>
      {children}
    </StoreFavoritesContext.Provider>
  );
}

export function useStoreFavorites() {
  const ctx = useContext(StoreFavoritesContext);
  if (!ctx) {
    throw new Error("useStoreFavorites debe usarse dentro de StoreFavoritesProvider");
  }
  return ctx;
}
