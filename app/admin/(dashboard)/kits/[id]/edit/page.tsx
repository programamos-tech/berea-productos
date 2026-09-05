import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteKitAction } from "@/app/actions/admin/kits";
import { KitForm } from "@/components/admin/KitForm";
import { fetchKitWithItems } from "@/lib/load-product-kits";
import { kitFormErrorMessage } from "@/lib/kit-form-errors";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminEditKitPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : undefined;
  const saved = sp.saved === "1";
  const banner = kitFormErrorMessage(error);
  const supabase = await createSupabaseServerClient();
  const kit = await fetchKitWithItems(supabase, id);
  if (!kit) notFound();

  const perm = await loadAdminPermissions();
  const canEdit = Boolean(perm?.permissions.kits_gestionar);

  const crumb =
    kit.name.trim().length > 40
      ? `${kit.name.trim().slice(0, 39)}…`
      : kit.name.trim();

  return (
    <div className="flex w-full min-w-0 max-w-none flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-2 gap-y-2">
        <div className="min-w-0">
          <p className="text-[11px] text-zinc-500">
            <Link
              href="/admin/kits"
              className="hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Kits
            </Link>
            <span className="mx-1.5 text-zinc-400">/</span>
            <Link
              href={`/admin/kits/${id}`}
              className="hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              {crumb}
            </Link>
            <span className="mx-1.5 text-zinc-400">/</span>
            Editar
          </p>
          <h1 className="mt-0.5 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-xl">
            Editar kit
          </h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {canEdit ? (
            <form action={deleteKitAction}>
              <input type="hidden" name="kit_id" value={kit.id} />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:border-red-300 hover:bg-red-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-red-300 dark:hover:border-red-800 dark:hover:bg-red-950/40"
              >
                Eliminar
              </button>
            </form>
          ) : null}
          <Link
            href={`/admin/kits/${id}`}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
            title="Volver al detalle"
            aria-label="Volver al detalle"
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
      </header>

      {saved ? (
        <p className="rounded-lg border border-emerald-200/80 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/35 dark:text-emerald-100">
          Cambios guardados.
        </p>
      ) : null}
      {banner ? (
        <p
          className="rounded-lg border border-red-200/80 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/35 dark:text-red-100"
          role="alert"
        >
          {banner}
        </p>
      ) : null}

      <KitForm mode="edit" kit={kit} canEdit={canEdit} />
    </div>
  );
}
