import { BranchForm } from "@/components/admin/BranchForm";
import { requireAdminPermission } from "@/lib/require-admin-permission";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function EditBranchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const perm = await requireAdminPermission("sucursales_gestionar");
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("branches")
    .select("id,name,code,is_active,is_default")
    .eq("id", id)
    .eq("tenant_id", perm.tenantId)
    .maybeSingle();
  if (!data) notFound();

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Editar sucursal</h1>
      <BranchForm
        initial={{
          id: String(data.id),
          name: String(data.name),
          code: String(data.code),
          isActive: data.is_active === true,
          isDefault: data.is_default === true,
        }}
      />
    </div>
  );
}
