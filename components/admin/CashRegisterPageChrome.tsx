"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CashRegisterSessionModal } from "@/components/admin/CashRegisterSessionModal";
import type { CashDayBlindSummary } from "@/lib/cash-register";
import {
  adminToolbarBtnActiveClass,
  adminToolbarBtnBaseClass,
  adminToolbarBtnIdleClass,
  adminPageTitleClass,
  adminPageSubtitleClass,
} from "@/lib/admin-ui";

const btnBase = `${adminToolbarBtnBaseClass} disabled:cursor-not-allowed disabled:opacity-45`;
const btnIdle = adminToolbarBtnIdleClass;
const btnPrimary = adminToolbarBtnActiveClass;

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
          <h1 className={adminPageTitleClass}>
            Caja
          </h1>
          <p className={adminPageSubtitleClass}>
            Apertura, cierre y arqueo del efectivo del día
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
