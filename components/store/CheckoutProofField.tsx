"use client";

import { useState } from "react";

export function CheckoutProofField() {
  const [filename, setFilename] = useState("");

  return (
    <label className="mt-6 block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-900">
        Comprobante de pago
      </span>
      <input
        name="proof"
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
        required
        className="block w-full text-sm text-stone-700 file:mr-3 file:border-0 file:bg-stone-100 file:px-3 file:py-2.5 file:text-[11px] file:font-semibold file:uppercase file:tracking-wide file:text-stone-800"
        onChange={(event) => {
          setFilename(event.currentTarget.files?.[0]?.name ?? "");
        }}
      />
      <p className="mt-2 text-xs leading-relaxed text-stone-500">
        {filename
          ? `Listo: ${filename}. El pedido se crea al enviarlo.`
          : "JPG, PNG, WebP, HEIC o PDF. Máximo 12 MB. Sin este archivo el pedido no entra al sistema."}
      </p>
    </label>
  );
}
