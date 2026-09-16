import Link from "next/link";
import { Eye, Mail, Pencil, ShoppingBag } from "lucide-react";

type Props = {
  customerId: string;
  lastOrderId: string | null;
  email: string;
};

const actionBtnClass =
  "inline-flex size-8 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

const actionIconClass = "size-4 shrink-0";

export function CustomerRowActions({
  customerId,
  lastOrderId,
  email,
}: Props) {
  return (
    <div className="flex justify-end gap-0.5">
      <Link
        href={`/admin/customers/${customerId}`}
        className={actionBtnClass}
        title="Ver cliente"
        aria-label="Ver ficha del cliente"
      >
        <Eye className={actionIconClass} strokeWidth={1.75} aria-hidden />
      </Link>
      <Link
        href={`/admin/customers/${customerId}/edit`}
        className={actionBtnClass}
        title="Editar cliente"
        aria-label="Editar cliente"
      >
        <Pencil className={actionIconClass} strokeWidth={1.75} aria-hidden />
      </Link>
      {lastOrderId ? (
        <Link
          href={`/admin/orders/${lastOrderId}`}
          className={actionBtnClass}
          title="Última compra"
          aria-label="Ver última compra"
        >
          <ShoppingBag
            className={actionIconClass}
            strokeWidth={1.75}
            aria-hidden
          />
        </Link>
      ) : null}
      {email ? (
        <a
          href={`mailto:${email}`}
          className={actionBtnClass}
          title="Email"
          aria-label="Enviar email"
        >
          <Mail className={actionIconClass} strokeWidth={1.75} aria-hidden />
        </a>
      ) : null}
    </div>
  );
}
