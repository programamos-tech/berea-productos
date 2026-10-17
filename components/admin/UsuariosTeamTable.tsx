"use client";

import { AdminUserAvatar } from "@/components/admin/AdminUserAvatar";
import { Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type TeamMemberRow = {
  id: string;
  title: string;
  email: string;
  username: string;
  jobRole: string;
  jobLabel: string;
  jobToneClass: string;
  active: boolean;
  branchLabel: string | null;
  /** Semilla del avatar (email, igual que navbar / Mi cuenta). */
  avatarSeed: string;
};

const thClass =
  "pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";

export function UsuariosTeamTable({
  rows,
  canManage,
}: {
  rows: TeamMemberRow[];
  canManage: boolean;
}) {
  const router = useRouter();

  if (rows.length === 0) {
    return (
      <p className="py-8 text-sm text-zinc-500 dark:text-zinc-400">
        Todavía no hay colaboradores con perfil en esta tienda.
      </p>
    );
  }

  const editHref = (id: string) => `/admin/usuarios/${id}/edit`;

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
                <AdminUserAvatar
                  displayName={row.title}
                  seed={row.avatarSeed}
                  size={36}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {row.title}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-zinc-600 dark:text-zinc-400">
                    {row.email}
                  </p>
                  <p className="mt-1.5 text-xs">
                    <span className={row.jobToneClass}>{row.jobLabel}</span>
                    <span className="mx-1.5 text-zinc-400">·</span>
                    <span
                      className={
                        row.active
                          ? "font-medium text-zinc-700 dark:text-zinc-300"
                          : "font-medium text-zinc-400 dark:text-zinc-500"
                      }
                    >
                      {row.active ? "Activo" : "Inactivo"}
                    </span>
                  </p>
                </div>
              </div>
              {canManage ? (
                <span
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400"
                  aria-hidden
                >
                  <Eye className="size-4" strokeWidth={2} />
                </span>
              ) : null}
            </>
          );

          return (
            <li key={row.id} className="min-w-0">
              {canManage ? (
                <Link
                  href={href}
                  className="flex items-start justify-between gap-3 py-3 no-underline transition hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40"
                  aria-label={`Editar colaborador ${row.title}`}
                >
                  {inner}
                </Link>
              ) : (
                <div className="flex items-start justify-between gap-3 py-3">
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="hidden min-w-0 overflow-x-auto xl:block">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200/70 dark:border-zinc-800">
              <th className={thClass}>Colaborador</th>
              <th className={thClass}>Usuario</th>
              <th className={thClass}>Correo</th>
              <th className={thClass}>Rol</th>
              <th className={thClass}>Estado</th>
              <th className={thClass}>Sucursal</th>
              {canManage ? <th className={`${thClass} w-10 pr-0`} /> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const href = editHref(row.id);
              const rowInteractive = canManage;

              return (
                <tr
                  key={row.id}
                  tabIndex={rowInteractive ? 0 : undefined}
                  aria-label={
                    rowInteractive
                      ? `Editar colaborador ${row.title}`
                      : undefined
                  }
                  className={`border-b border-zinc-100/80 last:border-0 transition dark:border-zinc-800/80 ${
                    rowInteractive
                      ? "cursor-pointer hover:bg-zinc-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 dark:hover:bg-zinc-900/40"
                      : ""
                  }`}
                  onClick={
                    rowInteractive
                      ? () => {
                          router.push(href);
                        }
                      : undefined
                  }
                  onKeyDown={
                    rowInteractive
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            router.push(href);
                          }
                        }
                      : undefined
                  }
                >
                  <td className="py-2.5 pr-4">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <AdminUserAvatar
                        displayName={row.title}
                        seed={row.avatarSeed}
                        size={32}
                      />
                      <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                        {row.title}
                      </span>
                    </div>
                  </td>
                  <td className="max-w-[10rem] truncate py-2.5 pr-4 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {row.username}
                  </td>
                  <td className="max-w-[14rem] truncate py-2.5 pr-4 text-zinc-700 dark:text-zinc-300">
                    {row.email}
                  </td>
                  <td className={`py-2.5 pr-4 text-xs ${row.jobToneClass}`}>
                    {row.jobLabel}
                  </td>
                  <td className="py-2.5 pr-4 text-xs">
                    <span
                      className={
                        row.active
                          ? "font-medium text-zinc-700 dark:text-zinc-300"
                          : "font-medium text-zinc-400 dark:text-zinc-500"
                      }
                    >
                      {row.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="max-w-[10rem] truncate py-2.5 pr-4 text-zinc-600 dark:text-zinc-400">
                    {row.branchLabel || "—"}
                  </td>
                  {canManage ? (
                    <td className="py-2.5 text-right">
                      <Link
                        href={href}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                        aria-label={`Editar ${row.title}`}
                      >
                        <Eye className="size-4" strokeWidth={2} />
                      </Link>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
