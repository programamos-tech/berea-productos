export type ExpensePaymentMethod =
  | "transferencia"
  | "efectivo"
  | "efectivo_acumulado"
  | "tarjeta"
  | "otro";

export type ExpenseConceptOption = {
  concept: string;
  category: string;
  paymentMethod: ExpensePaymentMethod;
};

/** Etiqueta del concepto que abre selector de trabajador de turno. */
export const EXPENSE_CONCEPT_PERSONAL_TURNOS = "Personal Turnos";

/** Concepto libre cuando no aplica la lista fija. */
export const EXPENSE_CONCEPT_OTHER = "Otro";

/** Concepto libre dentro de egresos (impuestos). */
export const EXPENSE_CONCEPT_OTHER_TAX = "Otro impuesto";

/**
 * Catálogo oficial de conceptos (hoja CONCEPTOS DE GASTOS).
 * Orden fijo para el selector en admin (tipo gasto).
 */
export const EXPENSE_CONCEPT_OPTIONS: ExpenseConceptOption[] = [
  { concept: "Sueldo/Nómina", category: "nomina", paymentMethod: "transferencia" },
  { concept: "Administración", category: "administracion", paymentMethod: "transferencia" },
  { concept: "Arriendo", category: "fijo", paymentMethod: "transferencia" },
  { concept: "Servicio público", category: "servicios", paymentMethod: "transferencia" },
  { concept: "Línea corporativa", category: "servicios", paymentMethod: "transferencia" },
  {
    concept: EXPENSE_CONCEPT_PERSONAL_TURNOS,
    category: "nomina",
    paymentMethod: "efectivo",
  },
  { concept: "Seguridad social", category: "nomina", paymentMethod: "transferencia" },
  { concept: "Domicilios propios", category: "logistica", paymentMethod: "efectivo" },
  { concept: "Flete", category: "logistica", paymentMethod: "transferencia" },
  {
    concept: "Material/insumos y papelería",
    category: "insumos",
    paymentMethod: "transferencia",
  },
  { concept: "Datafono y 4xMIL", category: "financiero", paymentMethod: "transferencia" },
  { concept: "Honorarios contabilidad", category: "honorarios", paymentMethod: "transferencia" },
  {
    concept: "Viáticos/gastos representación",
    category: "representacion",
    paymentMethod: "transferencia",
  },
  { concept: "Publicidad", category: "marketing", paymentMethod: "tarjeta" },
  { concept: "Soporte web Contapyme", category: "tecnologia", paymentMethod: "transferencia" },
  { concept: "Arreglos locativos", category: "mantenimiento", paymentMethod: "transferencia" },
  { concept: "Intereses x préstamos", category: "financiero", paymentMethod: "transferencia" },
  { concept: "Pago a préstamo", category: "financiero", paymentMethod: "transferencia" },
  { concept: "Prestaciones sociales", category: "nomina", paymentMethod: "transferencia" },
  { concept: "Renovación Sigo nómina", category: "nomina", paymentMethod: "transferencia" },
  { concept: "Cámara de comercio", category: "impuestos", paymentMethod: "transferencia" },
  {
    concept: "Pago por transacción Milagros",
    category: "financiero",
    paymentMethod: "transferencia",
  },
  { concept: "Bolsas Milagros", category: "insumos", paymentMethod: "efectivo" },
  {
    concept: "Pago a proveedor",
    category: "insumos",
    paymentMethod: "transferencia",
  },
  {
    concept: "Seguro local y mercancía protegida",
    category: "seguros",
    paymentMethod: "transferencia",
  },
  { concept: EXPENSE_CONCEPT_OTHER, category: "operativo", paymentMethod: "transferencia" },
];

/**
 * Impuestos / obligaciones tributarias típicas de una SAS en Colombia.
 * Solo para registros tipo egreso (los pagos a proveedor salen del módulo Proveedores).
 */
export const EXPENSE_EGRESO_TAX_OPTIONS: ExpenseConceptOption[] = [
  { concept: "Impuesto de renta", category: "impuestos", paymentMethod: "transferencia" },
  { concept: "IVA", category: "impuestos", paymentMethod: "transferencia" },
  {
    concept: "Retención en la fuente",
    category: "impuestos",
    paymentMethod: "transferencia",
  },
  {
    concept: "Autorretención de renta",
    category: "impuestos",
    paymentMethod: "transferencia",
  },
  {
    concept: "ICA (industria y comercio)",
    category: "impuestos",
    paymentMethod: "transferencia",
  },
  { concept: "GMF 4x1000", category: "impuestos", paymentMethod: "transferencia" },
  {
    concept: "Impuesto al patrimonio",
    category: "impuestos",
    paymentMethod: "transferencia",
  },
  { concept: "Predial", category: "impuestos", paymentMethod: "transferencia" },
  { concept: "Cámara de comercio", category: "impuestos", paymentMethod: "transferencia" },
  {
    concept: "Régimen Simple de Tributación",
    category: "impuestos",
    paymentMethod: "transferencia",
  },
  {
    concept: EXPENSE_CONCEPT_OTHER_TAX,
    category: "impuestos",
    paymentMethod: "transferencia",
  },
];

const EGRESO_FIXED_TAX_CONCEPTS = new Set(
  EXPENSE_EGRESO_TAX_OPTIONS.map((o) => o.concept).filter(
    (c) => c !== EXPENSE_CONCEPT_OTHER_TAX,
  ),
);

/**
 * Valida concepto de egreso manual: catálogo de impuestos SAS,
 * o texto libre cuando eligieron "Otro impuesto".
 */
export function isValidEgresoTaxConcept(concept: string): boolean {
  const c = concept.trim();
  if (!c) return false;
  if (EGRESO_FIXED_TAX_CONCEPTS.has(c)) return true;
  // Texto libre (no debe ser solo la etiqueta del selector).
  return c !== EXPENSE_CONCEPT_OTHER_TAX && c.length >= 3;
}

/** Conceptos fijos para el filtro del listado (sin “Otro…” de texto libre). */
export function expenseConceptFilterOptions(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const o of [
    ...EXPENSE_CONCEPT_OPTIONS,
    ...EXPENSE_EGRESO_TAX_OPTIONS,
  ]) {
    if (
      o.concept === EXPENSE_CONCEPT_OTHER ||
      o.concept === EXPENSE_CONCEPT_OTHER_TAX
    ) {
      continue;
    }
    if (seen.has(o.concept)) continue;
    seen.add(o.concept);
    out.push(o.concept);
  }
  return out;
}

/** Valida un concepto de filtro contra el catálogo. */
export function parseExpenseConceptFilter(
  raw: string | null | undefined,
): string | null {
  const t = String(raw ?? "").trim();
  if (!t || t === "all") return null;
  return expenseConceptFilterOptions().includes(t) ? t : null;
}

/** Concepto espejo al registrar un abono en Proveedores. */
export const EXPENSE_CONCEPT_SUPPLIER_PAYMENT = "Pago a proveedor";

/** Mapea método del abono de proveedor al catálogo de egresos. */
export function mapSupplierPaymentMethodToExpense(
  raw: string,
): ExpensePaymentMethod {
  const m = raw.trim().toLowerCase();
  if (m === "efectivo") return "efectivo";
  if (m === "transferencia") return "transferencia";
  if (m === "tarjeta") return "tarjeta";
  return "otro";
}
