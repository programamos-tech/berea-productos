"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { loadCashCloseBlindSummary } from "@/app/actions/admin/cash-register";
import { AdminPortalRoot } from "@/components/admin/AdminPortalRoot";
import {
  CashRegisterClosePanel,
  CashRegisterOpenForm,
} from "@/components/admin/CashRegisterForms";
import type { CashDayBlindSummary } from "@/lib/cash-register";

export type CashRegisterModalMode = "open" | "close";

type Props = {
  mode: CashRegisterModalMode | null;
  businessDayLabel: string;
  sessionId?: string;
  openedAtLabel?: string | null;
  openedByLabel?: string | null;
  blind?: CashDayBlindSummary | null;
  errorBanner?: string | null;
  defaultOpen?: boolean;
  suggestedOpeningFloatCents?: number;
  /** Oculta la barra sticky al cerrar el modal (la página ya muestra Abrir/Cerrar). */
  hideStickyBanner?: boolean;
  /** Solo UI: no refresca ni permite cerrar de verdad. */
  previewClose?: boolean;
  onDismissed?: () => void;
  onRequestOpen?: () => void;
};

export function CashRegisterSessionModal({
  mode,
  businessDayLabel,
  sessionId,
  openedAtLabel,
  openedByLabel,
  blind,
  errorBanner,
  defaultOpen = true,
  suggestedOpeningFloatCents = 0,
  hideStickyBanner = false,
  previewClose = false,
  onDismissed,
  onRequestOpen,
}: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(!defaultOpen);
  const [liveBlind, setLiveBlind] = useState<CashDayBlindSummary | null>(
    blind ?? null,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setDismissed(!defaultOpen);
  }, [mode, sessionId, defaultOpen]);

  useEffect(() => {
    setLiveBlind(blind ?? null);
  }, [blind]);

  const open = Boolean(mode) && !dismissed && mounted;

  function dismiss() {
    setDismissed(true);
    onDismissed?.();
  }

  function reopen() {
    setDismissed(false);
    onRequestOpen?.();
  }

  useEffect(() => {
    if (!open || mode !== "close" || !sessionId || previewClose) return;
    let cancelled = false;
    void (async () => {
      const fresh = await loadCashCloseBlindSummary(sessionId);
      if (!cancelled && fresh) setLiveBlind(fresh);
    })();
    router.refresh();
    return () => {
      cancelled = true;
    };
  }, [open, mode, sessionId, router, previewClose]);

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
      if (e.key === "Escape") {
        setDismissed(true);
        onDismissed?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onDismissed]);

  const subtitle =
    mode === "close"
      ? previewClose
        ? `Vista previa · ${businessDayLabel} (no cierra)`
        : ["Turno abierto", openedAtLabel, openedByLabel]
            .filter(Boolean)
            .join(" · ") || businessDayLabel
      : `Efectivo del día anterior · ${businessDayLabel}`;

  return (
    <>
      {mode && dismissed && !hideStickyBanner ? (
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
              className="inline-flex items-center justify-center rounded-lg border border-[var(--admin-coral)] bg-[var(--admin-coral)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-[var(--admin-coral-hover)] hover:bg-[var(--admin-coral-hover)]"
            >
              {mode === "close" ? "Continuar cierre" : "Abrir caja"}
            </button>
          </div>
        </div>
      ) : null}

      {open && mode
        ? createPortal(
            <AdminPortalRoot>
            <>
              <button
                type="button"
                className="fixed inset-x-0 bottom-0 top-14 z-[100] bg-zinc-950/25 backdrop-blur-[1px] dark:bg-black/35 sm:top-16 lg:left-64"
                aria-label="Cerrar"
                onClick={dismiss}
              />
              <div className="pointer-events-none fixed inset-x-0 bottom-0 top-14 z-[101] flex items-center justify-center p-3 sm:top-16 sm:p-6 lg:left-64">
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="caja-session-modal-title"
                  className={`pointer-events-auto flex max-h-[min(94dvh,960px)] w-full flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-950 ${
                    mode === "close" ? "max-w-5xl" : "max-w-lg"
                  }`}
                >
                  <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-200/70 px-5 py-4 dark:border-zinc-800 sm:px-6">
                    <div className="min-w-0">
                      <h2
                        id="caja-session-modal-title"
                        className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
                      >
                        {mode === "close" ? "Cerrar caja" : "Abrir caja"}
                      </h2>
                      <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                        {subtitle}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={dismiss}
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                      aria-label="Cerrar"
                    >
                      <span className="text-xl leading-none" aria-hidden>
                        ×
                      </span>
                    </button>
                  </div>

                  {mode === "open" ? (
                    <div className="admin-panel-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                      {errorBanner ? (
                        <p className="mb-4 text-sm text-red-700 dark:text-red-400">
                          {errorBanner}
                        </p>
                      ) : null}
                      <CashRegisterOpenForm
                        suggestedOpeningFloatCents={suggestedOpeningFloatCents}
                      />
                    </div>
                  ) : sessionId && liveBlind ? (
                    <CashRegisterClosePanel
                      sessionId={sessionId}
                      businessDayLabel={businessDayLabel}
                      openedAtLabel={openedAtLabel}
                      openedByLabel={openedByLabel}
                      blind={liveBlind}
                      errorBanner={errorBanner}
                      onDismiss={dismiss}
                      preview={previewClose}
                    />
                  ) : null}
                </div>
              </div>
            </>
            </AdminPortalRoot>,
            document.body,
          )
        : null}
    </>
  );
}
