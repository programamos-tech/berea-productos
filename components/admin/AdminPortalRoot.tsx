"use client";

import { useAdminTheme } from "@/components/admin/AdminThemeProvider";

/**
 * Portales a `document.body` quedan fuera de `AdminThemeProvider`.
 * Este wrapper re-aplica `data-admin-theme` para que `dark:` funcione.
 */
export function AdminPortalRoot({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const adminTheme = useAdminTheme();
  const resolved = adminTheme?.resolved ?? "light";

  return (
    <div
      data-admin-theme={resolved}
      className={className}
      style={{ colorScheme: resolved === "dark" ? "dark" : "light" }}
    >
      {children}
    </div>
  );
}
