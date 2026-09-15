"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useAdminTheme } from "@/components/admin/AdminThemeProvider";
import { adminProductBrand, adminSidebarLogoPath } from "@/lib/brand";

export type AccountSwitchPayload =
  | {
      mode: "enter";
      name: string;
      logoSrc: string;
      holderName: string;
    }
  | {
      mode: "leave";
    };

const MIN_VISIBLE_MS = 850;
const SAFETY_MS = 15000;

const AccountSwitchContext = createContext<
  ((payload: AccountSwitchPayload) => void) | null
>(null);

export function useAccountSwitchLoading() {
  return useContext(AccountSwitchContext) ?? (() => {});
}

function destinationReached(pathname: string, mode: AccountSwitchPayload["mode"]) {
  if (mode === "leave") return pathname === "/admin/cuentas";
  return (
    pathname.startsWith("/admin") &&
    pathname !== "/admin/cuentas" &&
    pathname !== "/admin/login"
  );
}

function Overlay({ payload }: { payload: AccountSwitchPayload }) {
  const theme = useAdminTheme()?.resolved ?? "light";
  const isEnter = payload.mode === "enter";
  const title = isEnter ? payload.name : "Cuentas";
  const kicker = isEnter ? "Entrando a" : "Volviendo a";
  const detail = isEnter ? `Cuenta de ${payload.holderName}` : "Selector de clientes";

  const node = (
    <div
      data-admin-theme={theme}
      className="account-switch-overlay fixed inset-0 z-[300] flex items-center justify-center bg-white/92 px-6 backdrop-blur-md dark:bg-zinc-950/92"
      role="status"
      aria-live="assertive"
      aria-busy="true"
      aria-label={`${kicker} ${title}`}
    >
      <div className="account-switch-overlay-bar" aria-hidden />
      <div className="account-switch-overlay-card flex w-full max-w-sm flex-col items-center text-center">
        {isEnter ? (
          <span className="relative grid size-[4.75rem] place-items-center">
            <span className="account-switch-overlay-ring absolute inset-0 rounded-full" />
            <span className="relative size-16 overflow-hidden rounded-2xl ring-1 ring-zinc-200/80 dark:ring-zinc-700/80">
              <Image
                src={payload.logoSrc}
                alt=""
                width={128}
                height={128}
                className="size-full object-cover"
                priority
              />
            </span>
          </span>
        ) : (
          <span className="flex flex-col items-center gap-4">
            <span className="account-switch-overlay-spinner" aria-hidden />
            <Image
              src={adminSidebarLogoPath}
              alt={adminProductBrand}
              width={480}
              height={265}
              className="h-8 w-auto max-w-[10.5rem] object-contain"
              priority
            />
          </span>
        )}
        <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          {kicker}
        </p>
        <p className="mt-1.5 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {title}
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{detail}</p>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(node, document.body);
}

export function AccountSwitchLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [payload, setPayload] = useState<AccountSwitchPayload | null>(null);
  const startedAtRef = useRef(0);

  const begin = useCallback((next: AccountSwitchPayload) => {
    startedAtRef.current = Date.now();
    setPayload(next);
  }, []);

  useEffect(() => {
    if (!payload) return;
    if (!destinationReached(pathname, payload.mode)) return;
    const wait = Math.max(
      0,
      MIN_VISIBLE_MS - (Date.now() - startedAtRef.current),
    );
    const t = window.setTimeout(() => setPayload(null), wait);
    return () => window.clearTimeout(t);
  }, [pathname, payload]);

  useEffect(() => {
    if (!payload) return;
    const t = window.setTimeout(() => setPayload(null), SAFETY_MS);
    return () => window.clearTimeout(t);
  }, [payload]);

  const value = useMemo(() => begin, [begin]);

  return (
    <AccountSwitchContext.Provider value={value}>
      {children}
      {payload ? <Overlay payload={payload} /> : null}
    </AccountSwitchContext.Provider>
  );
}
