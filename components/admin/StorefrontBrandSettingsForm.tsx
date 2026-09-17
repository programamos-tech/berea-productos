"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { updateStorefrontBrandAction } from "@/app/actions/admin/storefront-brand";
import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import {
  productInputClass,
  productLabelClass,
} from "@/components/admin/product-form-primitives";

type InitialStorefrontBrand = {
  tradeName: string;
  logoSrc: string;
  primaryColor: string;
  tagline: string;
  description: string;
  announcement: string;
  phone: string;
  email: string;
  whatsapp: string;
  supportHours: string;
  instagramUrl: string;
  bankHolder: string;
  bankTaxId: string;
  bankAccount: string;
  checkoutMode: "wompi" | "transfer";
  canUseWompi: boolean;
};

function toHex(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, "0");
}

export async function deriveLogoPrimaryColor(file: File): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(bitmap, 0, 0, 64, 64);
    bitmap.close();
    const pixels = context.getImageData(0, 0, 64, 64).data;
    let red = 0;
    let green = 0;
    let blue = 0;
    let count = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      const alpha = pixels[index + 3] ?? 0;
      const r = pixels[index] ?? 0;
      const g = pixels[index + 1] ?? 0;
      const b = pixels[index + 2] ?? 0;
      if (alpha < 100 || (r > 242 && g > 242 && b > 242)) continue;
      red += r;
      green += g;
      blue += b;
      count += 1;
    }
    if (count === 0) return null;
    return `#${toHex(red / count)}${toHex(green / count)}${toHex(blue / count)}`.toUpperCase();
  } catch {
    return null;
  }
}

export function StorefrontBrandSettingsForm({
  initial,
}: {
  initial: InitialStorefrontBrand;
}) {
  const [color, setColor] = useState(initial.primaryColor);
  const [preview, setPreview] = useState(initial.logoSrc);

  useEffect(
    () => () => {
      if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  return (
    <form
      action={updateStorefrontBrandAction}
      encType="multipart/form-data"
      className="space-y-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="storefront-trade-name" className={productLabelClass}>
            Nombre del catálogo
          </label>
          <input
            id="storefront-trade-name"
            name="trade_name"
            defaultValue={initial.tradeName}
            required
            className={productInputClass}
          />
        </div>
        <div>
          <label htmlFor="storefront-color" className={productLabelClass}>
            Color principal
          </label>
          <div className="flex items-center gap-2">
            <input
              id="storefront-color"
              name="primary_color"
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value.toUpperCase())}
              className="h-11 w-14 cursor-pointer rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input
              value={color}
              onChange={(event) => setColor(event.target.value.toUpperCase())}
              aria-label="Color hexadecimal"
              className={productInputClass}
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="storefront-logo" className={productLabelClass}>
            Logo del catálogo
          </label>
          <div className="mt-2 flex items-center gap-4">
            <Image
              src={preview}
              alt="Vista previa del logo"
              width={160}
              height={80}
              unoptimized
              className="h-16 w-auto max-w-[10rem] bg-transparent object-contain object-left"
              style={{ backgroundColor: "transparent" }}
            />
            <div className="min-w-0 flex-1">
              <input
                id="storefront-logo"
                name="logo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setPreview((current) => {
                    if (current.startsWith("blob:")) URL.revokeObjectURL(current);
                    return URL.createObjectURL(file);
                  });
                  const extracted = await deriveLogoPrimaryColor(file);
                  if (extracted) setColor(extracted);
                }}
                className="block w-full text-xs text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white dark:text-zinc-300 dark:file:bg-zinc-100 dark:file:text-zinc-900"
              />
              <p className="mt-1.5 text-[11px] text-zinc-500">
                Al elegir un logo proponemos un color; puedes ajustarlo antes de guardar.
              </p>
            </div>
          </div>
        </div>

        {[
          ["tagline", "Frase corta", initial.tagline],
          ["announcement", "Mensaje de la franja superior", initial.announcement],
          ["phone", "Teléfono público", initial.phone],
          ["email", "Correo público", initial.email],
          ["whatsapp", "WhatsApp", initial.whatsapp],
          ["support_hours", "Horario de atención", initial.supportHours],
          ["instagram_url", "URL de Instagram", initial.instagramUrl],
        ].map(([name, label, defaultValue]) => (
          <div key={name}>
            <label htmlFor={`storefront-${name}`} className={productLabelClass}>
              {label}
            </label>
            <input
              id={`storefront-${name}`}
              name={name}
              defaultValue={defaultValue}
              className={productInputClass}
            />
          </div>
        ))}

        <div className="sm:col-span-2">
          <label htmlFor="storefront-description" className={productLabelClass}>
            Descripción
          </label>
          <textarea
            id="storefront-description"
            name="description"
            rows={3}
            defaultValue={initial.description}
            className={productInputClass}
          />
        </div>

        <div>
          <label htmlFor="storefront-bank-holder" className={productLabelClass}>
            Titular para transferencias
          </label>
          <input
            id="storefront-bank-holder"
            name="bank_holder"
            defaultValue={initial.bankHolder}
            className={productInputClass}
          />
        </div>
        <div>
          <label htmlFor="storefront-bank-tax" className={productLabelClass}>
            Documento del titular
          </label>
          <input
            id="storefront-bank-tax"
            name="bank_tax_id"
            defaultValue={initial.bankTaxId}
            className={productInputClass}
          />
        </div>
        <div>
          <label htmlFor="storefront-bank-account" className={productLabelClass}>
            Banco, tipo y número de cuenta
          </label>
          <input
            id="storefront-bank-account"
            name="bank_account"
            defaultValue={initial.bankAccount}
            className={productInputClass}
          />
        </div>
        <div>
          <label htmlFor="storefront-checkout" className={productLabelClass}>
            Forma de pago del catálogo
          </label>
          <select
            id="storefront-checkout"
            name="checkout_mode"
            defaultValue={initial.checkoutMode}
            className={productInputClass}
          >
            <option value="transfer">Transferencia/manual</option>
            {initial.canUseWompi ? (
              <option value="wompi">Wompi</option>
            ) : null}
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <AdminFormSubmitButton pendingLabel="Guardando catálogo…">
          Guardar apariencia
        </AdminFormSubmitButton>
      </div>
    </form>
  );
}
