"use client";

import Link from "next/link";
import { Ban, Check, Eye } from "lucide-react";
import { useState } from "react";
import {
  cancelStockTransfer,
  receiveStockTransfer,
} from "@/app/actions/admin/stock-transfers";

const actionBtnClass =
  "inline-flex size-8 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

const iconClass = "size-4 shrink-0";

type Props = {
  transferId: string;
  canReceive: boolean;
  canCancel: boolean;
};

function newToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `transfer-${Date.now()}`;
}

export function StockTransferRowActions({
  transferId,
  canReceive,
  canCancel,
}: Props) {
  const [receiveToken] = useState(newToken);
  const [cancelToken] = useState(newToken);

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Link
        href={`/admin/traslados/${transferId}`}
        className={actionBtnClass}
        title="Ver traslado"
        aria-label="Ver traslado"
      >
        <Eye className={iconClass} strokeWidth={1.75} aria-hidden />
      </Link>
      {canReceive ? (
        <form action={receiveStockTransfer}>
          <input type="hidden" name="transfer_id" value={transferId} />
          <input type="hidden" name="submission_id" value={receiveToken} />
          <input type="hidden" name="return_to" value="/admin/traslados" />
          <button
            type="submit"
            className={actionBtnClass}
            title="Confirmar llegada"
            aria-label="Confirmar llegada"
          >
            <Check className={iconClass} strokeWidth={1.75} aria-hidden />
          </button>
        </form>
      ) : null}
      {canCancel ? (
        <form
          action={cancelStockTransfer}
          onSubmit={(event) => {
            if (!window.confirm("¿Anular este traslado y devolver las unidades al origen?")) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="transfer_id" value={transferId} />
          <input type="hidden" name="submission_id" value={cancelToken} />
          <input type="hidden" name="return_to" value="/admin/traslados" />
          <button
            type="submit"
            className={`${actionBtnClass} hover:text-red-700 dark:hover:text-red-300`}
            title="Anular traslado"
            aria-label="Anular traslado"
          >
            <Ban className={iconClass} strokeWidth={1.75} aria-hidden />
          </button>
        </form>
      ) : null}
    </div>
  );
}
