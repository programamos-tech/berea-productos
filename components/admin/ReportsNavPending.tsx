"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

type ReportsNavPendingContextValue = {
  isPending: boolean;
  /** Marca la URL destino antes de `router.push` para mostrar loading al instante. */
  markNav: (href: string) => void;
};

const ReportsNavPendingContext =
  createContext<ReportsNavPendingContextValue | null>(null);

function normalizeHref(href: string): string {
  try {
    const u = new URL(href, "http://local.invalid");
    const qs = u.searchParams.toString();
    return qs ? `${u.pathname}?${qs}` : u.pathname;
  } catch {
    return href;
  }
}

function currentHref(pathname: string, search: string): string {
  return search ? `${pathname}?${search}` : pathname;
}

export function ReportsNavPendingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const live = currentHref(pathname, searchParams.toString());
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    if (target == null) return;
    if (normalizeHref(target) === live) setTarget(null);
  }, [live, target]);

  const markNav = useCallback((href: string) => {
    setTarget(normalizeHref(href));
  }, []);

  const value = useMemo(
    () => ({
      isPending: target != null && normalizeHref(target) !== live,
      markNav,
    }),
    [target, live, markNav],
  );

  return (
    <ReportsNavPendingContext.Provider value={value}>
      {children}
    </ReportsNavPendingContext.Provider>
  );
}

export function useReportsNavPending(): ReportsNavPendingContextValue {
  const ctx = useContext(ReportsNavPendingContext);
  if (!ctx) {
    return {
      isPending: false,
      markNav: () => {},
    };
  }
  return ctx;
}

/** Mientras navega el filtro, muestra fallback en vez del contenido viejo. */
export function ReportsPendingSwap({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  const { isPending } = useReportsNavPending();
  if (isPending) return <>{fallback}</>;
  return <>{children}</>;
}
