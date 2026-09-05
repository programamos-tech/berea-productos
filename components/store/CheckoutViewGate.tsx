"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckoutRouteLoadingScreen } from "@/components/store/CheckoutRouteLoadingScreen";
import {
  clearStoreCheckoutNavigation,
  removeStoreCheckoutBootOverlay,
  resetStoreCheckoutReady,
  signalStoreCheckoutReady,
  STORE_CHECKOUT_NAV_HTML_CLASS,
} from "@/lib/store-checkout-nav";

function isCheckoutFormPath(pathname: string | null) {
  if (!pathname) return false;
  return pathname === "/checkout" || pathname === "/checkout/";
}

/**
 * En cada carga de /checkout: animación a pantalla completa hasta que
 * `[data-checkout-root]` ya tiene layout real. Luego revela la vista entera.
 */
export function CheckoutViewGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const gate = isCheckoutFormPath(pathname);
  const [ready, setReady] = useState(!gate);

  useEffect(() => {
    if (!gate) {
      setReady(true);
      return;
    }

    let cancelled = false;
    let timer: number | undefined;
    let paintPasses = 0;

    setReady(false);
    resetStoreCheckoutReady();
    document.documentElement.classList.add(STORE_CHECKOUT_NAV_HTML_CLASS);

    const finish = () => {
      if (cancelled) return;
      removeStoreCheckoutBootOverlay();
      clearStoreCheckoutNavigation();
      document.documentElement.classList.remove(STORE_CHECKOUT_NAV_HTML_CLASS);
      // Primero monta navbar/footer debajo del overlay; luego revela todo junto.
      signalStoreCheckoutReady();
      requestAnimationFrame(() => {
        if (!cancelled) setReady(true);
      });
    };

    const poll = () => {
      if (cancelled) return;
      const root = document.querySelector("[data-checkout-root]");
      // invisible preserva el alto; medimos el root real
      const h = root?.getBoundingClientRect().height ?? 0;
      if (root && h >= 100) {
        paintPasses += 1;
        if (paintPasses >= 3) {
          timer = window.setTimeout(finish, 80);
          return;
        }
      } else {
        paintPasses = 0;
      }
      timer = window.setTimeout(poll, 40);
    };

    timer = window.setTimeout(poll, 40);
    const safety = window.setTimeout(finish, 15_000);

    return () => {
      cancelled = true;
      if (timer != null) window.clearTimeout(timer);
      window.clearTimeout(safety);
    };
  }, [gate, pathname]);

  if (!gate) return <>{children}</>;

  return (
    <>
      {/* Sigue en layout (alto real) pero tapado por el overlay hasta ready */}
      <div className={ready ? undefined : "invisible"} aria-hidden={!ready}>
        {children}
      </div>
      {ready ? null : <CheckoutRouteLoadingScreen />}
    </>
  );
}
