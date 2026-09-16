"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { updateInvoiceLayoutAction } from "@/app/actions/admin/platform-settings";
import type { InvoiceLayout } from "@/lib/invoice-layout";

function TicketPreview() {
  return (
    <div
      className="mx-auto w-[4.5rem] rounded-sm bg-white px-1.5 py-2 shadow-sm ring-1 ring-zinc-200"
      aria-hidden
    >
      <div className="mx-auto mb-1.5 size-4 rounded-full bg-zinc-200" />
      <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-zinc-300" />
      <div className="space-y-1 border-t border-dashed border-zinc-300 pt-1.5">
        <div className="h-1 w-full rounded-full bg-zinc-200" />
        <div className="h-1 w-9 rounded-full bg-zinc-200" />
        <div className="h-1 w-full rounded-full bg-zinc-200" />
      </div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-800" />
    </div>
  );
}

function LetterPreview() {
  return (
    <div
      className="mx-auto aspect-[3/4] w-[5.5rem] rounded-sm bg-white px-2 py-2 shadow-sm ring-1 ring-zinc-200"
      aria-hidden
    >
      <div className="mb-2 flex items-start justify-between">
        <div className="space-y-1">
          <div className="h-1.5 w-10 rounded-full bg-zinc-800" />
          <div className="h-1 w-8 rounded-full bg-zinc-300" />
        </div>
        <div className="size-4 rounded-full bg-zinc-200" />
      </div>
      <div className="mb-2 h-2 w-7 rounded-full bg-zinc-800" />
      <div className="space-y-1">
        <div className="h-1 w-full rounded-full bg-zinc-200" />
        <div className="h-1 w-full rounded-full bg-zinc-200" />
        <div className="h-1 w-9 rounded-full bg-zinc-200" />
      </div>
      <div className="mt-3 ml-auto h-1.5 w-8 rounded-full bg-zinc-800" />
    </div>
  );
}

function LayoutCard({
  value,
  selected,
  disabled,
  title,
  description,
  preview,
}: {
  value: InvoiceLayout;
  selected: boolean;
  disabled: boolean;
  title: string;
  description: string;
  preview: ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="invoice_layout"
      value={value}
      disabled={disabled || pending || selected}
      aria-pressed={selected}
      className={`rounded-2xl border p-4 text-left transition sm:p-5 ${
        selected
          ? "border-[var(--admin-coral)] bg-[color-mix(in_srgb,var(--admin-coral)_8%,white)] ring-2 ring-[var(--admin-coral)] dark:bg-[color-mix(in_srgb,var(--admin-coral)_16%,transparent)]"
          : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
      } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
    >
      <div className="mb-4 flex h-28 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900">
        {preview}
      </div>
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
      {selected ? (
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-coral)]">
          Activo
        </p>
      ) : pending ? (
        <p className="mt-3 text-[11px] font-medium text-zinc-400">Guardando…</p>
      ) : (
        <p className="mt-3 text-[11px] font-medium text-zinc-400">
          Usar este formato
        </p>
      )}
    </button>
  );
}

export function InvoiceLayoutSettings({
  current,
  canEdit,
}: {
  current: InvoiceLayout;
  canEdit: boolean;
}) {
  return (
    <form action={updateInvoiceLayoutAction}>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <LayoutCard
          value="ticket"
          selected={current === "ticket"}
          disabled={!canEdit}
          title="Tira térmica"
          description="Recibo angosto para impresora de 80 mm, como está ahora en las facturas."
          preview={<TicketPreview />}
        />
        <LayoutCard
          value="letter"
          selected={current === "letter"}
          disabled={!canEdit}
          title="Hoja carta"
          description="Documento de una página, con el mismo diseño limpio de las cotizaciones."
          preview={<LetterPreview />}
        />
      </div>
    </form>
  );
}
