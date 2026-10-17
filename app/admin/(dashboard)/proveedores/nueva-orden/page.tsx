import { redirect } from "next/navigation";
import {
  SupplierNewInvoiceForm,
  SupplierNewInvoiceHeader,
} from "@/components/admin/SupplierNewInvoiceForm";
import { AdminNewPageShell } from "@/components/admin/AdminNewPageShell";
import { todayYmdInReportStore } from "@/lib/admin-report-range";
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

export default async function AdminNuevaOrdenProveedorPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("suppliers").select("id,name").order("name", { ascending: true });
  const suppliers = (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? "Proveedor"),
  }));
  if (suppliers.length === 0) redirect("/admin/proveedores?crear=1");

  const proveedor = first(sp.proveedor).trim();
  const fixed = suppliers.find((s) => s.id === proveedor) ?? null;
  const error = first(sp.error).trim();

  return (
    <AdminNewPageShell>
      <SupplierNewInvoiceHeader
        variant="orden"
        fixedSupplierId={fixed?.id}
        supplierName={fixed?.name}
      />
      {error === "validation" ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/35 dark:text-amber-100">
          Elegí un proveedor y al menos un producto con cantidad y precio.
        </p>
      ) : error === "db" ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/35 dark:text-amber-100">
          No se pudo guardar la orden. Intentá de nuevo.
        </p>
      ) : null}
      <SupplierNewInvoiceForm
        issueDateDefault={todayYmdInReportStore()}
        suppliers={suppliers}
        initialSupplierId={proveedor || null}
        formContext="orden"
      />
    </AdminNewPageShell>
  );
}
