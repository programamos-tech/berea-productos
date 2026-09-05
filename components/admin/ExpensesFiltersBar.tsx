"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminDateInput } from "@/components/admin/product-form-primitives";
import {
  adminFilterInputClass,
  adminFilterLabelClass,
} from "@/lib/admin-ui";
import { expenseConceptFilterOptions } from "@/lib/expense-concepts";

function buildExpensesQuery(
  pathname: string,
  patch: { q?: string; concept?: string; from?: string; to?: string },
  current: URLSearchParams,
) {
  const p = new URLSearchParams(current.toString());
  for (const [key, val] of Object.entries(patch)) {
    if (val === undefined) continue;
    const t = String(val).trim();
    if (!t || (key === "concept" && t === "all")) p.delete(key);
    else p.set(key, t);
  }
  p.delete("page");
  const qs = p.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

const CONCEPT_OPTIONS = expenseConceptFilterOptions();

type Props = {
  initialQ: string;
  initialConcept: string;
  initialFrom: string;
  initialTo: string;
};

export function ExpensesFiltersBar({
  initialQ,
  initialConcept,
  initialFrom,
  initialTo,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(initialQ);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const concept = (searchParams.get("concept") ?? initialConcept) || "all";

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
    setFrom(searchParams.get("from") ?? "");
    setTo(searchParams.get("to") ?? "");
  }, [searchParams]);

  const pushQuery = useCallback(
    (patch: { q?: string; concept?: string; from?: string; to?: string }) => {
      router.replace(buildExpensesQuery(pathname, patch, searchParams));
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      const urlQ = searchParams.get("q") ?? "";
      if (q.trim() === urlQ.trim()) return;
      pushQuery({ q });
    }, 380);
    return () => clearTimeout(t);
  }, [q, pushQuery, searchParams]);

  const conceptValue =
    concept && CONCEPT_OPTIONS.includes(concept) ? concept : "all";

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-12 lg:items-end lg:gap-3">
      <div className="min-w-0 sm:col-span-2 lg:col-span-3">
        <label htmlFor="expense-q" className={adminFilterLabelClass}>
          Buscar
        </label>
        <input
          id="expense-q"
          name="q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Notas, texto…"
          className={adminFilterInputClass}
          autoComplete="off"
          aria-label="Buscar por notas o texto"
        />
      </div>
      <div className="min-w-0 sm:col-span-2 lg:col-span-3">
        <label htmlFor="expense-concept" className={adminFilterLabelClass}>
          Concepto
        </label>
        <select
          id="expense-concept"
          value={conceptValue}
          onChange={(e) => pushQuery({ concept: e.target.value })}
          className={adminFilterInputClass}
        >
          <option value="all">Todos</option>
          {CONCEPT_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-0 lg:col-span-3">
        <label htmlFor="expense-from" className={adminFilterLabelClass}>
          Desde
        </label>
        <AdminDateInput
          id="expense-from"
          name="from"
          value={from}
          allowEmpty
          emptyLabel="dd/mm/aaaa"
          className={adminFilterInputClass}
          onChange={(next) => {
            setFrom(next);
            pushQuery({ from: next });
          }}
        />
      </div>
      <div className="min-w-0 lg:col-span-3">
        <label htmlFor="expense-to" className={adminFilterLabelClass}>
          Hasta
        </label>
        <AdminDateInput
          id="expense-to"
          name="to"
          value={to}
          allowEmpty
          emptyLabel="dd/mm/aaaa"
          className={adminFilterInputClass}
          onChange={(next) => {
            setTo(next);
            pushQuery({ to: next });
          }}
        />
      </div>
    </div>
  );
}
