import { Suspense } from "react";
import { AdminModuleHeader } from "@/components/admin/AdminModuleHeader";
import {
  ProveedoresFiltersBar,
  ProveedoresHeaderActions,
  type SupplierDebtFilter,
} from "@/components/admin/ProveedoresFiltersBar";
import { ProveedoresTable, type SupplierDirectoryRow } from "@/components/admin/ProveedoresTable";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
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
  if (raw === "balance" || raw === "empty") return raw;
  return "all";
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

  const { data: suppliers, error } = await supabase
    .from("suppliers")
    .select("id,name,document_id,phone")
    .order("name", { ascending: true })
    .limit(500);

  const supplierRows = suppliers ?? [];
  const needsSupplier = supplierRows.length === 0;
  const supplierIds = supplierRows.map((row) => String(row.id));

  const { data: invoices } =
    supplierIds.length > 0
      ? await supabase
          .from("supplier_invoices")
          .select("id,supplier_id,total_cents,is_cancelled")
          .in("supplier_id", supplierIds)
      : { data: [] as { id: string; supplier_id: string; total_cents: number; is_cancelled: boolean }[] };

  const invoiceRows = invoices ?? [];
  const invoiceIds = invoiceRows.map((row) => String(row.id));
  const { data: payments } =
    invoiceIds.length > 0
      ? await supabase
          .from("supplier_invoice_payments")
          .select("invoice_id,amount_cents")
          .in("invoice_id", invoiceIds)
      : { data: [] as { invoice_id: string; amount_cents: number }[] };

  const paidByInvoice = new Map<string, number>();
  for (const pay of payments ?? []) {
    const id = String(pay.invoice_id);
    paidByInvoice.set(id, (paidByInvoice.get(id) ?? 0) + Number(pay.amount_cents ?? 0));
  }

  const pendingBySupplier = new Map<string, number>();
  const ordersBySupplier = new Map<string, number>();
  for (const inv of invoiceRows) {
    const supplierId = String(inv.supplier_id);
    ordersBySupplier.set(supplierId, (ordersBySupplier.get(supplierId) ?? 0) + 1);
    if (inv.is_cancelled) continue;
    const totalCents = Math.max(0, Math.floor(Number(inv.total_cents ?? 0)));
    const paidCents = Math.max(0, paidByInvoice.get(String(inv.id)) ?? 0);
    const pending = Math.max(0, totalCents - paidCents);
    pendingBySupplier.set(supplierId, (pendingBySupplier.get(supplierId) ?? 0) + pending);
  }

  const rows: SupplierDirectoryRow[] = [];
  for (const supplier of supplierRows) {
    const id = String(supplier.id);
    const name = String(supplier.name ?? "Proveedor");
    const documentId = supplier.document_id ? String(supplier.document_id).trim() : "";
    const phone = supplier.phone ? String(supplier.phone).trim() : "";
    const orderCount = ordersBySupplier.get(id) ?? 0;
    const pendingCents = pendingBySupplier.get(id) ?? 0;
    if (filter === "balance" && pendingCents <= 0) continue;
    if (filter === "empty" && orderCount > 0) continue;
    if (q) {
      const haystack = `${name} ${documentId} ${phone}`.toLowerCase();
      if (!haystack.includes(q)) continue;
    }
    rows.push({
      id,
      name,
      documentId: documentId || null,
      phone: phone || null,
      orderCount,
      pendingCents,
    });
  }

  return (
    <div className="flex w-full min-w-0 max-w-none flex-col gap-4">
      <AdminModuleHeader
        icon="proveedores"
        title="Proveedores"
        branchName={perm?.branchContext?.active.name}
        subtitle="Todos los proveedores, aunque todavía no tengan órdenes de compra."
        actions={
          <Suspense fallback={null}>
            <ProveedoresHeaderActions
              needsSupplier={needsSupplier}
              startOpen={needsSupplier && (first(sp.crear) === "1" || first(sp.error) === "proveedor")}
              supplierError={
                first(sp.error) === "proveedor"
                  ? "No se pudo crear el proveedor. Revisá el nombre e intentá de nuevo."
                  : null
              }
            />
          </Suspense>
        }
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
