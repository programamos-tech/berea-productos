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
}: {
  businessDayLabel: string;
  displayName: string | null;
}) {
  const [floatCents, setFloatCents] = useState(0);
  const [submissionId] = useState(newSubmissionId);
  const [hello, setHello] = useState("buenos días");
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

        <form action={openCashRegisterSession} className="mt-6 space-y-4">
          <input type="hidden" name="submission_id" value={submissionId} />
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
      </div>
    </div>
  );
}
