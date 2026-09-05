"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** Botón primario de formularios admin (coral). */
export const adminPrimarySubmitButtonClass =
  "rounded-lg border border-[var(--admin-coral)] bg-[var(--admin-coral)] py-3.5 text-sm font-semibold text-white shadow-sm transition hover:border-[var(--admin-coral-hover)] hover:bg-[var(--admin-coral-hover)] disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-200 disabled:text-zinc-500 dark:disabled:border-zinc-700 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500";

/** Ancho completo en columnas laterales de formularios de alta. */
export const adminPrimarySubmitButtonFullWidthClass = `mt-5 w-full ${adminPrimarySubmitButtonClass}`;

type AdminFormSubmitButtonProps = {
  children: ReactNode;
  pendingLabel?: string;
  disabled?: boolean;
  className?: string;
} & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "disabled" | "className" | "children"
>;

/** Deshabilita el envío mientras la server action está en curso (evita duplicados). */
export function AdminFormSubmitButton({
  children,
  pendingLabel = "Guardando…",
  disabled = false,
  className = adminPrimarySubmitButtonFullWidthClass,
  ...buttonProps
}: AdminFormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={className}
      {...buttonProps}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
