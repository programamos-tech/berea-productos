import Link from "next/link";

type Props = {
  customerId: string;
  lastOrderId: string | null;
  email: string;
};

const actionBtnClass =
  "inline-flex size-9 items-center justify-center rounded-lg text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-white";

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
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.1}
          className="size-5"
          aria-hidden
        >
          <path
            d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="3.5" />
        </svg>
      </Link>
      <Link
        href={`/admin/customers/${customerId}/edit`}
        className={actionBtnClass}
        title="Editar cliente"
        aria-label="Editar cliente"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.1}
          className="size-5"
          aria-hidden
        >
          <path
            d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
      {lastOrderId ? (
        <Link
          href={`/admin/orders/${lastOrderId}`}
          className={actionBtnClass}
          title="Última compra"
          aria-label="Ver última compra"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.1}
            className="size-5"
            aria-hidden
          >
            <path
              d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"
              strokeLinejoin="round"
            />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </Link>
      ) : null}
      {email ? (
        <a
          href={`mailto:${email}`}
          className={actionBtnClass}
          title="Email"
          aria-label="Enviar email"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.1}
            className="size-5"
            aria-hidden
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </a>
      ) : null}
    </div>
  );
}
