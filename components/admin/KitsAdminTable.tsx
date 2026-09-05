"use client";

import { Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StaticCopCents } from "@/components/admin/ReportsAnimatedFigures";

export type KitsAdminTableRow = {
  id: string;
  name: string;
  imageUrl: string | null;
  itemsCount: number;
  priceCents: number;
  maxPos: number;
  maxStore: number;
  available: boolean;
  published: boolean;
};

const thClass =
  "pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";

export function KitsAdminTable({
  rows,
}: {
  rows: KitsAdminTableRow[];
  canEdit?: boolean;
}) {
  const router = useRouter();

  if (rows.length === 0) {
    return (
      <p className="py-8 text-sm text-zinc-500 dark:text-zinc-400">
        Todavía no hay kits. Creá el primero.
      </p>
    );
  }

  const editHref = (id: string) => `/admin/kits/${id}`;

  return (
    <>
      <ul
        role="list"
        className="divide-y divide-zinc-100 xl:hidden dark:divide-zinc-800"
      >
        {rows.map((row) => {
          const href = editHref(row.id);
          const inner = (
            <>
              <div className="flex min-w-0 flex-1 items-start gap-2.5">
                {row.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.imageUrl}
                    alt=""
                    className="size-10 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                    aria-hidden
                  >
                    Kit
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {row.name}
                  </p>
                  <p className="mt-0.5 text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
                    <StaticCopCents cents={row.priceCents} />
                    <span className="mx-1.5 text-zinc-300">·</span>
                    {row.itemsCount} producto{row.itemsCount === 1 ? "" : "s"}
                  </p>
                  <p className="mt-1.5 text-xs">
                    <span
                      className={
                        row.available
                          ? "font-medium text-emerald-700 dark:text-emerald-400"
                          : "font-medium text-amber-800 dark:text-amber-300"
                      }
                    >
                      {row.available ? "Disponible" : "Sin stock"}
                    </span>
                    <span className="mx-1.5 text-zinc-400">·</span>
                    <span
                      className={
                        row.published
                          ? "font-medium text-zinc-700 dark:text-zinc-300"
                          : "font-medium text-zinc-400 dark:text-zinc-500"
                      }
                    >
                      {row.published ? "Publicado" : "Borrador"}
                    </span>
                  </p>
                </div>
              </div>
              <span
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400"
                aria-hidden
              >
                <Eye className="size-4" strokeWidth={2} />
              </span>
            </>
          );

          return (
            <li key={row.id} className="min-w-0">
              <Link
                href={href}
                className="flex items-start justify-between gap-3 py-3 no-underline transition hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40"
                aria-label={`Ver kit ${row.name}`}
              >
                {inner}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="hidden min-w-0 overflow-x-auto xl:block">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200/70 dark:border-zinc-800">
              <th className={thClass}>Kit</th>
              <th className={thClass}>Productos</th>
              <th className={thClass}>Precio</th>
              <th className={thClass}>POS</th>
              <th className={thClass}>Web</th>
              <th className={thClass}>Estado</th>
              <th className={`${thClass} w-10 pr-0`} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const href = editHref(row.id);
              return (
                <tr
                  key={row.id}
                  tabIndex={0}
                  aria-label={`Ver kit ${row.name}`}
                  className="cursor-pointer border-b border-zinc-100/80 transition last:border-0 hover:bg-zinc-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 dark:border-zinc-800/80 dark:hover:bg-zinc-900/40"
                  onClick={() => {
                    router.push(href);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(href);
                    }
                  }}
                >
                  <td className="py-3 pr-4">
                    <div className="flex min-w-0 items-center gap-2.5">
                      {row.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.imageUrl}
                          alt=""
                          className="size-9 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <span
                          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-[9px] font-semibold uppercase tracking-wide text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                          aria-hidden
                        >
                          Kit
                        </span>
                      )}
                      <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                        {row.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-zinc-600 dark:text-zinc-400">
                    {row.itemsCount}
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-zinc-900 dark:text-zinc-100">
                    <StaticCopCents cents={row.priceCents} />
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-zinc-600 dark:text-zinc-400">
                    {row.maxPos}
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-zinc-600 dark:text-zinc-400">
                    {row.maxStore}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="block text-xs">
                      <span
                        className={
                          row.available
                            ? "font-medium text-emerald-700 dark:text-emerald-400"
                            : "font-medium text-amber-800 dark:text-amber-300"
                        }
                      >
                        {row.available ? "Disponible" : "Sin stock"}
                      </span>
                    </span>
                    <span
                      className={
                        row.published
                          ? "text-xs text-zinc-500"
                          : "text-xs text-zinc-400 dark:text-zinc-500"
                      }
                    >
                      {row.published ? "Publicado" : "Borrador"}
                    </span>
                  </td>
                  <td className="py-3 pr-0">
                    <span
                      className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400"
                      aria-hidden
                    >
                      <Eye className="size-4" strokeWidth={2} />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
