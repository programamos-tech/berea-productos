"use client";

import { useEffect } from "react";
import { isDocumentVisible } from "@/lib/document-visibility";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * After a long background tab, resume auth refresh before UI polls fire,
 * so navigation/API calls don't wait on a stale JWT.
 */
export function AdminAuthVisibilityKeepAlive() {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const sync = () => {
      if (isDocumentVisible()) {
        void supabase.auth.startAutoRefresh();
        void supabase.auth.getSession();
      } else {
        void supabase.auth.stopAutoRefresh();
      }
    };

    sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      void supabase.auth.startAutoRefresh();
    };
  }, []);

  return null;
}
