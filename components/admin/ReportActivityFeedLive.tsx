"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { actionTypeLabel, type AdminActivityAction } from "@/lib/admin-activity-log";
import type { ActivityFeedItem } from "@/lib/admin-activity-feed";
import { REPORT_STORE_TIME_ZONE } from "@/lib/admin-report-range";

const POLL_MS = 8_000;
const MAX_ITEMS = 18;

function formatRelativeWhen(iso: string, nowMs: number): string {
  try {
    const then = new Date(iso).getTime();
    const sec = Math.max(0, Math.floor((nowMs - then) / 1000));
    if (sec < 60) return "hace un momento";
    const min = Math.floor(sec / 60);
    if (min < 60) return `hace ${min} min`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `hace ${hr} h`;
    return new Intl.DateTimeFormat("es-CO", {
      timeZone: REPORT_STORE_TIME_ZONE,
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function dotClass(action: AdminActivityAction): string {
  switch (action) {
    case "sale_created":
      return "bg-emerald-500";
    case "sale_cancelled":
      return "bg-red-500";
    case "stock_adjusted":
    case "stock_transferred":
      return "bg-amber-500";
    case "cash_session_opened":
    case "cash_session_closed":
      return "bg-rose-500";
    case "product_created":
    case "product_updated":
      return "bg-sky-500";
    default:
      return "bg-zinc-500";
  }
}

export function ReportActivityFeedLive({
  initialItems,
}: {
  initialItems: ActivityFeedItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [freshIds, setFreshIds] = useState<Set<string>>(() => new Set());
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [moreBelow, setMoreBelow] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const knownIdsRef = useRef(new Set(initialItems.map((i) => i.id)));

  const updateMoreBelow = useCallback(() => {
    const el = listRef.current;
    if (!el) {
      setMoreBelow(false);
      return;
    }
    const room = el.scrollHeight - el.clientHeight - el.scrollTop;
    setMoreBelow(room > 8);
  }, []);

  useEffect(() => {
    updateMoreBelow();
    const el = listRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => updateMoreBelow());
    ro.observe(el);
    return () => ro.disconnect();
  }, [items, updateMoreBelow]);

  useEffect(() => {
    const tick = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    async function poll() {
      try {
        const res = await fetch("/api/admin/activity-feed", {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { items?: ActivityFeedItem[] };
        const next = (data.items ?? []).slice(0, MAX_ITEMS);
        if (cancelled) return;

        const incoming = next.filter((row) => !knownIdsRef.current.has(row.id));
        if (incoming.length > 0) {
          for (const row of incoming) knownIdsRef.current.add(row.id);
          setFreshIds((prev) => {
            const s = new Set(prev);
            for (const row of incoming) s.add(row.id);
            return s;
          });
          window.setTimeout(() => {
            if (cancelled) return;
            setFreshIds((prev) => {
              const s = new Set(prev);
              for (const row of incoming) s.delete(row.id);
              return s;
            });
          }, 1400);
          const el = listRef.current;
          if (el && el.scrollTop < 24) {
            el.scrollTop = 0;
          }
        } else {
          for (const row of next) knownIdsRef.current.add(row.id);
        }
        setItems(next);
      } catch {
        /* silencioso: reintenta en el siguiente ciclo */
      } finally {
        if (!cancelled) {
          timer = window.setTimeout(poll, POLL_MS);
        }
      }
    }

    timer = window.setTimeout(poll, POLL_MS);
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  function scrollMore() {
    const el = listRef.current;
    if (!el) return;
    el.scrollBy({ top: Math.max(120, el.clientHeight * 0.45), behavior: "smooth" });
  }

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-end justify-between gap-2">
        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Actividad reciente
          </h2>
        </div>
        <Link
          href="/admin/actividades"
          className="text-[11px] font-medium text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline dark:hover:text-zinc-200"
        >
          Ver todo
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">Todavía no hay actividades.</p>
      ) : (
        <div className="relative mt-3 min-h-0 flex-1">
          <ul
            ref={listRef}
            onScroll={updateMoreBelow}
            className="reports-activity-scroll h-full space-y-0 overflow-y-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((row) => {
              const fresh = freshIds.has(row.id);
              const body = (
                <>
                  <span
                    className={`mt-1.5 size-1.5 shrink-0 rounded-full ${dotClass(row.action_type)}`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 border-b border-zinc-200/60 pb-2.5 dark:border-zinc-800/80">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                        {actionTypeLabel(row.action_type)}
                      </span>
                      <time
                        dateTime={row.created_at}
                        className="shrink-0 text-[10px] tabular-nums text-zinc-500"
                      >
                        {formatRelativeWhen(row.created_at, nowMs)}
                      </time>
                    </span>
                    <span className="mt-0.5 block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {row.summary}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-zinc-500">
                      {row.actor}
                    </span>
                  </span>
                </>
              );

              return (
                <li
                  key={row.id}
                  className={fresh ? "reports-activity-fresh" : undefined}
                >
                  {row.href ? (
                    <Link
                      href={row.href}
                      className="flex gap-2.5 py-1.5 transition hover:opacity-90"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="flex gap-2.5 py-1.5">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>

          {moreBelow ? (
            <button
              type="button"
              onClick={scrollMore}
              className="reports-activity-more absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-white via-white/90 to-transparent pb-1 pt-6 dark:from-zinc-950 dark:via-zinc-950/90"
              aria-label="Ver más actividades"
            >
              <ChevronDown
                className="size-4 text-zinc-400 dark:text-zinc-500"
                strokeWidth={2.25}
                aria-hidden
              />
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
