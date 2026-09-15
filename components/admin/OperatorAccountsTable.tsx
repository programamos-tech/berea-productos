import { Eye } from "lucide-react";
import Link from "next/link";
import { OperatorAccountEnterButton } from "@/components/admin/OperatorAccountEnterButton";
import { OperatorAccountLogo } from "@/components/admin/OperatorAccountLogo";
import {
  tenantAccountStatusTone,
  type OperatorAccountRow,
} from "@/lib/operator-accounts";

const thClass =
  "pb-3 pr-5 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";
const tdClass = "py-3.5 pr-5 align-middle";

const actionBtnClass =
  "inline-flex size-9 items-center justify-center rounded-lg text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 disabled:opacity-50 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-white";

function RowActions({ row }: { row: OperatorAccountRow }) {
  return (
    <div className="flex justify-end gap-0.5">
      <Link
        href={`/admin/cuentas/${row.id}`}
        className={actionBtnClass}
        title="Ver detalle"
        aria-label={`Ver detalle de ${row.holderName}`}
      >
        <Eye className="size-4" strokeWidth={2} aria-hidden />
      </Link>
      {row.canEnter ? (
        <OperatorAccountEnterButton row={row} className={actionBtnClass} />
      ) : null}
    </div>
  );
}

export function OperatorAccountsTable({
  rows,
}: {
  rows: OperatorAccountRow[];
}) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-sm text-zinc-500 dark:text-zinc-400">
        Todavía no hay cuentas de clientes.
      </p>
    );
  }

  return (
    <>
      <ul role="list" className="md:hidden">
        {rows.map((row) => {
          const estado = tenantAccountStatusTone(row.status);
          return (
            <li
              key={row.id}
              className="border-b border-zinc-100 py-3.5 last:border-0 dark:border-zinc-800/80"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-1 gap-3">
                  <OperatorAccountLogo src={row.logoSrc} name={row.tradeName} />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/cuentas/${row.id}`}
                      className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                    >
                      {row.holderName}
                    </Link>
                    <p className="mt-0.5 truncate text-sm text-zinc-600 dark:text-zinc-400">
                      {row.tradeName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {row.email || "—"}
                    </p>
                    <p className="mt-1 text-xs">
                      <span className={estado.className}>{estado.label}</span>
                      <span className="mx-1.5 text-zinc-400">·</span>
                      <span className="text-zinc-500">
                        Última venta {row.lastSaleLabel}
                      </span>
                    </p>
                  </div>
                </div>
                <RowActions row={row} />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200/70 dark:border-zinc-800">
              <th className={thClass}>Cliente</th>
              <th className={thClass}>Negocio</th>
              <th className={thClass}>Correo</th>
              <th className={thClass}>Estado</th>
              <th className={thClass}>Última venta</th>
              <th className={`${thClass} pr-0 text-right`}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const estado = tenantAccountStatusTone(row.status);
              return (
                <tr
                  key={row.id}
                  className="border-b border-zinc-100/80 last:border-0 dark:border-zinc-800/80"
                >
                  <td className={tdClass}>
                    <div className="flex items-center gap-3">
                      <OperatorAccountLogo
                        src={row.logoSrc}
                        name={row.tradeName}
                      />
                      <Link
                        href={`/admin/cuentas/${row.id}`}
                        className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                      >
                        {row.holderName}
                      </Link>
                    </div>
                  </td>
                  <td className={`${tdClass} text-zinc-700 dark:text-zinc-300`}>
                    {row.tradeName}
                  </td>
                  <td className={`${tdClass} text-zinc-600 dark:text-zinc-400`}>
                    {row.email || "—"}
                  </td>
                  <td className={`${tdClass} ${estado.className}`}>
                    {estado.label}
                  </td>
                  <td
                    className={`${tdClass} whitespace-nowrap text-zinc-600 dark:text-zinc-300`}
                  >
                    {row.lastSaleLabel}
                  </td>
                  <td className={`${tdClass} pr-0`}>
                    <RowActions row={row} />
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
