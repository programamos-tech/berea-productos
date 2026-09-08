import Link from "next/link";
import { redirect } from "next/navigation";
import { ExpenseConceptsManager } from "@/components/admin/ExpenseConceptsManager";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import { fetchStoreExpenseConcepts } from "@/lib/store-expense-concepts";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  adminPageSubtitleClass,
  adminPageTitleClass,
  adminToolbarIconBtnClass,
} from "@/lib/admin-ui";

export const dynamic = "force-dynamic";

function flashMessage(code: string | undefined): string | null {
  switch (code) {
    case "created":
      return "Concepto creado.";
    case "updated":
      return "Concepto actualizado.";
    case "deleted":
      return "Concepto eliminado.";
    case "deactivated":
      return "Concepto desactivado (ya tenía gastos asociados).";
    default:
      return null;
  }
}

function errorMessage(code: string | undefined): string | null {
  switch (code) {
    case "name":
      return "El nombre debe tener al menos 2 caracteres.";
    case "kinds":
      return "Marcá al menos Gasto o Egreso.";
    case "duplicate":
      return "Ya existe un concepto con ese nombre.";
    case "system":
      return "Ese concepto del sistema no se puede eliminar.";
    case "missing":
    case "invalid":
      return "Concepto no encontrado.";
    case "db":
      return "No se pudo guardar. Probá de nuevo.";
    default:
      return null;
  }
}

export default async function AdminExpenseConceptsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const perm = await loadAdminPermissions();
  if (!perm?.permissions.egresos_ver) redirect("/admin");
  if (!perm.permissions.egresos_crear) redirect("/admin/egresos");

  const sp = await searchParams;
  const ok = typeof sp.ok === "string" ? sp.ok : undefined;
  const error = typeof sp.error === "string" ? sp.error : undefined;

  const supabase = await createSupabaseServerClient();
  const rows = await fetchStoreExpenseConcepts(supabase);

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className={adminPageTitleClass}>Conceptos</h1>
          <p className={adminPageSubtitleClass}>
            Catálogo de gastos y egresos
          </p>
        </div>
        <Link
          href="/admin/egresos"
          className={adminToolbarIconBtnClass}
          title="Volver a gastos"
          aria-label="Volver a gastos"
        >
          ←
        </Link>
      </header>

      {flashMessage(ok) ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100">
          {flashMessage(ok)}
        </p>
      ) : null}
      {errorMessage(error) ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          {errorMessage(error)}
        </p>
      ) : null}

      <ExpenseConceptsManager rows={rows} />
    </div>
  );
}
