"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import { productInputClass } from "@/components/admin/product-form-primitives";
import { adminPageSubtitleClass } from "@/lib/admin-ui";

type BranchOption = { id: string; name: string };

type Line = {
  id: string;
  name: string;
  reference: string | null;
  quantity: number;
  available: number;
};

type SearchHit = {
  id: string;
  name: string;
  reference: string | null;
  stock_local: number;
};

type Props = {
  branches: BranchOption[];
  initialFromId: string;
  formAction: (formData: FormData) => void;
  initialLine?: Line | null;
  errorMessage?: string | null;
};

function newSubmissionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `transfer-${Date.now()}`;
}

export function StockTransferForm({
  branches,
  initialFromId,
  formAction,
  initialLine = null,
  errorMessage = null,
}: Props) {
  const [submissionId] = useState(newSubmissionId);
  const [fromId, setFromId] = useState(initialFromId);
  const [toId, setToId] = useState(
    branches.find((branch) => branch.id !== initialFromId)?.id ?? "",
  );
  const [lines, setLines] = useState<Line[]>(initialLine ? [initialLine] : []);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [notes, setNotes] = useState("");

  const destinations = branches.filter((branch) => branch.id !== fromId);
  const units = lines.reduce((sum, line) => sum + line.quantity, 0);
  const canSubmit =
    Boolean(fromId && toId && fromId !== toId) &&
    lines.length > 0 &&
    lines.every((line) => line.quantity >= 1 && line.quantity <= line.available);

  const itemsJson = useMemo(
    () =>
      JSON.stringify(
        lines.map((line) => ({ product_id: line.id, quantity: line.quantity })),
      ),
    [lines],
  );

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1 || !fromId) {
      setHits([]);
      return;
    }
    const handle = window.setTimeout(() => {
      setSearching(true);
      void fetch(
        `/api/admin/products-search?q=${encodeURIComponent(q)}&branch=${encodeURIComponent(fromId)}`,
      )
        .then((response) => response.json())
        .then((body: { products?: SearchHit[] }) => {
          setHits(Array.isArray(body.products) ? body.products : []);
        })
        .catch(() => setHits([]))
        .finally(() => setSearching(false));
    }, 220);
    return () => window.clearTimeout(handle);
  }, [fromId, query]);

  function changeFrom(nextFrom: string) {
    setFromId(nextFrom);
    setLines([]);
    setHits([]);
    setQuery("");
    if (toId === nextFrom) {
      setToId(branches.find((branch) => branch.id !== nextFrom)?.id ?? "");
    }
  }

  function addHit(hit: SearchHit) {
    if (hit.stock_local < 1 || lines.some((line) => line.id === hit.id)) return;
    setLines((current) => [
      ...current,
      {
        id: hit.id,
        name: hit.name,
        reference: hit.reference,
        quantity: 1,
        available: hit.stock_local,
      },
    ]);
    setQuery("");
    setHits([]);
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="submission_id" value={submissionId} />
      <input type="hidden" name="items_json" value={itemsJson} />
      {errorMessage ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMessage}
        </p>
      ) : null}
      <p className={adminPageSubtitleClass}>
        Al enviar, las unidades salen de la sucursal de origen. Entran en la de
        destino cuando confirmen que llegaron.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Desde
          <select
            name="from_branch_id"
            value={fromId}
            onChange={(event) => changeFrom(event.target.value)}
            className={`${productInputClass} mt-1.5`}
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Hacia
          <select
            name="to_branch_id"
            value={toId}
            onChange={(event) => setToId(event.target.value)}
            className={`${productInputClass} mt-1.5`}
          >
            {destinations.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100" htmlFor="transfer-search">
          Agregar producto
        </label>
        <input
          id="transfer-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nombre o referencia"
          className={`${productInputClass} mt-1.5`}
          autoComplete="off"
        />
        {searching ? (
          <p className="mt-2 text-xs text-zinc-500">Buscando…</p>
        ) : null}
        {hits.length > 0 ? (
          <ul className="mt-2 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
            {hits.map((hit) => {
              const added = lines.some((line) => line.id === hit.id);
              const empty = hit.stock_local < 1;
              return (
                <li key={hit.id} className="border-t border-zinc-100 first:border-t-0 dark:border-zinc-800">
                  <button
                    type="button"
                    disabled={added || empty}
                    onClick={() => addHit(hit)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-900"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-zinc-900 dark:text-zinc-100">
                        {hit.name}
                      </span>
                      {hit.reference ? (
                        <span className="block truncate text-xs text-zinc-500">{hit.reference}</span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-xs text-zinc-500">
                      {empty ? "Sin stock" : added ? "Agregado" : `${hit.stock_local} u.`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      {lines.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-sm text-zinc-500 dark:border-zinc-700">
          Todavía no hay productos en este traslado.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-700">
          {lines.map((line) => (
            <li key={line.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {line.name}
                </p>
                <p className="text-xs text-zinc-500">
                  {line.reference ? `${line.reference} · ` : ""}
                  Disponible {line.available}
                </p>
              </div>
              <input
                type="number"
                min={1}
                max={line.available}
                value={line.quantity}
                onChange={(event) => {
                  const next = Math.floor(Number(event.target.value));
                  setLines((current) =>
                    current.map((item) =>
                      item.id === line.id
                        ? {
                            ...item,
                            quantity: Number.isFinite(next)
                              ? Math.min(line.available, Math.max(1, next))
                              : 1,
                          }
                        : item,
                    ),
                  );
                }}
                className="h-10 w-24 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
              <button
                type="button"
                onClick={() =>
                  setLines((current) => current.filter((item) => item.id !== line.id))
                }
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
        Nota
        <textarea
          name="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Opcional"
          className={`${productInputClass} mt-1.5`}
        />
      </label>

      <AdminFormSubmitButton disabled={!canSubmit} pendingLabel="Enviando…">
        Enviar traslado{units > 0 ? ` · ${units} u.` : ""}
      </AdminFormSubmitButton>
    </form>
  );
}
