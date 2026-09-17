"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { productLabelClass } from "@/components/admin/product-form-primitives";

const iconBtnClass =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white";

export function CatalogPublicLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current != null) window.clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (timer.current != null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mb-5">
      <p className={productLabelClass}>Link del catálogo</p>
      <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50/70 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-950/50">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 truncate px-2 py-1.5 text-sm font-medium text-zinc-800 underline-offset-2 hover:underline dark:text-zinc-100"
        >
          {url.replace(/^https:\/\//, "")}
        </a>
        <button
          type="button"
          onClick={() => void copy()}
          className={iconBtnClass}
          title={copied ? "Copiado" : "Copiar link"}
          aria-label={copied ? "Link copiado" : "Copiar link del catálogo"}
        >
          {copied ? (
            <Check className="size-4" strokeWidth={2} aria-hidden />
          ) : (
            <Copy className="size-4" strokeWidth={2} aria-hidden />
          )}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={iconBtnClass}
          title="Abrir catálogo"
          aria-label="Abrir catálogo en una pestaña nueva"
        >
          <ExternalLink className="size-4" strokeWidth={2} aria-hidden />
        </a>
      </div>
      <p className="mt-1.5 text-[11px] text-zinc-500">
        Copiá el link para enviárselo a tus clientes, o entrá a la tienda.
      </p>
    </div>
  );
}
