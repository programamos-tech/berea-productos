"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  CashRegisterClosePanel,
  CashRegisterOpenForm,
} from "@/components/admin/CashRegisterForms";
import type { CashDayBlindSummary } from "@/lib/cash-register";
import { adminButtonCancelClass } from "@/lib/admin-ui";

export type CashRegisterModalMode = "open" | "close";

type Props = {
  mode: CashRegisterModalMode | null;
  businessDayLabel: string;
  /** Solo en modo close */
  sessionId?: string;
  blind?: CashDayBlindSummary | null;
  /** Banner de error del cierre/apertura */
  errorBanner?: string | null;
  /** Si true, abre el modal al montar cuando hay mode */
  defaultOpen?: boolean;
};

export function CashRegisterSessionModal({
  mode,
  businessDayLabel,
  sessionId,
  blind,
  errorBanner,
  defaultOpen = true,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(!defaultOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Nueva sesión / cambio de modo: volver a mostrar el modal.
    setDismissed(!defaultOpen);
  }, [mode, sessionId, defaultOpen]);

  const open = Boolean(mode) && !dismissed && mounted;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDismissed(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const reopen = () => setDismissed(false);

  return (
    <>
      {mode && dismissed ? (
        <div className="sticky top-0 z-20 -mx-3 mb-4 border-b border-zinc-200/80 bg-white/95 px-3 py-3 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/40">
            <p className="text-sm text-amber-950 dark:text-amber-100">
              {mode === "close"
                ? `Caja abierta · ${businessDayLabel}. Contá el efectivo cuando estés lista.`
                : `Falta abrir la caja de ${businessDayLabel}.`}
            </p>
            <button
              type="button"
              onClick={reopen}
              className="inline-flex items-center justify-center rounded-lg border border-rose-950 bg-rose-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-rose-900 hover:bg-rose-900 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
            >
              {mode === "close" ? "Continuar cierre" : "Abrir caja"}
            </button>
          </div>
        </div>
      ) : null}

      {open && mode
        ? createPortal(
            <>
              <button
                type="button"
                className="fixed inset-0 z-[100] bg-zinc-950/70 backdrop-blur-sm dark:bg-black/80"
                aria-label="Cerrar"
                onClick={() => setDismissed(true)}
              />
              <div className="pointer-events-none fixed inset-0 z-[101] flex items-center justify-center p-3 sm:p-5 lg:left-64">
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="caja-session-modal-title"
                  className="pointer-events-auto flex max-h-[min(92dvh,920px)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800 sm:px-6">
                    <div className="min-w-0">
                      <h2
                        id="caja-session-modal-title"
                        className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
                      >
                        {mode === "close" ? "Cierre de caja" : "Abrir caja"}
                      </h2>
                      <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                        {mode === "close"
                          ? `Contá a ciegas · ${businessDayLabel}`
                          : `Fondo inicial · ${businessDayLabel}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDismissed(true)}
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                      aria-label="Cerrar"
                    >
                      <span className="text-xl leading-none" aria-hidden>
                        ×
                      </span>
                    </button>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                    {errorBanner ? (
                      <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/35 dark:text-red-100">
                        {errorBanner}
                      </p>
                    ) : null}

                    {mode === "open" ? (
                      <CashRegisterOpenForm businessDayLabel={businessDayLabel} />
                    ) : sessionId && blind ? (
                      <CashRegisterClosePanel
                        sessionId={sessionId}
                        businessDayLabel={businessDayLabel}
                        blind={blind}
                      />
                    ) : null}
                  </div>

                  <div className="flex shrink-0 justify-end border-t border-zinc-100 bg-zinc-50/80 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-950/50 sm:px-6">
                    <button
                      type="button"
                      onClick={() => setDismissed(true)}
                      className={adminButtonCancelClass}
                    >
                      Ver historial
                    </button>
                  </div>
                </div>
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
