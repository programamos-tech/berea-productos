"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { registerOrderCreditPaymentAction } from "@/app/actions/admin/order-credit";
import {
  ProductMoneyInput,
  productInputOnWhiteClass,
} from "@/components/admin/product-form-primitives";

function AbonoSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--admin-coral)] bg-[var(--admin-coral)] py-2.5 text-sm font-semibold text-white transition hover:border-[var(--admin-coral-hover)] hover:bg-[var(--admin-coral-hover)] disabled:pointer-events-none disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 shrink-0 animate-spin" strokeWidth={2.25} aria-hidden />
          Guardando…
        </>
      ) : (
        "Guardar abono"
      )}
    </button>
  );
}

function AbonoCloseButton({ onClose }: { onClose: () => void }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClose}
      className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-800 transition hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-70 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
    >
      Cerrar
    </button>
  );
}

export function OrderCreditAbonoForm({
  orderId,
  pendingCents,
}: {
  orderId: string;
  pendingCents: number;
}) {
  const [open, setOpen] = useState(false);
  const [amountCents, setAmountCents] = useState(0);

  if (pendingCents <= 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setAmountCents(0);
        }}
        className="inline-flex items-center justify-center rounded-lg border border-[var(--admin-coral)] bg-[var(--admin-coral)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:border-[var(--admin-coral-hover)] hover:bg-[var(--admin-coral-hover)]"
      >
        Registrar abono
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          <form action={registerOrderCreditPaymentAction} className="space-y-3">
            <input type="hidden" name="order_id" value={orderId} />
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Monto (COP)
              </label>
              <ProductMoneyInput
                name="amount_cents"
                value={amountCents}
                required
                onChange={(n) =>
                  setAmountCents(n > pendingCents ? pendingCents : n)
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Método
              </label>
              <select
                name="payment_method"
                className={productInputOnWhiteClass}
                defaultValue="cash"
              >
                <option value="cash">Efectivo</option>
                <option value="transfer">Transferencia</option>
              </select>
              <p className="mt-1.5 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                Efectivo: entra a la caja del día. Transferencia: no mueve
                billetes.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Notas (opcional)
              </label>
              <input
                name="notes"
                type="text"
                className={productInputOnWhiteClass}
                placeholder="Referencia banco…"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <AbonoSubmitButton />
              <AbonoCloseButton onClose={() => setOpen(false)} />
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
