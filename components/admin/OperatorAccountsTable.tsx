"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useTransition } from "react";
import { enterCustomerAccount } from "@/app/actions/admin/platform-accounts";
import { useAccountSwitchLoading } from "@/components/admin/AccountSwitchLoading";
import { adminTableWrapClass } from "@/lib/admin-ui";

export type OperatorAccountRow = {
  id: string;
  logoSrc: string;
  holderName: string;
  tradeName: string;
  email: string | null;
};

const thClass =
  "pb-3 pr-5 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";
const tdClass = "py-3.5 pr-5 align-middle";

function EnterIcon() {
  return (
    <span className="inline-flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition group-hover:border-zinc-300 group-hover:bg-zinc-50 group-hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:group-hover:border-zinc-600 dark:group-hover:bg-zinc-800 dark:group-hover:text-zinc-100">
      <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
    </span>
  );
}

function AccountLogo({ src }: { src: string }) {
  return (
    <span className="relative size-10 shrink-0 overflow-hidden rounded-lg ring-1 ring-zinc-200/80 dark:ring-zinc-700/80">
      <Image
        src={src}
        alt=""
        width={80}
        height={80}
        className="size-full object-cover"
      />
    </span>
  );
}

function enterAccount(tenantId: string) {
  const fd = new FormData();
  fd.set("tenant_id", tenantId);
  return enterCustomerAccount(fd);
}

export function OperatorAccountsTable({
  rows,
}: {
  rows: OperatorAccountRow[];
}) {
  const beginSwitch = useAccountSwitchLoading();
  const [isPending, startTransition] = useTransition();

  if (rows.length === 0) {
    return (
      <p className="py-8 text-sm text-zinc-600 dark:text-zinc-300">
        Todavía no hay cuentas de clientes.
      </p>
    );
  }

  function enter(row: OperatorAccountRow) {
    beginSwitch({
      mode: "enter",
      name: row.tradeName,
      logoSrc: row.logoSrc,
      holderName: row.holderName,
    });
    startTransition(() => {
      enterAccount(row.id);
    });
  }

  return (
    <div className={adminTableWrapClass}>
      <ul
        role="list"
        className="divide-y divide-zinc-100 md:hidden dark:divide-zinc-800"
      >
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => enter(row)}
              disabled={isPending}
              className="group flex w-full items-center gap-3 px-4 py-3 text-left disabled:opacity-60"
              aria-label={`Entrar a ${row.tradeName}`}
            >
              <AccountLogo src={row.logoSrc} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {row.holderName}
                </span>
                <span className="mt-0.5 block truncate text-sm text-zinc-600 dark:text-zinc-400">
                  {row.tradeName}
                </span>
                <span className="mt-0.5 block truncate text-xs text-zinc-500">
                  {row.email || "—"}
                </span>
              </span>
              <EnterIcon />
            </button>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200/70 dark:border-zinc-800">
              <th className={`${thClass} w-16 pl-4`}>Logo</th>
              <th className={thClass}>Cliente</th>
              <th className={thClass}>Negocio</th>
              <th className={thClass}>Correo</th>
              <th className={`${thClass} w-14 pr-4`}>
                <span className="sr-only">Entrar</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                tabIndex={0}
                aria-label={`Entrar a ${row.tradeName}`}
                className={`group cursor-pointer border-b border-zinc-100/80 last:border-0 transition hover:bg-zinc-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 dark:border-zinc-800/80 dark:hover:bg-zinc-900/50 ${
                  isPending ? "pointer-events-none opacity-60" : ""
                }`}
                onClick={() => enter(row)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    enter(row);
                  }
                }}
              >
                <td className={`${tdClass} pl-4`}>
                  <AccountLogo src={row.logoSrc} />
                </td>
                <td
                  className={`${tdClass} font-medium text-zinc-900 dark:text-zinc-100`}
                >
                  {row.holderName}
                </td>
                <td className={`${tdClass} text-zinc-700 dark:text-zinc-300`}>
                  {row.tradeName}
                </td>
                <td className={`${tdClass} text-zinc-600 dark:text-zinc-400`}>
                  {row.email || "—"}
                </td>
                <td className={`${tdClass} pr-4 text-right`}>
                  <EnterIcon />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
