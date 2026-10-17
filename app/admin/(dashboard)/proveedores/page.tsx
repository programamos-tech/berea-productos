import { Suspense } from "react";
import { AdminModuleHeader } from "@/components/admin/AdminModuleHeader";
import {
  ProveedoresFiltersBar,
  ProveedoresHeaderActions,
  type SupplierDebtFilter,
} from "@/components/admin/ProveedoresFiltersBar";
import { ProveedoresTable, type SupplierDebtRow } from "@/components/admin/ProveedoresTable";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import { supplierInvoiceUiStatus } from "@/lib/supplier-invoices";
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

function parseFilter(raw: string): SupplierDebtFilter {
  if (raw === "paid" || raw === "cancelled" || raw === "all") return raw;
  return "pending";
}

export default async function AdminProveedoresPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filter = parseFilter(first(sp.estado));
  const qRaw = first(sp.q).trim();
  const q = qRaw.toLowerCase();

  const [perm, supabase] = await Promise.all([
    loadAdminPermissions(),
    createSupabaseServerClient(),
  ]);

  const { data: invoices, error } = await supabase
    .from("supplier_invoices")
    .select("id,supplier_id,folio,total_cents,issue_date,is_cancelled,notes")
    .order("issue_date", { ascending: false })
    .limit(500);

  const invoiceRows = invoices ?? [];
  const invoiceIds = invoiceRows.map((row) => String(row.id));
  const supplierIds = [...new Set(invoiceRows.map((row) => String(row.supplier_id)))];

  const [{ data: suppliers }, { data: payments }] = await Promise.all([
    supplierIds.length > 0
      ? supabase.from("suppliers").select("id,name").in("id", supplierIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    invoiceIds.length > 0
      ? supabase
          .from("supplier_invoice_payments")
          .select("invoice_id,amount_cents")
          .in("invoice_id", invoiceIds)
      : Promise.resolve({ data: [] as { invoice_id: string; amount_cents: number }[] }),
  ]);

  const nameById = new Map((suppliers ?? []).map((s) => [String(s.id), String(s.name ?? "Proveedor")]));
  const paidByInvoice = new Map<string, number>();
  for (const pay of payments ?? []) {
    const id = String(pay.invoice_id);
    paidByInvoice.set(id, (paidByInvoice.get(id) ?? 0) + Number(pay.amount_cents ?? 0));
  }

  const rows: SupplierDebtRow[] = [];
  for (const inv of invoiceRows) {
    const id = String(inv.id);
    const supplierId = String(inv.supplier_id);
    const supplierName = nameById.get(supplierId) ?? "Proveedor";
    const folio = String(inv.folio ?? "");
    const notes = String(inv.notes ?? "");
    const totalCents = Math.max(0, Math.floor(Number(inv.total_cents ?? 0)));
    const paidCents = Math.max(0, paidByInvoice.get(id) ?? 0);
    const cancelled = Boolean(inv.is_cancelled);
    const pendingCents = cancelled ? 0 : Math.max(0, totalCents - paidCents);
    const uiStatus = supplierInvoiceUiStatus(totalCents, paidCents, cancelled);
    if (filter !== "all" && uiStatus !== filter) continue;
    if (q) {
      const haystack = `${folio} ${supplierName} ${notes}`.toLowerCase();
      if (!haystack.includes(q)) continue;
    }
    rows.push({
      id,
      supplierId,
      folio,
      supplierName,
      issueDate: String(inv.issue_date ?? "").slice(0, 10),
      totalCents,
      paidCents,
      pendingCents,
      uiStatus,
    });
  }

  return (
    <div className="flex w-full min-w-0 max-w-none flex-col gap-4">
      <AdminModuleHeader
        icon="proveedores"
        title="Proveedores"
        branchName={perm?.branchContext?.active.name}
        subtitle="Órdenes de compra y abonos. El saldo baja con cada pago."
        actions={<ProveedoresHeaderActions />}
      />

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
        <ProveedoresFiltersBar initialQ={qRaw} />
      </Suspense>

      <section className="min-h-0 border-t border-zinc-200/70 pt-4 dark:border-zinc-800">
        {error ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            No se pudieron cargar las órdenes. Revisá permisos y migraciones.
          </p>
        ) : (
          <ProveedoresTable rows={rows} />
        )}
      </section>
    </div>
  );
}
