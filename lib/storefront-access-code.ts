const ACCESS_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Código de 8 caracteres, sin 0/O ni 1/I. */
export function generateStorefrontAccessCode(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const byte of bytes) {
    code += ACCESS_ALPHABET[byte % ACCESS_ALPHABET.length];
  }
  return code;
}

export function normalizeStorefrontAccessCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}
