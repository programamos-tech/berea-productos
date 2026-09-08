"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function ExpenseConceptsFlash({
  message,
  variant,
  clearParam,
}: {
  message: string;
  variant: "ok" | "error";
  clearParam: "ok" | "error";
}) {
  const [visible, setVisible] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setVisible(true);
    const hide = window.setTimeout(() => setVisible(false), 2800);
    const clear = window.setTimeout(() => {
      const p = new URLSearchParams(searchParams.toString());
      p.delete(clearParam);
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 3200);
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(clear);
    };
  }, [message, clearParam, pathname, router, searchParams]);

  if (!visible) return null;

  const className =
    variant === "ok"
      ? "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 transition-opacity dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100"
      : "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 transition-opacity dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100";

  return (
    <p className={className} role="status">
      {message}
    </p>
  );
}
