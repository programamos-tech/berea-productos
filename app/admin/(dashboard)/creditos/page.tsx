import { Suspense } from "react";
import {
  CreditosFiltersBar,
  CreditosRefreshButton,
} from "@/components/admin/CreditosFiltersBar";
import { CreditosTable } from "@/components/admin/CreditosTable";
import {
  fetchAdminCreditsList,
  parseCreditListFilter,
} from "@/lib/admin-order-credits";
import {
  adminPageSubtitleClass,
  adminPageTitleClass,
} from "@/lib/admin-ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(v: string | string[] | undefined): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return "";
}

export default async function AdminCreditosPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filter = parseCreditListFilter(first(sp.estado));
  const qRaw = first(sp.q).trim();
  const customerId = first(sp.cliente).trim();
  const supabase = await createSupabaseServerClient();
  const { rows, error } = await fetchAdminCreditsList(supabase, {
    filter,
    q: qRaw,
    customerId: customerId || undefined,
  });

  return (
    <div className="flex w-full min-w-0 max-w-none flex-col gap-4">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 gap-y-2">
        <div className="min-w-0">
          <h1 className={adminPageTitleClass}>Créditos</h1>
          <p className={adminPageSubtitleClass}>
            Facturas a crédito y abonos. El saldo baja con cada cobro.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <CreditosRefreshButton />
        </div>
      </header>

      <Suspense
        fallback={
          <div
            role="status"
            className="h-16 animate-pulse rounded-lg bg-zinc-100/80 dark:bg-zinc-800/60 motion-reduce:animate-none"
          >
            <span className="sr-only">Cargando filtros…</span>
          </div>
        }
      >
        <CreditosFiltersBar initialQ={qRaw} />
      </Suspense>

      <section className="min-h-0 border-t border-zinc-200/70 pt-4 dark:border-zinc-800">
        {error ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            No se pudieron cargar los créditos. Revisá permisos y migraciones.
          </p>
        ) : (
          <CreditosTable rows={rows} />
        )}
      </section>
    </div>
  );
}
