"use client";

import Link from "next/link";
import {
  ArrowLeftRight,
  Banknote,
  ClipboardList,
  Eye,
  FileText,
  Globe,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  formatVentaFecha,
  ventaEstadoTone,
  ventaFormaPagoTone,
  ventaNumeroReferencia,
} from "@/lib/ventas-sales";
import { StaticCopCents } from "@/components/admin/ReportsAnimatedFigures";

export type VentaOrderRow = {
  id: string;
  status: string;
  customer_name: string;
  total_cents: number;
  created_at: string | null;
  wompi_reference: string | null;
  customer_email: string | null;
};

function ventaPagoIcon(
  wompiReference: string | null | undefined,
): { Icon: LucideIcon; label: string } {
  const r = wompiReference?.trim() ?? "";
  if (r === "POS:cash") {
    return { Icon: Banknote, label: "Efectivo" };
  }
  if (r === "POS:transfer") {
    return { Icon: ArrowLeftRight, label: "Transferencia" };
  }
  if (r === "POS:mixed") {
    return { Icon: Layers, label: "Mixto" };
  }
  if (r === "POS:quotation") {
    return { Icon: FileText, label: "Cotización" };
  }
  if (r.startsWith("POS:")) {
    return { Icon: ClipboardList, label: "Mostrador" };
  }
  return { Icon: Globe, label: "En línea" };
}

const thClass =
  "pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";

export function VentasSalesTable({
  rows,
  orderListReturnHref,
}: {
  rows: VentaOrderRow[];
  /** Si se pasa, el detalle del pedido vuelve a este listado (misma página y filtros). */
  orderListReturnHref?: string;
}) {
  const router = useRouter();

  const orderDetailHref = (orderId: string) =>
    orderListReturnHref
      ? `/admin/orders/${orderId}?returnTo=${encodeURIComponent(orderListReturnHref)}`
      : `/admin/orders/${orderId}`;

  if (rows.length === 0) {
    return (
      <p className="py-8 text-sm text-zinc-500 dark:text-zinc-400">
        No hay ventas que coincidan con los filtros.
      </p>
    );
  }

  return (
    <>
      {/* Móvil / tablet: lista plana */}
      <ul
        role="list"
        className="divide-y divide-zinc-100 xl:hidden dark:divide-zinc-800"
      >
        {rows.map((row) => {
          const ref = ventaNumeroReferencia(row.id);
          const estado = ventaEstadoTone(row.status);
          const pago = ventaFormaPagoTone(row.wompi_reference);
          const pagoIcon = ventaPagoIcon(row.wompi_reference);
          const PagoIcon = pagoIcon.Icon;
          const href = orderDetailHref(row.id);

          return (
            <li key={row.id} className="min-w-0">
              <Link
                href={href}
                className="flex items-start justify-between gap-3 py-3 no-underline transition hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40"
                aria-label={`Ver factura ${ref}, ${row.customer_name}`}
              >
                <div className="flex min-w-0 flex-1 items-start gap-2.5">
                  <PagoIcon
                    className="mt-0.5 size-4 shrink-0 text-zinc-400 dark:text-zinc-500"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                      {ref}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-zinc-800 dark:text-zinc-200">
                      {row.customer_name}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      {formatVentaFecha(row.created_at)}
                    </p>
                    <p className="mt-1.5 text-xs">
                      <span className={pago.className}>{pago.label}</span>
                      <span className="mx-1.5 text-zinc-400">·</span>
                      <span className={estado.className}>{estado.label}</span>
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <p className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                    <StaticCopCents cents={Number(row.total_cents ?? 0)} />
                  </p>
                  <span
                    className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400"
                    aria-hidden
                  >
                    <Eye className="size-4" strokeWidth={2} />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Desktop: tabla plana estilo reportes / caja */}
      <div className="hidden min-w-0 overflow-x-auto xl:block">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200/70 dark:border-zinc-800">
              <th className={thClass}>Factura</th>
              <th className={thClass}>Fecha</th>
              <th className={thClass}>Cliente</th>
              <th className={thClass}>Pago</th>
              <th className={thClass}>Estado</th>
              <th className={`${thClass} text-right`}>Total</th>
              <th className={`${thClass} w-10 pr-0`} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const href = orderDetailHref(row.id);
              const ref = ventaNumeroReferencia(row.id);
              const estado = ventaEstadoTone(row.status);
              const pago = ventaFormaPagoTone(row.wompi_reference);
              const pagoIcon = ventaPagoIcon(row.wompi_reference);
              const PagoIcon = pagoIcon.Icon;
              return (
                <tr
                  key={row.id}
                  tabIndex={0}
                  aria-label={`Ver factura ${ref}, pedido ${row.customer_name}`}
                  className="cursor-pointer border-b border-zinc-100/80 last:border-0 transition hover:bg-zinc-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:border-zinc-800/80 dark:hover:bg-zinc-900/40"
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
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <PagoIcon
                        className="size-4 shrink-0 text-zinc-400 dark:text-zinc-500"
                        strokeWidth={2.25}
                        aria-label={pagoIcon.label}
                      />
                      <span className="font-mono text-xs font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                        {ref}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-4 text-zinc-600 dark:text-zinc-400">
                    {formatVentaFecha(row.created_at)}
                  </td>
                  <td className="max-w-[14rem] truncate py-2.5 pr-4 text-zinc-900 dark:text-zinc-100">
                    {row.customer_name}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs ${pago.className}`}
                    >
                      <PagoIcon
                        className="size-3.5 shrink-0 text-zinc-400 dark:text-zinc-500"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                      {pago.label}
                    </span>
                  </td>
                  <td className={`py-2.5 pr-4 text-xs ${estado.className}`}>
                    {estado.label}
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-4 text-right tabular-nums font-medium text-zinc-900 dark:text-zinc-50">
                    <StaticCopCents cents={Number(row.total_cents ?? 0)} />
                  </td>
                  <td className="py-2.5 text-right">
                    <Link
                      href={href}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                      aria-label={`Ver detalle del pedido ${ref}`}
                      title="Ver"
                    >
                      <Eye className="size-4" strokeWidth={2} aria-hidden />
                    </Link>
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
