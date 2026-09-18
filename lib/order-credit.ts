/** Facturas POS a crédito (`wompi_reference = POS:credit`) y sus abonos. */

export const POS_CREDIT_REF = "POS:credit" as const;

export type OrderCreditPaymentMethod = "cash" | "transfer";

export type OrderCreditUiStatus = "pending" | "paid" | "cancelled";

export const CREDIT_PAYMENT_CANCELLATION_REASON_MIN_LENGTH = 8;

export type OrderCreditPayment = {
  id: string;
  amountCents: number;
  paymentMethod: OrderCreditPaymentMethod;
  notes: string | null;
  paidAt: string;
  isCancelled: boolean;
  cancellationReason: string | null;
  cancelledAt: string | null;
};

export function isPosCreditSale(
  wompiReference: string | null | undefined,
): boolean {
  return (wompiReference?.trim() ?? "") === POS_CREDIT_REF;
}

export function parseOrderCreditPaymentMethod(
  raw: string | null | undefined,
): OrderCreditPaymentMethod | null {
  const v = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (v === "cash" || v === "efectivo") return "cash";
  if (v === "transfer" || v === "transferencia") return "transfer";
  return null;
}

export function orderCreditPaymentMethodLabel(
  method: string | null | undefined,
): string {
  const parsed = parseOrderCreditPaymentMethod(method);
  if (parsed === "cash") return "Efectivo";
  if (parsed === "transfer") return "Transferencia";
  return "Otro";
}

export function sumOrderCreditPaidCents(
  payments: ReadonlyArray<{
    amountCents?: number;
    amount_cents?: number;
    isCancelled?: boolean;
    is_cancelled?: boolean;
  }>,
): number {
  let paid = 0;
  for (const row of payments) {
    if (row.isCancelled === true || row.is_cancelled === true) continue;
    const n = Number(row.amountCents ?? row.amount_cents ?? 0);
    if (Number.isFinite(n) && n > 0) paid += Math.floor(n);
  }
  return paid;
}

export function orderCreditPendingCents(
  totalCents: number,
  paidCents: number,
): number {
  return Math.max(0, Math.floor(Number(totalCents ?? 0)) - Math.max(0, paidCents));
}

export function orderCreditUiStatus(args: {
  orderStatus: string;
  pendingCents: number;
}): OrderCreditUiStatus {
  if (args.orderStatus === "cancelled") return "cancelled";
  if (args.pendingCents <= 0) return "paid";
  return "pending";
}

/** Color del saldo pendiente: naranja si hay deuda, verde si está pagada. */
export function orderCreditPendingToneClass(status: OrderCreditUiStatus): string {
  if (status === "paid") {
    return "font-semibold tabular-nums text-emerald-700 dark:text-emerald-400";
  }
  if (status === "cancelled") {
    return "font-semibold tabular-nums text-red-600 dark:text-red-400";
  }
  return "font-semibold tabular-nums text-orange-600 dark:text-orange-400";
}

export function orderCreditUiStatusBadge(status: OrderCreditUiStatus): {
  label: string;
  className: string;
} {
  if (status === "paid") {
    return {
      label: "Pagada",
      className:
        "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/90 dark:bg-emerald-950/45 dark:text-emerald-100 dark:ring-emerald-700/50",
    };
  }
  if (status === "cancelled") {
    return {
      label: "Anulada",
      className:
        "bg-red-50 text-red-700 ring-1 ring-red-100 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-800/50",
    };
  }
  return {
    label: "Pendiente",
    className:
      "bg-amber-50 text-amber-900 ring-1 ring-amber-100 dark:bg-amber-950/45 dark:text-amber-100 dark:ring-amber-800/50",
  };
}

export function mapOrderCreditPaymentRows(
  rows: Array<{
    id?: unknown;
    amount_cents?: unknown;
    payment_method?: unknown;
    notes?: unknown;
    paid_at?: unknown;
    is_cancelled?: unknown;
    cancellation_reason?: unknown;
    cancelled_at?: unknown;
  }>,
): OrderCreditPayment[] {
  return rows.map((row) => ({
    id: String(row.id ?? ""),
    amountCents: Math.max(0, Math.floor(Number(row.amount_cents ?? 0))),
    paymentMethod: parseOrderCreditPaymentMethod(String(row.payment_method ?? "")) ?? "cash",
    notes: row.notes != null && String(row.notes).trim() ? String(row.notes).trim() : null,
    paidAt: String(row.paid_at ?? ""),
    isCancelled: row.is_cancelled === true,
    cancellationReason:
      row.cancellation_reason != null && String(row.cancellation_reason).trim()
        ? String(row.cancellation_reason).trim()
        : null,
    cancelledAt:
      row.cancelled_at != null && String(row.cancelled_at).trim()
        ? String(row.cancelled_at)
        : null,
  }));
}
