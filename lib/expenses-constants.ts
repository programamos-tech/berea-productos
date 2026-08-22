/** Mínimo de caracteres para el motivo de anulación de un egreso (panel + servidor). */
export const EXPENSE_CANCELLATION_REASON_MIN_LENGTH = 8;

/** Clasificación contable del registro en store_expenses. */
export type ExpenseKind = "gasto" | "egreso";

/** Alcance operativo: caja del día vs solo totales del mes. */
export type ExpenseScope = "diario" | "mensual";

export const EXPENSE_KIND_OPTIONS: ReadonlyArray<{
  value: ExpenseKind;
  label: string;
  hint: string;
}> = [
  {
    value: "gasto",
    label: "Gasto",
    hint: "Operativos del día a día (nómina, arriendo, insumos, etc.).",
  },
  {
    value: "egreso",
    label: "Egreso",
    hint: "Impuestos de una SAS en Colombia (renta, IVA, ICA, retenciones, etc.).",
  },
];

export const EXPENSE_SCOPE_OPTIONS: ReadonlyArray<{
  value: ExpenseScope;
  label: string;
  hint: string;
}> = [
  {
    value: "diario",
    label: "Caja del turno",
    hint: "Sale de la gaveta de hoy. Si es efectivo, baja el cierre.",
  },
  {
    value: "mensual",
    label: "Cuenta (mensual)",
    hint: "Arriendo, nómina, servicios o impuestos. No toca el cierre.",
  },
];

export function parseExpenseKind(raw: unknown): ExpenseKind {
  return raw === "egreso" ? "egreso" : "gasto";
}

export function expenseKindLabel(kind: ExpenseKind): string {
  return kind === "egreso" ? "Egreso" : "Gasto";
}

export function parseExpenseScope(raw: unknown): ExpenseScope {
  return raw === "mensual" ? "mensual" : "diario";
}

export function expenseScopeLabel(scope: ExpenseScope): string {
  return scope === "mensual" ? "Mensual" : "Caja";
}

/** Medios permitidos cuando el registro es mensual (no toca gaveta). */
export const MENSUAL_PAYMENT_METHODS = [
  "transferencia",
  "tarjeta",
  "efectivo_acumulado",
  "otro",
] as const;

export function isMensualPaymentMethod(raw: string): boolean {
  return (MENSUAL_PAYMENT_METHODS as readonly string[]).includes(
    raw.trim().toLowerCase(),
  );
}

export function expensePaymentMethodLabel(raw: string | null | undefined): string {
  switch (String(raw ?? "").trim().toLowerCase()) {
    case "efectivo":
      return "Efectivo (gaveta)";
    case "efectivo_acumulado":
      return "Efectivo acumulado";
    case "transferencia":
      return "Transferencia";
    case "tarjeta":
      return "Tarjeta";
    case "otro":
      return "Otro";
    default:
      return raw?.trim() || "—";
  }
}
