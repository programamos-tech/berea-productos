import { BranchForm } from "@/components/admin/BranchForm";
import { requireAdminPermission } from "@/lib/require-admin-permission";

export default async function NewBranchPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdminPermission("sucursales_gestionar");
  const { error } = await searchParams;
  const errorMessage =
    error === "logo"
      ? "El logo debe ser JPG, PNG, WebP o AVIF y pesar máximo 3 MB."
      : error === "logo_upload"
        ? "No fue posible subir el logo. Intenta nuevamente."
        : error === "duplicate"
          ? "Ya existe una sucursal con ese código."
          : error
            ? "Revisa la información e intenta nuevamente."
            : null;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Nueva sucursal</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Empezará con inventario en cero y el catálogo compartido.
        </p>
      </div>
      {errorMessage ? (
        <p className="mx-auto w-full max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {errorMessage}
        </p>
      ) : null}
      <BranchForm />
    </div>
  );
}
