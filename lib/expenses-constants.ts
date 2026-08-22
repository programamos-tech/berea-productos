/** Mínimo de caracteres para el motivo de anulación de un egreso (panel + servidor). */
export const EXPENSE_CANCELLATION_REASON_MIN_LENGTH = 8;

/** Clasificación contable del registro en store_expenses. */
export type ExpenseKind = "gasto" | "egreso";

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
    hint: "Pagos a proveedores o impuestos.",
  },
];

export function parseExpenseKind(raw: unknown): ExpenseKind {
  return raw === "egreso" ? "egreso" : "gasto";
}

export function expenseKindLabel(kind: ExpenseKind): string {
  return kind === "egreso" ? "Egreso" : "Gasto";
}
