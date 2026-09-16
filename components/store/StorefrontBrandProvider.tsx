"use client";

import { createContext, useContext } from "react";
import type { StorefrontClientChrome } from "@/lib/storefront-brand";

const StorefrontBrandContext =
  createContext<StorefrontClientChrome | null>(null);

export function StorefrontBrandProvider({
  chrome,
  children,
}: {
  chrome: StorefrontClientChrome;
  children: React.ReactNode;
}) {
  return (
    <StorefrontBrandContext.Provider value={chrome}>
      {children}
    </StorefrontBrandContext.Provider>
  );
}

export function useStorefrontBrand(): StorefrontClientChrome {
  const chrome = useContext(StorefrontBrandContext);
  if (!chrome) {
    throw new Error("useStorefrontBrand must be used inside StorefrontBrandProvider");
  }
  return chrome;
}
