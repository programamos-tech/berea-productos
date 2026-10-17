"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type LowStockNotice,
  type LowStockRow,
  type LowStockSeen,
  LOW_STOCK_MAX,
  loadLowStockSeen,
  persistLowStockSeen,
  reconcileLowStock,
} from "@/lib/admin-low-stock-notifications";
import {
  type AdminWebOrderNotification,
  loadPersistedNotificationIds,
  persistNotificationIds,
  rowToWebOrderNotification,
} from "@/lib/admin-web-order-notifications";
import { isDocumentVisible, trimSet } from "@/lib/document-visibility";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

type Ctx = {
  ordersEnabled: boolean;
  stockEnabled: boolean;
  notifications: AdminWebOrderNotification[];
  lowStock: LowStockNotice[];
  unreadCount: number;
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  markRead: (id: string, kind: "order" | "stock") => void;
  markAllRead: () => void;
};

const AdminOrderNotificationsContext = createContext<Ctx | null>(null);

export function useAdminOrderNotifications() {
  const ctx = useContext(AdminOrderNotificationsContext);
  if (!ctx) {
    throw new Error("useAdminOrderNotifications debe usarse dentro del provider");
  }
  return ctx;
}

const POLL_MS = 30_000;
const STOCK_POLL_MS = 60_000;
const SEEN_IDS_CAP = 400;
const ORDER_SELECT =
  "id, status, customer_name, customer_email, total_cents, created_at, checkout_payment_method, wompi_reference";

async function fetchLowStockRows(
  supabase: SupabaseClient,
  branchId: string,
  seen: LowStockSeen,
): Promise<LowStockRow[]> {
  const { data, error } = await supabase
    .from("branch_inventory")
    .select("product_id, quantity")
    .eq("branch_id", branchId)
    .lte("quantity", LOW_STOCK_MAX);
  if (error) {
    console.error("[low-stock]", error.message);
    return [];
  }

  const qtyById = new Map<string, number>();
  for (const row of data ?? []) {
    const id = String((row as { product_id?: unknown }).product_id ?? "");
    if (!id) continue;
    const quantity = Math.max(
      0,
      Math.floor(Number((row as { quantity?: unknown }).quantity ?? 0)),
    );
    if (quantity > LOW_STOCK_MAX) continue;
    if (quantity === 0 && !seen[id]) continue;
    qtyById.set(id, quantity);
  }
  const ids = [...qtyById.keys()];
  if (ids.length === 0) return [];

  const products: { id: string; name?: string | null; reference?: string | null }[] = [];
  for (let i = 0; i < ids.length; i += 80) {
    const slice = ids.slice(i, i + 80);
    const withRef = await supabase
      .from("products")
      .select("id, name, reference")
      .in("id", slice);
    const batch = withRef.error
      ? await supabase.from("products").select("id, name").in("id", slice)
      : withRef;
    if (batch.error) {
      console.error("[low-stock] products", batch.error.message);
      continue;
    }
    products.push(
      ...((batch.data ?? []) as {
        id: string;
        name?: string | null;
        reference?: string | null;
      }[]),
    );
  }

  const byId = new Map(products.map((p) => [String(p.id), p]));
  return ids.map((id) => {
    const product = byId.get(id);
    return {
      id,
      name: String(product?.name ?? "Producto").trim() || "Producto",
      reference: String(product?.reference ?? "").trim(),
      quantity: qtyById.get(id) ?? 0,
    };
  });
}

export function AdminOrderNotificationsProvider({
  ordersEnabled,
  stockEnabled,
  branchId,
  children,
}: {
  ordersEnabled: boolean;
  stockEnabled: boolean;
  branchId: string;
  children: React.ReactNode;
}) {
  const enabled = ordersEnabled || stockEnabled;
  const [notifications, setNotifications] = useState<AdminWebOrderNotification[]>([]);
  const [lowStock, setLowStock] = useState<LowStockNotice[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const stockSeenRef = useRef<LowStockSeen>({});

  const pushNotification = useCallback((item: AdminWebOrderNotification) => {
    setNotifications((prev) => {
      if (prev.some((n) => n.id === item.id)) {
        return prev.map((n) =>
          n.id === item.id ? { ...item, read: n.read } : n,
        );
      }
      return [
        { ...item, read: seenIdsRef.current.has(item.id) },
        ...prev,
      ].slice(0, 30);
    });
  }, []);

  const markRead = useCallback((id: string, kind: "order" | "stock") => {
    if (kind === "order") {
      seenIdsRef.current.add(id);
      trimSet(seenIdsRef.current, SEEN_IDS_CAP);
      persistNotificationIds(seenIdsRef.current);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      return;
    }
    setLowStock((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      const current = next.find((n) => n.id === id);
      if (current) {
        stockSeenRef.current = {
          ...stockSeenRef.current,
          [id]: { qty: current.quantity, read: true },
        };
        persistLowStockSeen(branchId, stockSeenRef.current);
      }
      return next;
    });
  }, [branchId]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      for (const item of prev) seenIdsRef.current.add(item.id);
      trimSet(seenIdsRef.current, SEEN_IDS_CAP);
      persistNotificationIds(seenIdsRef.current);
      return prev.map((n) => ({ ...n, read: true }));
    });
    setLowStock((prev) => {
      const seen = { ...stockSeenRef.current };
      for (const item of prev) seen[item.id] = { qty: item.quantity, read: true };
      stockSeenRef.current = seen;
      persistLowStockSeen(branchId, seen);
      return prev.map((n) => ({ ...n, read: true }));
    });
  }, [branchId]);

  useEffect(() => {
    if (!ordersEnabled) {
      setNotifications([]);
      return;
    }

    seenIdsRef.current = loadPersistedNotificationIds();
    const supabase = createSupabaseBrowserClient();

    let channel: RealtimeChannel | null = null;
    let pollTimer: number | undefined;
    let fallbackTimer: number | undefined;
    let pollInFlight = false;
    let cancelled = false;
    let realtimeOk = false;

    const stopChannel = () => {
      if (channel) {
        void supabase.removeChannel(channel);
        channel = null;
      }
      realtimeOk = false;
    };

    const stopPoll = () => {
      if (pollTimer != null) {
        window.clearInterval(pollTimer);
        pollTimer = undefined;
      }
      if (fallbackTimer != null) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = undefined;
      }
    };

    const pollPending = async () => {
      if (cancelled || pollInFlight || !isDocumentVisible() || realtimeOk) {
        return;
      }
      pollInFlight = true;
      try {
        const { data } = await supabase
          .from("orders")
          .select(ORDER_SELECT)
          .eq("status", "pending")
          .eq("branch_id", branchId)
          .order("created_at", { ascending: false })
          .limit(3);
        if (cancelled) return;
        for (const row of data ?? []) {
          const item = rowToWebOrderNotification(row as Record<string, unknown>);
          if (item) pushNotification(item);
        }
      } finally {
        pollInFlight = false;
      }
    };

    const startPoll = () => {
      if (cancelled || pollTimer != null || realtimeOk) return;
      pollTimer = window.setInterval(() => {
        void pollPending();
      }, POLL_MS);
    };

    const startChannel = () => {
      if (cancelled || channel) return;
      channel = supabase
        .channel(`admin-web-orders:${branchId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "orders",
            filter: `branch_id=eq.${branchId}`,
          },
          (payload) => {
            if (!isDocumentVisible()) return;
            const item = rowToWebOrderNotification(
              payload.new as Record<string, unknown>,
            );
            if (item) pushNotification(item);
          },
        )
        .subscribe((status) => {
          if (cancelled) return;
          if (status === "SUBSCRIBED") {
            realtimeOk = true;
            stopPoll();
            return;
          }
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            realtimeOk = false;
            startPoll();
            void pollPending();
          }
        });

      if (fallbackTimer != null) window.clearTimeout(fallbackTimer);
      fallbackTimer = window.setTimeout(() => {
        fallbackTimer = undefined;
        if (!cancelled && !realtimeOk) {
          startPoll();
          void pollPending();
        }
      }, 4000);
    };

    const bootstrap = async () => {
      const { data } = await supabase
        .from("orders")
        .select(ORDER_SELECT)
        .eq("status", "pending")
        .eq("branch_id", branchId)
        .order("created_at", { ascending: false })
        .limit(8);

      if (cancelled) return;

      const items = (data ?? [])
        .map((row) => rowToWebOrderNotification(row as Record<string, unknown>))
        .filter((n): n is AdminWebOrderNotification => n != null)
        .map((n) => ({
          ...n,
          read: seenIdsRef.current.has(n.id),
        }));

      setNotifications(items);
    };

    const resume = () => {
      if (cancelled || !isDocumentVisible()) return;
      startChannel();
    };

    const pause = () => {
      stopPoll();
      stopChannel();
    };

    const onVisibility = () => {
      if (isDocumentVisible()) resume();
      else pause();
    };

    void (async () => {
      await bootstrap();
      if (cancelled) return;
      if (isDocumentVisible()) resume();
    })();

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      pause();
    };
  }, [branchId, ordersEnabled, pushNotification]);

  useEffect(() => {
    if (!stockEnabled) {
      setLowStock([]);
      return;
    }

    stockSeenRef.current = loadLowStockSeen(branchId);
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;
    let timer: number | undefined;
    let inFlight = false;

    const refresh = async () => {
      if (cancelled || inFlight || !isDocumentVisible()) return;
      inFlight = true;
      try {
        const rows = await fetchLowStockRows(
          supabase,
          branchId,
          stockSeenRef.current,
        );
        if (cancelled) return;
        const next = reconcileLowStock(rows, stockSeenRef.current);
        stockSeenRef.current = next.seen;
        persistLowStockSeen(branchId, next.seen);
        setLowStock(next.notices);
      } finally {
        inFlight = false;
      }
    };

    const start = () => {
      if (cancelled || timer != null) return;
      timer = window.setInterval(() => {
        void refresh();
      }, STOCK_POLL_MS);
    };

    const stop = () => {
      if (timer != null) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };

    const onVisibility = () => {
      if (!isDocumentVisible()) {
        stop();
        return;
      }
      void refresh();
      start();
    };

    void refresh();
    if (isDocumentVisible()) start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [branchId, stockEnabled]);

  const unreadCount = useMemo(
    () =>
      notifications.filter((n) => !n.read).length +
      lowStock.filter((n) => !n.read).length,
    [notifications, lowStock],
  );

  const value = useMemo(
    () => ({
      ordersEnabled,
      stockEnabled,
      notifications,
      lowStock,
      unreadCount,
      panelOpen,
      setPanelOpen,
      markRead,
      markAllRead,
    }),
    [
      ordersEnabled,
      stockEnabled,
      notifications,
      lowStock,
      unreadCount,
      panelOpen,
      markRead,
      markAllRead,
    ],
  );

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <AdminOrderNotificationsContext.Provider value={value}>
      {children}
    </AdminOrderNotificationsContext.Provider>
  );
}
