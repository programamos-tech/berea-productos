"use client";

import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import { ProductQuantityInput } from "@/components/admin/product-form-primitives";
import { useMemo, useState } from "react";

type BranchStock = {
  id: string;
  name: string;
  quantity: number;
};

export function AdminTransferStockForm({
  productName,
  branches,
  activeBranchId,
  formAction,
  returnTo,
}: {
  productName: string;
  branches: BranchStock[];
  activeBranchId: string;
  formAction: (formData: FormData) => void;
  returnTo: string;
}) {
  const [fromId, setFromId] = useState(activeBranchId);
  const [toId, setToId] = useState(
    branches.find((branch) => branch.id !== activeBranchId)?.id ?? "",
  );
  const [quantity, setQuantity] = useState(0);
  const from = useMemo(
    () => branches.find((branch) => branch.id === fromId),
    [branches, fromId],
  );
  const canSubmit =
    Boolean(fromId && toId && fromId !== toId) &&
    quantity > 0 &&
    quantity <= (from?.quantity ?? 0);

  return (
    <form
      action={formAction}
      className="mx-auto max-w-2xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-7"
    >
      <input type="hidden" name="return_to" value={returnTo} />
      <h2 className="text-lg font-semibold">{productName}</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Mueve unidades sin cambiar el inventario total del negocio.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Desde
          <select
            name="from_branch_id"
            value={fromId}
            onChange={(event) => setFromId(event.target.value)}
            className="mt-2 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2.5 dark:border-zinc-700"
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name} · {branch.quantity} u.
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Hacia
          <select
            name="to_branch_id"
            value={toId}
            onChange={(event) => setToId(event.target.value)}
            className="mt-2 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2.5 dark:border-zinc-700"
          >
            <option value="">Selecciona una sucursal</option>
            {branches
              .filter((branch) => branch.id !== fromId)
              .map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} · {branch.quantity} u.
                </option>
              ))}
          </select>
        </label>
      </div>

      <div className="mt-5 max-w-48">
        <label className="text-sm font-medium" htmlFor="transfer-quantity">
          Cantidad
        </label>
        <div className="mt-2">
          <ProductQuantityInput
            id="transfer-quantity"
            name="quantity"
            value={quantity}
            onChange={setQuantity}
          />
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Disponible: {from?.quantity ?? 0}
        </p>
      </div>

      <AdminFormSubmitButton
        pendingLabel="Transfiriendo…"
        disabled={!canSubmit}
        className="mt-7 inline-flex w-full justify-center rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-950"
      >
        Transferir
      </AdminFormSubmitButton>
    </form>
  );
}
