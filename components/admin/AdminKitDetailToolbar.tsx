"use client";

import Link from "next/link";
import { useRef, useTransition } from "react";
import { deleteKitAction } from "@/app/actions/admin/kits";
import { adminButtonCancelClass } from "@/lib/admin-ui";

const btnIcon =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800";

const btnPrimary =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-[var(--admin-coral)] bg-[var(--admin-coral)] px-2.5 text-xs font-medium text-white transition hover:border-[var(--admin-coral-hover)] hover:bg-[var(--admin-coral-hover)]";

const dialogClass =
  "fixed left-1/2 top-1/2 z-[200] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-2xl max-h-[min(90dvh,100%)] overflow-y-auto dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 [&::backdrop]:bg-zinc-950/50";

type Props = {
  kitId: string;
  kitName: string;
  canEdit: boolean;
};

export function AdminKitDetailToolbar({ kitId, kitName, canEdit }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();

  const openDialog = () => {
    dialogRef.current?.showModal();
  };

  const closeDialog = () => {
    if (!pending) dialogRef.current?.close();
  };

  const confirmDelete = () => {
    startTransition(() => {
      const fd = new FormData();
      fd.set("kit_id", kitId);
      void deleteKitAction(fd);
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {canEdit ? (
        <Link
          href={`/admin/kits/${kitId}/edit`}
          className={btnPrimary}
          title="Editar kit"
        >
          Editar
        </Link>
      ) : null}
      {canEdit ? (
        <>
          <button
            type="button"
            onClick={openDialog}
            className={btnIcon}
            title="Eliminar kit"
            aria-label="Eliminar kit"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="size-4"
              aria-hidden
            >
              <path
                d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M10 11v6M14 11v6" strokeLinecap="round" />
            </svg>
          </button>
          <dialog
            ref={dialogRef}
            aria-labelledby="kit-delete-dialog-title"
            className={dialogClass}
            onCancel={(e) => {
              if (pending) e.preventDefault();
            }}
          >
            <h2
              id="kit-delete-dialog-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
            >
              ¿Eliminar este kit?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              Se va a borrar{" "}
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                «{kitName}»
              </span>{" "}
              del catálogo. Esta acción no se puede deshacer.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={pending}
                className={adminButtonCancelClass}
                onClick={closeDialog}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={confirmDelete}
                className="rounded-lg border border-red-600 bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {pending ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </dialog>
        </>
      ) : null}
      <Link
        href="/admin/kits"
        className={btnIcon}
        title="Volver a kits"
        aria-label="Volver a kits"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="size-4"
          aria-hidden
        >
          <path
            d="m15 18-6-6 6-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    </div>
  );
}
