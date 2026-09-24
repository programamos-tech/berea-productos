import Link from "next/link";
import { OrderCreditAbonoForm } from "@/components/admin/OrderCreditAbonoForm";
import { OrderCreditCancelButton } from "@/components/admin/OrderCreditCancelButton";
import { formatCop } from "@/lib/money";
import {
  orderCreditPaymentMethodLabel,
  orderCreditPendingCents,
  orderCreditPendingToneClass,
  orderCreditUiStatus,
  orderCreditUiStatusBadge,
  sumOrderCreditPaidCents,
  type OrderCreditPayment,
} from "@/lib/order-credit";
import { formatStoreDateTime } from "@/lib/store-datetime-format";

function creditErrorMessage(code: string | undefined): string | null {
  switch (code) {
    case "abono":
      return "Revisá el monto y el método del abono.";
    case "overpay":
      return "El abono no puede ser mayor al saldo pendiente.";
    case "paid":
      return "Esta factura ya no tiene saldo pendiente.";
    case "cancelled":
      return "No se puede abonar una factura anulada.";
    case "not_credit":
      return "Esta factura no es a crédito.";
    case "missing":
      return "No se encontró la factura.";
    case "db":
      return "No se pudo guardar el abono. Intentá de nuevo.";
    default:
      return null;
  }
}

export function OrderCreditPanel({
  orderId,
  totalCents,
  orderStatus,
  payments,
  canRegister,
  variant = "full",
  errorCode,
  canViewCredits = true,
}: {
  orderId: string;
  totalCents: number;
  orderStatus: string;
  payments: OrderCreditPayment[];
  canRegister: boolean;
  variant?: "full" | "summary";
  errorCode?: string | null;
  canViewCredits?: boolean;
}) {
  const paidCents = sumOrderCreditPaidCents(payments);
  const pendingCents = orderCreditPendingCents(totalCents, paidCents);
  const uiStatus = orderCreditUiStatus({
    orderStatus,
    pendingCents,
  });
  const badge = orderCreditUiStatusBadge(uiStatus);
  const errorMessage = creditErrorMessage(errorCode ?? undefined);
  const labelClass =
    "text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={labelClass}>Saldo</p>
          <p className="mt-1 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
            >
              {badge.label}
            </span>
          </p>
        </div>
        {variant === "summary" && canViewCredits ? (
          <Link
            href={`/admin/creditos/${orderId}`}
            className="text-sm font-medium text-zinc-800 underline-offset-2 hover:underline dark:text-zinc-200"
          >
            Ver en Créditos
          </Link>
        ) : canRegister && pendingCents > 0 && uiStatus === "pending" ? (
          <OrderCreditAbonoForm orderId={orderId} pendingCents={pendingCents} />
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <div>
          <p className={labelClass}>Total</p>
          <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-xl">
            {formatCop(totalCents)}
          </p>
        </div>
        <div>
          <p className={labelClass}>Pagado</p>
          <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-zinc-800 dark:text-zinc-200 sm:text-xl">
            {formatCop(paidCents)}
          </p>
        </div>
        <div>
          <p className={labelClass}>Pendiente</p>
          <p
            className={`mt-1 text-xl tabular-nums tracking-tight sm:text-2xl ${orderCreditPendingToneClass(uiStatus)}`}
          >
            {formatCop(pendingCents)}
          </p>
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-3 text-sm text-red-700 dark:text-red-300" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Abonos
        </p>
          {payments.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">Todavía no hay abonos.</p>
          ) : (
            <ul className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
              {payments.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-start justify-between gap-2 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p
                      className={`font-medium tabular-nums ${
                        p.isCancelled
                          ? "text-zinc-400 line-through dark:text-zinc-500"
                          : "text-zinc-900 dark:text-zinc-100"
                      }`}
                    >
                      {formatCop(p.amountCents)}
                      {p.isCancelled ? (
                        <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-red-700 no-underline dark:text-red-400">
                          Anulado
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {orderCreditPaymentMethodLabel(p.paymentMethod)}
                      {p.paidAt
                        ? ` · ${formatStoreDateTime(p.paidAt, {
                            day: "numeric",
                            month: "short",
                            hour: "numeric",
                            minute: "2-digit",
                          })}`
                        : null}
                    </p>
                    {p.notes ? (
                      <p className="mt-0.5 text-xs text-zinc-500">{p.notes}</p>
                    ) : null}
                    {p.isCancelled && p.cancellationReason ? (
                      <p className="mt-0.5 text-xs text-red-700 dark:text-red-400">
                        Motivo: {p.cancellationReason}
                      </p>
                    ) : null}
                  </div>
                  {!p.isCancelled && orderStatus !== "cancelled" ? (
                    <OrderCreditCancelButton
                      paymentId={p.id}
                      amountCents={p.amountCents}
                      canCancel={canRegister}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
    </section>
  );
}
