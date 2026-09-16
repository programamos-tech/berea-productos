import { BranchForm } from "@/components/admin/BranchForm";
import { requireAdminPermission } from "@/lib/require-admin-permission";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function EditBranchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const perm = await requireAdminPermission("sucursales_gestionar");
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("branches")
    .select("id,name,code,logo_path,is_active,is_default")
    .eq("id", id)
    .eq("tenant_id", perm.tenantId)
    .maybeSingle();
  if (!data) notFound();
  const errorMessage =
    error === "logo"
      ? "El logo debe ser JPG, PNG, WebP o AVIF y pesar máximo 3 MB."
      : error === "logo_upload"
        ? "No fue posible guardar el logo. Intenta nuevamente."
        : error === "duplicate"
          ? "Ya existe una sucursal con ese código."
          : error === "default_active"
            ? "La sucursal predeterminada debe permanecer activa."
            : error
              ? "No fue posible guardar los cambios."
              : null;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Editar sucursal</h1>
      {errorMessage ? (
        <p className="mx-auto w-full max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {errorMessage}
        </p>
      ) : null}
      <BranchForm
        initial={{
          id: String(data.id),
          name: String(data.name),
          code: String(data.code),
          logoPath: data.logo_path ? String(data.logo_path) : null,
          isActive: data.is_active === true,
          isDefault: data.is_default === true,
        }}
      />
    </div>
  );
}
