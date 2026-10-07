"use client";

import Link from "next/link";
import { type ReactNode, useRef, useState } from "react";
import { AdminFormSubmitButton, adminPrimarySubmitButtonClass } from "@/components/admin/AdminFormSubmitButton";
import { productInputClass } from "@/components/admin/product-form-primitives";
import { adminButtonCancelClass } from "@/lib/admin-ui";

const th =
  "pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";

const dialogClass =
  "fixed left-1/2 top-1/2 z-[200] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-2xl max-h-[min(90dvh,100%)] overflow-y-auto dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 [&::backdrop]:bg-zinc-950/50";

export type TransferOpenLine = {
  productId: string;
  name: string;
  reference: string;
  sent: number;
};

type Props = {
  lines: TransferOpenLine[];
  canReceive: boolean;
  canCancel: boolean;
  transferId: string;
  submissionId: string;
  fromName: string;
  units: number;
  receiveAction: (formData: FormData) => void;
  cancelAction: (formData: FormData) => void;
  children: ReactNode;
};

function parsedQty(raw: string, sent: number): number | null {
  if (!/^\d+$/.test(raw.trim())) return null;
  const qty = Number(raw);
  if (!Number.isInteger(qty) || qty < 0 || qty > sent) return null;
  return qty;
}

export function StockTransferOpenDetail({
  lines,
  canReceive,
  canCancel,
  transferId,
  submissionId,
  fromName,
  units,
  receiveAction,
  cancelAction,
  children,
}: Props) {
  const [qty, setQty] = useState<Record<string, string>>({});
  const [cancelStep, setCancelStep] = useState<"note" | "confirm">("note");
  const [cancelNote, setCancelNote] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const parsed = lines.map((line) => parsedQty(qty[line.productId] ?? "", line.sent));
  const receivedTotal = parsed.reduce<number>((sum, value) => sum + (value ?? 0), 0);
  const receiveReady = canReceive && parsed.every((value) => value !== null) && receivedTotal > 0;
  const note = cancelNote.trim();

  function openCancel() {
    setCancelStep("note");
    dialogRef.current?.showModal();
  }

  function closeCancel() {
    dialogRef.current?.close();
    setCancelStep("note");
  }

  return (
    <>
    <div className="flex flex-col gap-6 border-t border-zinc-200/70 pt-4 dark:border-zinc-800 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,20rem)] lg:items-start lg:gap-10 xl:gap-12">
      <section className="min-w-0">
        {lines.length === 0 ? (
          <p className="text-sm text-zinc-500">No hay productos en este traslado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] table-fixed text-left text-sm leading-relaxed sm:text-[15px]">
              <colgroup>
                <col />
                <col className="w-24" />
                {canReceive ? <col className="w-28" /> : null}
              </colgroup>
              <thead>
                <tr className="border-b border-zinc-200/70 dark:border-zinc-800">
                  <th className={th}>Producto</th>
                  <th className={`${th} text-right`}>Enviadas</th>
                  {canReceive ? <th className={`${th} text-right`}>Recibidas</th> : null}
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const raw = qty[line.productId] ?? "";
                  const invalid = raw.trim().length > 0 && parsedQty(raw, line.sent) === null;
                  return (
                    <tr
                      key={line.productId}
                      className="border-b border-zinc-100/80 last:border-0 dark:border-zinc-800/80"
                    >
                      <td className="py-3 pr-5 align-middle text-zinc-800 dark:text-zinc-200">
                        <Link
                          href={`/admin/products/${line.productId}`}
                          className="block font-medium leading-snug hover:underline"
                        >
                          {line.name}
                        </Link>
                        {line.reference ? (
                          <span className="mt-1 block font-mono text-xs text-zinc-500">
                            Ref. {line.reference}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                        {line.sent}
                      </td>
                      {canReceive ? (
                        <td className="py-3 text-right">
                          <input
                            inputMode="numeric"
                            aria-label={`Unidades recibidas de ${line.name}`}
                            value={raw}
                            placeholder="0"
                            onChange={(event) =>
                              setQty((current) => ({
                                ...current,
                                [line.productId]: event.target.value.replace(/\D/g, ""),
                              }))
                            }
                            className={`ml-auto h-9 w-20 rounded-lg border bg-white px-2 text-right text-sm tabular-nums text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 ${
                              invalid
                                ? "border-red-400 dark:border-red-500"
                                : "border-zinc-200 dark:border-zinc-700"
                            }`}
                          />
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {canReceive ? (
          <p className="mt-3 text-sm text-zinc-500">
            Escribe cuántas unidades llegaron. Si llega menos, la diferencia vuelve a {fromName}.
            {parsed.every((value) => value !== null) && receivedTotal < 1
              ? " Si no llegó ninguna, anula el traslado."
              : ""}
          </p>
        ) : null}
      </section>

      <aside className="shrink-0 space-y-5 border-t border-zinc-200/70 pt-4 dark:border-zinc-800 lg:sticky lg:top-3 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0 xl:pl-10 dark:lg:border-zinc-800">
        {children}
        <div className="flex flex-col gap-2">
          {canReceive ? (
            <form action={receiveAction}>
              <input type="hidden" name="transfer_id" value={transferId} />
              <input type="hidden" name="submission_id" value={`${submissionId}-receive`} />
              <input
                type="hidden"
                name="items_json"
                value={JSON.stringify(
                  lines.map((line) => ({
                    product_id: line.productId,
                    quantity: parsedQty(qty[line.productId] ?? "", line.sent) ?? 0,
                  })),
                )}
              />
              <AdminFormSubmitButton
                disabled={!receiveReady}
                pendingLabel="Recibiendo…"
                className={`w-full ${adminPrimarySubmitButtonClass}`}
              >
                Confirmar llegada
              </AdminFormSubmitButton>
            </form>
          ) : (
            <p className="text-sm text-zinc-500">
              La sucursal de destino escribe las unidades que llegaron.
            </p>
          )}
          {canCancel ? (
            <button type="button" className={adminButtonCancelClass} onClick={openCancel}>
              Anular y devolver
            </button>
          ) : null}
        </div>
      </aside>
    </div>

      {canCancel ? (
        <dialog
          ref={dialogRef}
          aria-labelledby="transfer-cancel-title"
          className={dialogClass}
          onClose={() => setCancelStep("note")}
        >
          <h2 id="transfer-cancel-title" className="text-lg font-semibold">
            {cancelStep === "note" ? "Anular traslado" : "Confirma la anulación"}
          </h2>
          {cancelStep === "note" ? (
            <>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                Escribe por qué se anula. La nota queda en el traslado.
              </p>
              <label className="mt-4 block text-sm font-medium" htmlFor="transfer-cancel-note">
                Nota
              </label>
              <textarea
                id="transfer-cancel-note"
                value={cancelNote}
                onChange={(event) => setCancelNote(event.target.value)}
                maxLength={500}
                rows={3}
                className={`${productInputClass} mt-1.5`}
                placeholder="Motivo de la anulación"
              />
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <button type="button" className={adminButtonCancelClass} onClick={closeCancel}>
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={note.length < 1}
                  className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
                  onClick={() => setCancelStep("confirm")}
                >
                  Continuar
                </button>
              </div>
            </>
          ) : (
            <form action={cancelAction}>
              <input type="hidden" name="transfer_id" value={transferId} />
              <input type="hidden" name="submission_id" value={`${submissionId}-cancel`} />
              <input type="hidden" name="notes" value={note} />
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                Las {units} unidades vuelven a {fromName}. Esta acción no se puede deshacer.
              </p>
              <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
                {note}
              </p>
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  className={adminButtonCancelClass}
                  onClick={() => setCancelStep("note")}
                >
                  Volver
                </button>
                <AdminFormSubmitButton
                  pendingLabel="Anulando…"
                  className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
                >
                  Sí, anular
                </AdminFormSubmitButton>
              </div>
            </form>
          )}
        </dialog>
      ) : null}
    </>
  );
}
