"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "tiendas-admin-theme";

/** Coincide con `dark:bg-zinc-950` del shell admin. */
export const ADMIN_THEME_COLOR_LIGHT = "#ffffff";
export const ADMIN_THEME_COLOR_DARK = "#09090b";

export type AdminThemeMode = "light" | "dark";

type AdminThemeContextValue = {
  theme: AdminThemeMode;
  setTheme: (t: AdminThemeMode) => void;
  resolved: AdminThemeMode;
};

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

export function useAdminTheme(): AdminThemeContextValue | null {
  return useContext(AdminThemeContext);
}

function applyBrowserChromeTheme(theme: AdminThemeMode) {
  const color =
    theme === "dark" ? ADMIN_THEME_COLOR_DARK : ADMIN_THEME_COLOR_LIGHT;

  document.documentElement.style.colorScheme = theme;
  document.documentElement.style.backgroundColor = color;

  let metas = document.querySelectorAll('meta[name="theme-color"]');
  if (!metas.length) {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
    metas = document.querySelectorAll('meta[name="theme-color"]');
  }
  metas.forEach((meta) => {
    meta.setAttribute("content", color);
    meta.removeAttribute("media");
  });

  // Safari iOS (PWA / barra de estado): black-translucent + fondo oscuro.
  let apple = document.querySelector(
    'meta[name="apple-mobile-web-app-status-bar-style"]',
  );
  if (!apple) {
    apple = document.createElement("meta");
    apple.setAttribute("name", "apple-mobile-web-app-status-bar-style");
    document.head.appendChild(apple);
  }
  apple.setAttribute(
    "content",
    theme === "dark" ? "black-translucent" : "default",
  );

  document.body.style.backgroundColor = color;
  document.body.style.colorScheme = theme;
}

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AdminThemeMode>("light");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "dark" || raw === "light") setThemeState(raw);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return;
      if (e.newValue === "dark" || e.newValue === "light") {
        setThemeState(e.newValue);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    applyBrowserChromeTheme(theme);
    return () => {
      // Al salir del admin, volver a chrome claro de la tienda.
      document.documentElement.style.colorScheme = "";
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
      document.body.style.colorScheme = "";
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", ADMIN_THEME_COLOR_LIGHT);
    };
  }, [theme]);

  const setTheme = useCallback((t: AdminThemeMode) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, resolved: theme }),
    [theme, setTheme],
  );

  return (
    <AdminThemeContext.Provider value={value}>
      <div
        data-admin-theme={theme}
        className="min-h-full bg-white text-stone-900 antialiased dark:bg-zinc-950 dark:text-zinc-100"
        style={{ colorScheme: theme === "dark" ? "dark" : "light" }}
      >
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}
