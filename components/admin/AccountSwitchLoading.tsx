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

const MIN_VISIBLE_MS = 700;
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
  const label = payload.mode === "enter" ? payload.name : "Cuentas";

  const node = (
    <div
      data-admin-theme={theme}
      className="account-switch-overlay fixed inset-0 z-[300] flex items-center justify-center bg-white dark:bg-zinc-950"
      role="status"
      aria-live="assertive"
      aria-busy="true"
      aria-label={label}
    >
      <div className="flex flex-col items-center">
        <Image
          src={adminSidebarLogoPath}
          alt={adminProductBrand}
          width={480}
          height={265}
          className="account-switch-overlay-mark h-7 w-auto max-w-[8.5rem] object-contain sm:h-8 sm:max-w-[9.5rem]"
          priority
        />
        <p className="mt-4 text-[13px] font-medium tracking-tight text-zinc-400 dark:text-zinc-500">
          {label}
        </p>
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
