"use client";

import { useEffect, useState } from "react";
import { PiggyBank } from "lucide-react";
import { openCashRegisterSession } from "@/app/actions/admin/cash-register";
import {
  AdminFormSubmitButton,
  adminPrimarySubmitButtonFullWidthClass,
} from "@/components/admin/AdminFormSubmitButton";
import {
  ProductMoneyInput,
  productLabelClass as labelClass,
} from "@/components/admin/product-form-primitives";

function newSubmissionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `caja_open_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function greetingForHour(hour: number): string {
  if (hour < 12) return "buenos días";
  if (hour < 19) return "buenas tardes";
  return "buenas noches";
}

export function CashRegisterMorningGateModal({
  businessDayLabel,
  displayName,
  demoMode = false,
}: {
  businessDayLabel: string;
  displayName: string | null;
  /** Solo preview: no abre caja de verdad. */
  demoMode?: boolean;
}) {
  const [floatCents, setFloatCents] = useState(0);
  const [submissionId] = useState(newSubmissionId);
  const [hello, setHello] = useState("buenos días");
  const [demoDone, setDemoDone] = useState(false);
  const name = displayName?.trim() || "vendedora";

  useEffect(() => {
    setHello(greetingForHour(new Date().getHours()));
  }, []);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-zinc-950/55 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="caja-morning-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        {demoMode ? (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            Simulación · así lo ve {name} al entrar mañana (sin caja abierta).
          </p>
        ) : null}
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950/50">
            <PiggyBank
              className="h-5 w-5 text-rose-800/70 dark:text-rose-300/80"
              aria-hidden
            />
          </span>
          <div className="min-w-0">
            <h2
              id="caja-morning-title"
              className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
            >
              Hola, {hello}
            </h2>
            <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {name}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              Iniciamos el día · {businessDayLabel}. ¿Cuánto de dinero de base tenés en caja?
              Sin abrirla no podés facturar ni usar el resto del panel.
            </p>
          </div>
        </div>

        {demoDone ? (
          <div className="mt-6 space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">
            <p className="font-medium">Caja abierta (simulado).</p>
            <p className="opacity-90">
              En producción, al confirmar, ya podría ir a Ventas a facturar. El menú dejaría de
              estar bloqueado.
            </p>
          </div>
        ) : (
          <form
            action={demoMode ? undefined : openCashRegisterSession}
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              if (floatCents === 0) {
                const ok = window.confirm(
                  "El fondo inicial está en $0.\n\n¿Estás segura de que la caja va a comenzar en 0?",
                );
                if (!ok) {
                  e.preventDefault();
                  return;
                }
              }
              if (demoMode) {
                e.preventDefault();
                setDemoDone(true);
              }
            }}
          >
            {!demoMode ? (
              <input type="hidden" name="submission_id" value={submissionId} />
            ) : null}
            <div>
              <span className={labelClass}>Dinero base en caja</span>
              <div className="mt-2">
                <ProductMoneyInput
                  name="opening_float_cents"
                  value={floatCents}
                  onChange={setFloatCents}
                  required
                />
              </div>
            </div>
            <AdminFormSubmitButton
              pendingLabel="Abriendo caja…"
              className={adminPrimarySubmitButtonFullWidthClass}
            >
              Abrir caja e iniciar el día
            </AdminFormSubmitButton>
          </form>
        )}
      </div>
    </div>
  );
}
