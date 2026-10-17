import Link from "next/link";
import { OrderCreditPanel } from "@/components/admin/OrderCreditPanel";
import { StaticCopCents } from "@/components/admin/ReportsAnimatedFigures";
import { formatCop } from "@/lib/money";
import type { OrderCreditPayment } from "@/lib/order-credit";
import { formatStoreInvoiceDateTime } from "@/lib/store-datetime-format";
import { ventaCreditoToneClass, ventaNumeroReferencia } from "@/lib/ventas-sales";
import type { CreditListRow } from "@/lib/admin-order-credits";

const labelClass = "text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";
const th = "pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";

type Line = { name: string; reference: string; quantity: number; unitPriceCents: number };

const LINES: Record<string, Line[]> = {
  "11111111-1111-4111-8111-111111111111": [
    { name: "Crema corporal 250 ml", reference: "MG-250", quantity: 8, unitPriceCents: 42000 },
    { name: "Aceite de coco", reference: "MG-AC", quantity: 6, unitPriceCents: 39000 },
  ],
  "22222222-2222-4222-8222-222222222222": [
    { name: "Kit de viaje", reference: "MG-KIT", quantity: 4, unitPriceCents: 50000 },
  ],
  "33333333-3333-4333-8333-333333333333": [
    { name: "Rutina de noche", reference: "MG-RN", quantity: 2, unitPriceCents: 96000 },
    { name: "Crema corporal 250 ml", reference: "MG-250", quantity: 2, unitPriceCents: 59000 },
  ],
};

const PAYMENTS: Record<string, OrderCreditPayment[]> = {
  "11111111-1111-4111-8111-111111111111": [
    {
      id: "pay-1",
      amountCents: 150000,
      paymentMethod: "transfer",
      notes: null,
      paidAt: "2026-10-17T16:16:00.000Z",
      isCancelled: false,
      cancellationReason: null,
      cancelledAt: null,
    },
  ],
  "22222222-2222-4222-8222-222222222222": [
    {
      id: "pay-2",
      amountCents: 80000,
      paymentMethod: "cash",
      notes: null,
      paidAt: "2026-10-15T15:10:00.000Z",
      isCancelled: false,
      cancellationReason: null,
      cancelledAt: null,
    },
  ],
  "33333333-3333-4333-8333-333333333333": [],
};

export function ModuleCreditPreview({ row }: { row: CreditListRow }) {
  const ref = ventaNumeroReferencia(row.id);
  const lines = LINES[row.id] ?? [];
  const payments = PAYMENTS[row.id] ?? [];
  const when = row.createdAt ? formatStoreInvoiceDateTime(row.createdAt) : "—";

  return (
    <div className="flex w-full min-w-0 max-w-none flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2 gap-y-2">
        <div className="min-w-0">
          <p className="text-[11px] text-zinc-500">
            <Link href="/admin/modulos/creditos" className="hover:text-zinc-800 dark:hover:text-zinc-200">
              Créditos
            </Link>
            <span className="mx-1.5 text-zinc-400">/</span>
            Factura #{ref}
          </p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            Factura #{ref}
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm text-zinc-500">
            <span className="tabular-nums text-zinc-700 dark:text-zinc-300">{when}</span>
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">{row.customerName}</span>
          </p>
        </div>
        <Link
          href="/admin/modulos/creditos"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          title="Volver"
          aria-label="Volver a créditos"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4" aria-hidden>
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </header>

      <div className="flex flex-col gap-6 border-t border-zinc-200/70 pt-4 dark:border-zinc-800 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,20rem)] lg:items-start lg:gap-10 xl:gap-12">
        <section className="min-w-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] table-fixed text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200/70 dark:border-zinc-800">
                  <th className={th}>Producto</th>
                  <th className={`${th} text-right`}>Ud</th>
                  <th className={`${th} text-right`}>P. unit.</th>
                  <th className={`${th} text-right`}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.reference} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                    <td className="py-3 pr-5 text-zinc-800 dark:text-zinc-200">
                      <span className="block font-medium">{line.name}</span>
                      <span className="mt-1 block font-mono text-xs text-zinc-500">Ref. {line.reference}</span>
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                      {line.quantity}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                      {formatCop(line.unitPriceCents)}
                    </td>
                    <td className="py-3 text-right text-base font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                      {formatCop(line.unitPriceCents * line.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-5 border-t border-zinc-200/70 pt-4 dark:border-zinc-800 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0 dark:lg:border-zinc-800">
          <div>
            <p className={labelClass}>Total</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
              <StaticCopCents cents={row.totalCents} />
            </p>
          </div>
          <div>
            <p className={labelClass}>Método de pago</p>
            <p className={`mt-1.5 text-sm ${ventaCreditoToneClass}`}>Crédito</p>
          </div>
        </aside>
      </div>

      <OrderCreditPanel
        orderId={row.id}
        totalCents={row.totalCents}
        orderStatus="pending"
        payments={payments}
        canRegister={false}
        readOnly
      />
    </div>
  );
}
