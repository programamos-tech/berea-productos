import Link from "next/link";
import { Ban, Check, Eye } from "lucide-react";

const actionBtnClass =
  "inline-flex size-8 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

const iconClass = "size-4 shrink-0";

type Props = {
  transferId: string;
  canReceive: boolean;
  canCancel: boolean;
};

export function StockTransferRowActions({
  transferId,
  canReceive,
  canCancel,
}: Props) {
  const href = `/admin/traslados/${transferId}`;

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Link href={href} className={actionBtnClass} title="Ver traslado" aria-label="Ver traslado">
        <Eye className={iconClass} strokeWidth={1.75} aria-hidden />
      </Link>
      {canReceive ? (
        <Link
          href={href}
          className={actionBtnClass}
          title="Recibir traslado"
          aria-label="Recibir traslado"
        >
          <Check className={iconClass} strokeWidth={1.75} aria-hidden />
        </Link>
      ) : null}
      {canCancel ? (
        <Link
          href={href}
          className={`${actionBtnClass} hover:text-red-700 dark:hover:text-red-300`}
          title="Anular traslado"
          aria-label="Anular traslado"
        >
          <Ban className={iconClass} strokeWidth={1.75} aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}
