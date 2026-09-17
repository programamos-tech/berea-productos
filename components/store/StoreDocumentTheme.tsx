"use client";

import { useLayoutEffect } from "react";
import {
  STORE_THEME_COOKIE,
  storefrontCssVars,
  type StorefrontTheme,
} from "@/lib/storefront-brand";

export function StoreDocumentTheme({
  theme,
  name,
}: {
  theme: StorefrontTheme;
  name: string;
}) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const vars = storefrontCssVars(theme);
    const previous = new Map<string, string>();
    for (const [key, value] of Object.entries(vars)) {
      previous.set(key, root.style.getPropertyValue(key));
      root.style.setProperty(key, value);
    }

    const payload = encodeURIComponent(
      JSON.stringify({
        a: theme.primary,
        h: theme.primaryHover,
        n: name,
        w: theme.wash,
      }),
    );
    document.cookie = `${STORE_THEME_COOKIE}=${payload}; Path=/; Max-Age=2592000; SameSite=Lax`;

    return () => {
      for (const [key, value] of previous) {
        if (value) root.style.setProperty(key, value);
        else root.style.removeProperty(key);
      }
    };
  }, [name, theme]);

  return null;
}
