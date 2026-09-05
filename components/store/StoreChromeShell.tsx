"use client";

import { useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { STORE_CHECKOUT_READY_EVENT } from "@/lib/store-checkout-nav";

function isCheckoutFormPath(pathname: string | null) {
  if (!pathname) return false;
  return pathname === "/checkout" || pathname === "/checkout/";
}

/**
 * En /checkout no monta navbar/footer hasta el evento "checkout ready".
 * Así no quedan pegados mientras carga el RSC.
 */
export function StoreChromeShell({
  top,
  bottom,
  children,
}: {
  top: React.ReactNode;
  bottom: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const onCheckoutForm = isCheckoutFormPath(pathname);
  const [ready, setReady] = useState(!onCheckoutForm);

  useLayoutEffect(() => {
    if (!onCheckoutForm) {
      setReady(true);
      return;
    }

    setReady(false);

    const onReady = () => setReady(true);
    window.addEventListener(STORE_CHECKOUT_READY_EVENT, onReady);
    const safety = window.setTimeout(onReady, 15_000);
    return () => {
      window.removeEventListener(STORE_CHECKOUT_READY_EVENT, onReady);
      window.clearTimeout(safety);
    };
  }, [onCheckoutForm, pathname]);

  const showChrome = !onCheckoutForm || ready;

  return (
    <>
      {showChrome ? top : null}
      {children}
      {showChrome ? bottom : null}
    </>
  );
}
