import Link from "next/link";
import { CreditosTable } from "@/components/admin/CreditosTable";
import {
  fetchAdminCreditsList,
  parseCreditListFilter,
  type CreditListFilter,
} from "@/lib/admin-order-credits";
import {
  adminFilterInputClass,
  adminPageSubtitleClass,
  adminPageTitleClass,
  adminToolbarBtnActiveClass,
  adminToolbarBtnBaseClass,
  adminToolbarBtnIdleClass,
} from "@/lib/admin-ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const FILTERS: { id: CreditListFilter; label: string }[] = [
  { id: "pending", label: "Pendientes" },
  { id: "paid", label: "Pagadas" },
  { id: "cancelled", label: "Anuladas" },
  { id: "all", label: "Todas" },
];

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
    <div className="flex min-h-0 flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={adminPageTitleClass}>Créditos</h1>
          <p className={adminPageSubtitleClass}>
            Facturas a crédito y abonos. El saldo baja con cada cobro.
          </p>
        </div>
      </header>

      <form className="flex flex-wrap items-end gap-2" method="get">
        {filter !== "pending" ? (
          <input type="hidden" name="estado" value={filter} />
        ) : null}
        {customerId ? (
          <input type="hidden" name="cliente" value={customerId} />
        ) : null}
        <div className="min-w-[12rem] flex-1">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Cliente
          </label>
          <input
            name="q"
            defaultValue={qRaw}
            placeholder="Buscar por nombre"
            className={adminFilterInputClass}
          />
        </div>
        <button
          type="submit"
          className={`${adminToolbarBtnBaseClass} ${adminToolbarBtnIdleClass}`}
        >
          Buscar
        </button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          const params = new URLSearchParams();
          if (f.id !== "pending") params.set("estado", f.id);
          if (qRaw) params.set("q", qRaw);
          if (customerId) params.set("cliente", customerId);
          const href = params.size
            ? `/admin/creditos?${params.toString()}`
            : "/admin/creditos";
          return (
            <Link
              key={f.id}
              href={href}
              className={`${adminToolbarBtnBaseClass} ${
                active ? adminToolbarBtnActiveClass : adminToolbarBtnIdleClass
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {error ? (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          No se pudieron cargar los créditos. Revisá permisos y migraciones.
        </p>
      ) : (
        <CreditosTable rows={rows} />
      )}
    </div>
  );
}
