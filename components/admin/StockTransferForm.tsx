"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import {
  productInputClass,
  productLabelClass,
  productSectionTitle,
} from "@/components/admin/product-form-primitives";

const sectionClass = "border-t border-zinc-200/70 pt-4 dark:border-zinc-800";
const qtyBtnClass =
  "inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800";
const removeBtnClass =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40";

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

  function setQty(id: string, next: number, available: number) {
    const quantity = Math.min(available, Math.max(1, Math.floor(next)));
    setLines((current) =>
      current.map((item) => (item.id === id ? { ...item, quantity } : item)),
    );
  }

  return (
    <form
      action={formAction}
      className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(28rem,32rem)] xl:gap-10"
    >
      <input type="hidden" name="submission_id" value={submissionId} />
      <input type="hidden" name="items_json" value={itemsJson} />

      <div className="min-w-0 space-y-6">
        {errorMessage ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessage}
          </p>
        ) : null}

        <section className={sectionClass}>
          <h2 className={productSectionTitle}>Ruta</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={productLabelClass} htmlFor="transfer-from">
                Desde
              </label>
              <select
                id="transfer-from"
                name="from_branch_id"
                value={fromId}
                onChange={(event) => changeFrom(event.target.value)}
                className={productInputClass}
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={productLabelClass} htmlFor="transfer-to">
                Hacia
              </label>
              <select
                id="transfer-to"
                name="to_branch_id"
                value={toId}
                onChange={(event) => setToId(event.target.value)}
                className={productInputClass}
              >
                {destinations.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className={productSectionTitle}>Productos</h2>
          <div className="relative mt-3">
            <input
              id="transfer-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar producto por nombre o código"
              className={productInputClass}
              autoComplete="off"
            />
            {query.trim().length > 0 ? (
              <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-md shadow-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900">
                {searching ? (
                  <p className="px-3 py-2 text-sm text-zinc-500">Buscando…</p>
                ) : hits.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-zinc-500">Sin resultados.</p>
                ) : (
                  hits.map((hit) => {
                    const added = lines.some((line) => line.id === hit.id);
                    const empty = hit.stock_local < 1;
                    return (
                      <button
                        key={hit.id}
                        type="button"
                        disabled={added || empty}
                        onClick={() => addHit(hit)}
                        className="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left text-sm transition hover:bg-zinc-50/80 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800/90"
                      >
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {hit.name}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {hit.reference ? `${hit.reference} · ` : ""}
                          {empty ? "Sin stock" : added ? "Agregado" : `${hit.stock_local} u.`}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            ) : null}
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className={productSectionTitle}>Ítems seleccionados</h2>
          {lines.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">
              Todavía no hay productos en este traslado.
            </p>
          ) : (
            <ul className="mt-1 divide-y divide-zinc-100 dark:divide-zinc-800">
              {lines.map((line) => (
                <li key={line.id} className="py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-zinc-800 dark:text-zinc-200">{line.name}</p>
                      <p className="text-xs text-zinc-500">
                        {line.reference ? `${line.reference} · ` : ""}
                        Disponible {line.available}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className={qtyBtnClass}
                        onClick={() => setQty(line.id, line.quantity - 1, line.available)}
                        disabled={line.quantity <= 1}
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm tabular-nums text-zinc-900 dark:text-zinc-100">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        className={qtyBtnClass}
                        onClick={() => setQty(line.id, line.quantity + 1, line.available)}
                        disabled={line.quantity >= line.available}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setLines((current) => current.filter((item) => item.id !== line.id))
                      }
                      className={removeBtnClass}
                      title="Quitar"
                      aria-label={`Quitar ${line.name}`}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={`${sectionClass} min-w-0 xl:border-l xl:border-t-0 xl:border-zinc-200/70 xl:pl-8 xl:pt-0 dark:xl:border-zinc-800 2xl:pl-10`}>
        <h2 className={productSectionTitle}>Nota</h2>
        <textarea
          name="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Opcional"
          className={`${productInputClass} mt-3`}
        />
        <p className={`${productSectionTitle} mt-6`}>Unidades</p>
        <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
          {units}
        </p>
        <AdminFormSubmitButton disabled={!canSubmit} pendingLabel="Enviando…">
          Enviar traslado
        </AdminFormSubmitButton>
      </section>
    </form>
  );
}
