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
  type AdminWebOrderNotification,
  loadPersistedNotificationIds,
  persistNotificationIds,
  rowToWebOrderNotification,
} from "@/lib/admin-web-order-notifications";
import { isDocumentVisible, trimSet } from "@/lib/document-visibility";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Ctx = {
  notifications: AdminWebOrderNotification[];
  unreadCount: number;
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  markRead: (id: string) => void;
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
const SEEN_IDS_CAP = 400;
const ORDER_SELECT =
  "id, status, customer_name, customer_email, total_cents, created_at, checkout_payment_method, wompi_reference";

export function AdminOrderNotificationsProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<AdminWebOrderNotification[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const bootstrappedRef = useRef(false);

  const pushNotification = useCallback((item: AdminWebOrderNotification) => {
    const isNew = !seenIdsRef.current.has(item.id);
    if (isNew) {
      seenIdsRef.current.add(item.id);
      trimSet(seenIdsRef.current, SEEN_IDS_CAP);
      persistNotificationIds(seenIdsRef.current);
    }

    setNotifications((prev) => {
      if (prev.some((n) => n.id === item.id)) {
        return prev.map((n) => (n.id === item.id ? { ...n, ...item } : n));
      }
      return [{ ...item, read: false }, ...prev].slice(0, 30);
    });
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  useEffect(() => {
    if (!enabled) return;

    seenIdsRef.current = loadPersistedNotificationIds();
    const supabase = createSupabaseBrowserClient();

    let channel: RealtimeChannel | null = null;
    let pollTimer: number | undefined;
    let pollInFlight = false;
    let cancelled = false;

    const stopChannel = () => {
      if (channel) {
        void supabase.removeChannel(channel);
        channel = null;
      }
    };

    const stopPoll = () => {
      if (pollTimer != null) {
        window.clearInterval(pollTimer);
        pollTimer = undefined;
      }
    };

    const pollPending = async () => {
      if (cancelled || pollInFlight || !isDocumentVisible()) return;
      pollInFlight = true;
      try {
        const { data } = await supabase
          .from("orders")
          .select(ORDER_SELECT)
          .eq("status", "pending")
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

    const startChannel = () => {
      if (cancelled || channel) return;
      channel = supabase
        .channel("admin-web-orders")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "orders" },
          (payload) => {
            if (!isDocumentVisible()) return;
            const item = rowToWebOrderNotification(
              payload.new as Record<string, unknown>,
            );
            if (item) pushNotification(item);
          },
        )
        .subscribe();
    };

    const startPoll = () => {
      if (cancelled || pollTimer != null) return;
      pollTimer = window.setInterval(() => {
        void pollPending();
      }, POLL_MS);
    };

    const bootstrap = async () => {
      if (bootstrappedRef.current) return;
      bootstrappedRef.current = true;
      const { data } = await supabase
        .from("orders")
        .select(ORDER_SELECT)
        .eq("status", "pending")
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
      startPoll();
      void pollPending();
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
  }, [enabled, pushNotification]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      panelOpen,
      setPanelOpen,
      markRead,
      markAllRead,
    }),
    [notifications, unreadCount, panelOpen, markRead, markAllRead],
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
