/** Validación del comprobante, usable en el navegador y en el servidor. */

export const TRANSFER_PROOF_MAX_BYTES = 12 * 1024 * 1024;

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
  heic: "image/heic",
  heif: "image/heif",
};

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "image/heic": "heic",
  "image/heif": "heif",
};

export type TransferProofMeta = {
  size: number;
  type: string;
  name: string;
};

export function transferProofMime(file: TransferProofMeta): string | null {
  const ext = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  if (EXT_TO_MIME[ext]) return EXT_TO_MIME[ext];
  const raw = file.type.toLowerCase().split(";")[0]?.trim() ?? "";
  if (raw === "image/jpg" || raw === "image/pjpeg") return "image/jpeg";
  if (MIME_TO_EXT[raw]) return raw;
  return null;
}

export function transferProofExt(mime: string): string | null {
  return MIME_TO_EXT[mime] ?? null;
}

/** null si el archivo se puede enviar. */
export function transferProofRejection(file: TransferProofMeta | null): string | null {
  if (!file || file.size <= 0) {
    return "Selecciona el comprobante de la transferencia.";
  }
  if (file.size > TRANSFER_PROOF_MAX_BYTES) {
    return "El archivo supera 12 MB. Elige una captura más liviana o un PDF.";
  }
  if (!transferProofMime(file)) {
    return "Ese archivo no sirve. Sube JPG, PNG, WebP, HEIC o PDF.";
  }
  return null;
}
