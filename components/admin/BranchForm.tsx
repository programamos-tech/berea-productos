import {
  createBranchAction,
  updateBranchAction,
} from "@/app/actions/admin/branches";
import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import {
  productInputClass,
  productLabelClass,
} from "@/components/admin/product-form-primitives";
import Link from "next/link";

type InitialBranch = {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  isDefault: boolean;
};

export function BranchForm({ initial }: { initial?: InitialBranch }) {
  const editing = Boolean(initial);
  return (
    <form
      action={editing ? updateBranchAction : createBranchAction}
      className="mx-auto max-w-2xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-7"
    >
      {initial ? (
        <input type="hidden" name="branch_id" value={initial.id} />
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={productLabelClass}>
            Nombre
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={initial?.name}
            placeholder="Ej. Centro"
            className={productInputClass}
          />
        </div>
        <div>
          <label htmlFor="code" className={productLabelClass}>
            Código
          </label>
          <input
            id="code"
            name="code"
            defaultValue={initial?.code}
            placeholder="Se genera desde el nombre"
            className={productInputClass}
          />
        </div>
        {initial ? (
          <>
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
              <input type="hidden" name="is_active" value="false" />
              <input
                type="checkbox"
                name="is_active"
                value="true"
                defaultChecked={initial.isActive}
                className="size-4 rounded"
              />
              Sucursal activa
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
              <input type="hidden" name="is_default" value="false" />
              <input
                type="checkbox"
                name="is_default"
                value="true"
                defaultChecked={initial.isDefault}
                className="size-4 rounded"
              />
              Sucursal predeterminada
            </label>
          </>
        ) : null}
      </div>
      <div className="mt-7 flex items-center justify-end gap-3">
        <Link
          href="/admin/sucursales"
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-700"
        >
          Cancelar
        </Link>
        <AdminFormSubmitButton pendingLabel="Guardando…">
          {editing ? "Guardar cambios" : "Crear sucursal"}
        </AdminFormSubmitButton>
      </div>
    </form>
  );
}
