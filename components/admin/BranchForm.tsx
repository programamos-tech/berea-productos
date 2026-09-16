import {
  createBranchAction,
  updateBranchAction,
} from "@/app/actions/admin/branches";
import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import {
  productInputClass,
  productLabelClass,
} from "@/components/admin/product-form-primitives";
import {
  shouldUnoptimizeStorageImageUrl,
  storagePublicObjectUrl,
} from "@/lib/storage-public-url";
import Image from "next/image";
import Link from "next/link";

type InitialBranch = {
  id: string;
  name: string;
  code: string;
  logoPath: string | null;
  isActive: boolean;
  isDefault: boolean;
};

export function BranchForm({ initial }: { initial?: InitialBranch }) {
  const editing = Boolean(initial);
  const logoUrl = storagePublicObjectUrl(initial?.logoPath);
  return (
    <form
      action={editing ? updateBranchAction : createBranchAction}
      encType="multipart/form-data"
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
        <div className="sm:col-span-2">
          <label htmlFor="logo" className={productLabelClass}>
            Logo de la sucursal
          </label>
          <div className="mt-2 flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:flex-row sm:items-center dark:border-zinc-700 dark:bg-zinc-950/50">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`Logo de ${initial?.name ?? "la sucursal"}`}
                width={72}
                height={72}
                unoptimized={shouldUnoptimizeStorageImageUrl(logoUrl)}
                className="size-16 shrink-0 rounded-xl border border-zinc-200 bg-white object-cover dark:border-zinc-700"
              />
            ) : (
              <div className="flex size-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white text-lg font-semibold text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
                {(initial?.name ?? "S").trim().charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="block w-full text-xs text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-zinc-700 dark:text-zinc-300 dark:file:bg-zinc-100 dark:file:text-zinc-900"
              />
              <p className="mt-1.5 text-[11px] text-zinc-500">
                JPG, PNG, WebP o AVIF. Máximo 3 MB.
              </p>
              {initial?.logoPath ? (
                <label className="mt-2 flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    name="remove_logo"
                    value="true"
                    className="size-3.5 rounded"
                  />
                  Quitar logo actual
                </label>
              ) : null}
            </div>
          </div>
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
