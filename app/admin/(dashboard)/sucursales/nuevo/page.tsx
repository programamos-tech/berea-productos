import { BranchForm } from "@/components/admin/BranchForm";
import { requireAdminPermission } from "@/lib/require-admin-permission";

export default async function NewBranchPage() {
  await requireAdminPermission("sucursales_gestionar");
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Nueva sucursal</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Empezará con inventario en cero y el catálogo compartido.
        </p>
      </div>
      <BranchForm />
    </div>
  );
}
