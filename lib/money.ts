export function formatCop(cents: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(cents);
}

/** Eje de gráficos: mismo tipo de valor que `formatCop`, notación compacta. */
export function formatCopCompact(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "$ 0";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(n);
}

/** Valor entero en pesos para inputs admin: vacío si es 0; miles con punto (es-CO). */
export function formatCopInputGrouping(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(Math.floor(n));
}

/** Stock y cantidades: mismo formato de miles (es-CO). */
export const formatQuantityInputGrouping = formatCopInputGrouping;

/** Pesos con miles (punto) y hasta 2 decimales (coma), estilo es-CO. */
export function formatCopAmountInput(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/** Mientras se escribe: solo dígitos, un separador decimal y máximo 2 decimales. */
export function sanitizeCopDecimalTyping(raw: string): string {
  const cleaned = raw.replace(/[^\d,]/g, "");
  const comma = cleaned.indexOf(",");
  const intDigits = (comma === -1 ? cleaned : cleaned.slice(0, comma)).replace(
    /^0+(?=\d)/,
    "",
  );
  const grouped = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (comma === -1) return grouped;
  const dec = cleaned
    .slice(comma + 1)
    .replace(/\D/g, "")
    .slice(0, 2);
  return `${grouped || "0"},${dec}`;
}

/** `150.000,50` → 150000.5. Vacío o inválido → 0. */
export function parseCopDecimalInput(raw: string): number {
  const normalized = raw.trim().replace(/\./g, "").replace(",", ".");
  if (!normalized) return 0;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

/** Solo dígitos → entero ≥ 0 (quita ceros a la izquierda al interpretar el número). */
export function parseCopInputDigitsToInt(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return 0;
  const n = parseInt(digits, 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, Number.MAX_SAFE_INTEGER);
}
