"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  adminNavItemActive,
  filterAdminNavSections,
  flattenAdminNavItems,
} from "@/components/admin/admin-nav-config";

export function AdminMobileBottomNav({
  allowedNavHrefs,
}: {
  allowedNavHrefs: string[];
}) {
  const pathname = usePathname();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const items = flattenAdminNavItems(filterAdminNavSections(allowedNavHrefs));

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const active = root.querySelector<HTMLElement>('[data-active="true"]');
    if (!active) return;
    active.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [pathname, items.length]);

  if (items.length === 0) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[50] border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md print:hidden dark:border-zinc-800 dark:bg-zinc-950/95 lg:hidden"
      aria-label="Navegación principal"
    >
      <div
        ref={scrollerRef}
        className="admin-sidebar-nav-scroll overflow-x-auto overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="mx-auto flex w-max min-w-full snap-x snap-mandatory justify-center gap-0.5 px-1.5 py-1.5">
          {items.map((item) => {
            const active = adminNavItemActive(pathname, item.href, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                data-active={active ? "true" : "false"}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex min-w-[4.5rem] max-w-[5.5rem] shrink-0 snap-center flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-center transition",
                  active
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex size-6 items-center justify-center [&>svg]:size-[18px]",
                    active ? "opacity-100" : "opacity-80",
                  ].join(" ")}
                  aria-hidden
                >
                  {item.icon}
                </span>
                <span className="w-full truncate text-[10px] font-semibold leading-tight tracking-wide">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
