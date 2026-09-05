"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CashRegisterSessionModal } from "@/components/admin/CashRegisterSessionModal";
import type { CashDayBlindSummary } from "@/lib/cash-register";

const btnBase =
  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-45";

const btnIdle =
  "border-zinc-300 bg-white text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800";

const btnPrimary =
  "border-[var(--admin-coral)] bg-[var(--admin-coral)] text-white hover:border-[var(--admin-coral-hover)] hover:bg-[var(--admin-coral-hover)]";

type Props = {
  canManage: boolean;
  todayAlreadyClosed: boolean;
  hasOpenSession: boolean;
  todaySessionId: string | null;
  todayLabel: string;
  /** Modal activo: abrir o cerrar. */
  modalMode: "open" | "close" | null;
  businessDayLabel: string;
  sessionId?: string;
  openedAtLabel?: string | null;
  openedByLabel?: string | null;
  blind?: CashDayBlindSummary | null;
  errorBanner?: string | null;
  suggestedOpeningFloatCents?: number;
  /** Abrir el modal al cargar cuando toca operar. */
  autoOpenModal?: boolean;
  /** Solo UI: muestra el modal de cierre con datos congelados, sin submit. */
  previewClose?: boolean;
};

export function CashRegisterPageChrome({
  canManage,
  todayAlreadyClosed,
  hasOpenSession,
  todaySessionId,
  todayLabel,
  modalMode,
  businessDayLabel,
  sessionId,
  openedAtLabel,
  openedByLabel,
  blind,
  errorBanner,
  suggestedOpeningFloatCents = 0,
  autoOpenModal = true,
  previewClose = false,
}: Props) {
  const [panelOpen, setPanelOpen] = useState(Boolean(autoOpenModal && modalMode));

  useEffect(() => {
    if (autoOpenModal && modalMode) setPanelOpen(true);
  }, [autoOpenModal, modalMode]);

  const canOpen = canManage && modalMode === "open" && !previewClose;
  const canClose = canManage && modalMode === "close" && !previewClose;

  const openDisabledReason = !canManage
    ? "Sin permiso para gestionar caja"
    : hasOpenSession
      ? "Ya hay una caja abierta"
      : todayAlreadyClosed
        ? "Hoy ya cerró · se habilita mañana a las 12:00 a. m. (Colombia)"
        : null;

  const closeDisabledReason = !canManage
    ? "Sin permiso para gestionar caja"
    : !hasOpenSession
      ? todayAlreadyClosed
        ? "Hoy ya está cerrada"
        : "No hay caja abierta"
      : null;

  return (
    <>
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 gap-y-2">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-xl">
            Caja
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            {todayAlreadyClosed
              ? `Cerrada · ${todayLabel}`
              : hasOpenSession
                ? `Abierta · ${businessDayLabel}`
                : `Sin abrir · ${todayLabel}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {todayAlreadyClosed && todaySessionId ? (
            <>
              <Link
                href={`/admin/caja/${todaySessionId}`}
                className={`${btnBase} ${btnIdle}`}
              >
                Ver cierre de hoy
              </Link>
              <Link
                href="/admin/caja?preview=cierre"
                className={`${btnBase} ${btnIdle}`}
              >
                Vista modal
              </Link>
            </>
          ) : null}

          <button
            type="button"
            disabled={!canOpen}
            title={openDisabledReason ?? "Abrir caja del día"}
            onClick={() => {
              if (!canOpen) return;
              setPanelOpen(true);
            }}
            className={`${btnBase} ${canOpen ? btnPrimary : btnIdle}`}
          >
            Abrir caja
          </button>

          <button
            type="button"
            disabled={!canClose}
            title={closeDisabledReason ?? "Cerrar caja del día"}
            onClick={() => {
              if (!canClose) return;
              setPanelOpen(true);
            }}
            className={`${btnBase} ${canClose ? btnPrimary : btnIdle}`}
          >
            Cerrar caja
          </button>
        </div>
      </header>

      {errorBanner && !panelOpen ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/35 dark:text-red-100">
          {errorBanner}
        </p>
      ) : null}

      {modalMode ? (
        <CashRegisterSessionModal
          mode={modalMode}
          businessDayLabel={businessDayLabel}
          sessionId={sessionId}
          openedAtLabel={openedAtLabel}
          openedByLabel={openedByLabel}
          blind={blind}
          errorBanner={errorBanner}
          defaultOpen={panelOpen}
          suggestedOpeningFloatCents={suggestedOpeningFloatCents}
          hideStickyBanner
          previewClose={previewClose}
          onDismissed={() => setPanelOpen(false)}
          onRequestOpen={() => setPanelOpen(true)}
        />
      ) : null}
    </>
  );
}
