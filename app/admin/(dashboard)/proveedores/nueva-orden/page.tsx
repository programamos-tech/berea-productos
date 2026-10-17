import { SupplierNewDebtForm } from "@/components/admin/SupplierNewDebtForm";
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

  return (
    <SupplierNewDebtForm
      suppliers={suppliers}
      defaultSupplierId={first(sp.proveedor).trim() || null}
      defaultDate={todayYmdInReportStore()}
      errorCode={first(sp.error).trim() || null}
    />
  );
}
