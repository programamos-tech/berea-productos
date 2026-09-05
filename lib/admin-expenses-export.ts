import type { SupabaseClient } from "@supabase/supabase-js";
import { monthYmdBounds } from "@/lib/admin-report-range";
import { parseExpenseKind, parseExpenseScope } from "@/lib/expenses-constants";

export type ExpenseExportRow = {
  expense_date: string;
  kind: string;
  scope: string;
  concept: string;
  amount_cents: number;
  payment_method: string;
  notes: string;
  status: string;
  created_at: string;
};

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatPesos(cents: number): string {
  const n = Math.round(cents) / 100;
  return n.toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function expensesExportFilename(yearMonth: string): string {
  return `egresos-${yearMonth}.csv`;
}

export function buildExpensesExportCsv(rows: ExpenseExportRow[]): string {
  const header = [
    "Fecha",
    "Tipo",
    "Alcance",
    "Concepto",
    "Monto",
    "Medio de pago",
    "Notas",
    "Estado",
    "Registrado",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        csvEscape(r.expense_date),
        csvEscape(r.kind),
        csvEscape(r.scope),
        csvEscape(r.concept),
        csvEscape(formatPesos(r.amount_cents)),
        csvEscape(r.payment_method),
        csvEscape(r.notes),
        csvEscape(r.status),
        csvEscape(r.created_at),
      ].join(","),
    );
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export async function fetchExpensesExportRows(
  supabase: SupabaseClient,
  yearMonth: string,
): Promise<{ rows: ExpenseExportRow[]; error: string | null }> {
  const bounds = monthYmdBounds(yearMonth);
  if (!bounds) {
    return { rows: [], error: "Mes inválido." };
  }

  const { data, error } = await supabase
    .from("store_expenses")
    .select(
      "concept,amount_cents,payment_method,notes,expense_date,created_at,is_cancelled,expense_kind,expense_scope",
    )
    .gte("expense_date", bounds.from)
    .lte("expense_date", bounds.to)
    .order("expense_date", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(10000);

  if (error) {
    console.error("[egresos-export]", error.message);
    return { rows: [], error: error.message };
  }

  const rows: ExpenseExportRow[] = (data ?? []).map((raw) => {
    const kind = parseExpenseKind(
      (raw as { expense_kind?: string | null }).expense_kind,
    );
    const scope = parseExpenseScope(
      (raw as { expense_scope?: string | null }).expense_scope,
    );
    const cancelled = (raw as { is_cancelled?: boolean | null }).is_cancelled === true;
    return {
      expense_date: String(
        (raw as { expense_date?: string | null }).expense_date ?? "",
      ),
      kind: kind === "egreso" ? "Egreso" : "Gasto",
      scope: scope === "mensual" ? "Mensual" : "Diario",
      concept: String((raw as { concept?: string | null }).concept ?? ""),
      amount_cents: Math.max(
        0,
        Math.floor(Number((raw as { amount_cents?: number }).amount_cents) || 0),
      ),
      payment_method: String(
        (raw as { payment_method?: string | null }).payment_method ?? "",
      ),
      notes: String((raw as { notes?: string | null }).notes ?? ""),
      status: cancelled ? "Anulado" : "Activo",
      created_at: String(
        (raw as { created_at?: string | null }).created_at ?? "",
      ),
    };
  });

  return { rows, error: null };
}
