"use client";

import { useState } from "react";
import { productInputClass, productLabelClass } from "@/components/admin/product-form-primitives";
import { normalizeStorefrontColor } from "@/lib/storefront-brand";

const HEX = /^#[0-9a-f]{6}$/i;

export function StoreColorField({
  name,
  label,
  hint,
  defaultColor,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultColor: string;
}) {
  const initial = normalizeStorefrontColor(defaultColor).toLowerCase();
  const [color, setColor] = useState(initial);
  const [draft, setDraft] = useState(initial.toUpperCase());

  function apply(raw: string) {
    const next = raw.trim();
    setDraft(next.toUpperCase());
    if (HEX.test(next)) setColor(next.toLowerCase());
  }

  return (
    <div>
      <label htmlFor={`${name}-picker`} className={productLabelClass}>
        {label}
      </label>
      <input type="hidden" name={name} value={color} />
      <div className="flex items-center gap-2">
        <input
          id={`${name}-picker`}
          type="color"
          value={color}
          onChange={(event) => apply(event.target.value)}
          className="h-11 w-14 cursor-pointer rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          value={draft}
          onChange={(event) => apply(event.target.value)}
          onBlur={() => setDraft(color.toUpperCase())}
          aria-label={`${label} en hexadecimal`}
          spellCheck={false}
          className={productInputClass}
        />
      </div>
      {hint ? <p className="mt-1.5 text-[11px] text-zinc-500">{hint}</p> : null}
    </div>
  );
}
