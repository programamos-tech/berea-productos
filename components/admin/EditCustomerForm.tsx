"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { updateStoreCustomer } from "@/app/actions/admin/store-customers";
import { clampWholesaleDiscountPercent } from "@/lib/customer-wholesale-pricing";
import {
  productInputClass as inputClass,
  productLabelClass as labelClass,
  productSectionTitle as sectionTitle,
} from "@/components/admin/product-form-primitives";

const cardClass =
  "rounded-xl border border-zinc-200 bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:border-zinc-700/90 dark:bg-zinc-900 dark:shadow-none dark:ring-white/[0.06]";

const summaryInset =
  "mt-4 rounded-lg border border-zinc-200/90 bg-white/60 p-4 text-sm dark:border-zinc-700 dark:bg-zinc-950/60";

const LABEL_OPTIONS = ["Casa", "Oficina", "Negocio", "Otro"] as const;
type LabelOption = (typeof LABEL_OPTIONS)[number];

export type EditCustomerAddressRow = {
  label: string;
  address_line: string | null;
  reference: string | null;
};

export type EditCustomerFormProps = {
  customerId: string;
  initialName: string;
  initialEmail: string;
  initialPhone: string;
  initialDocumentId: string;
  initialCustomerKind: string;
  initialWholesaleDiscountPercent: number;
  addressRows: EditCustomerAddressRow[];
  shippingFallback: string | null;
};

type Addr = {
  key: string;
  labelType: LabelOption;
  labelCustom: string;
  addressLine: string;
  reference: string;
};

function parseLabel(dbLabel: string): {
  labelType: LabelOption;
  labelCustom: string;
} {
  const t = dbLabel.trim();
  if ((LABEL_OPTIONS as readonly string[]).includes(t)) {
    return { labelType: t as LabelOption, labelCustom: "" };
  }
  return { labelType: "Otro", labelCustom: t };
}

function newAddress(): Addr {
  return {
    key: crypto.randomUUID(),
    labelType: "Casa",
    labelCustom: "",
    addressLine: "",
    reference: "",
  };
}

function rowsToAddrs(rows: EditCustomerAddressRow[]): Addr[] {
  if (!rows.length) return [];
  return rows.map((r) => ({
    key: crypto.randomUUID(),
    ...parseLabel(r.label),
    addressLine: (r.address_line ?? "").trim(),
    reference: (r.reference ?? "").trim(),
  }));
}

function initialAddressesFromProps(
  addressRows: EditCustomerAddressRow[],
  shippingFallback: string | null,
): Addr[] {
  const fromDb = rowsToAddrs(addressRows);
  if (fromDb.length) return fromDb;
  const ship = shippingFallback?.trim();
  if (ship) {
    const parts = ship.split(/\n\n+/);
    return [
      {
        key: crypto.randomUUID(),
        labelType: "Casa" as const,
        labelCustom: "",
        addressLine: (parts[0] ?? "").trim(),
        reference: parts.slice(1).join("\n\n").trim(),
      },
    ];
  }
  return [newAddress()];
}

function persistedLabel(a: Addr): string {
  if (a.labelType === "Otro") {
    return a.labelCustom.trim() || "Otro";
  }
  return a.labelType;
}

export function EditCustomerHeader({
  customerId,
  customerName,
}: {
  customerId: string;
  customerName: string;
  avatarSeed?: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <Link
            href="/admin/customers"
            className="hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            Clientes
          </Link>
          <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">/</span>
          <Link
            href={`/admin/customers/${customerId}`}
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            title={customerName}
          >
            {customerName.length > 28
              ? `${customerName.slice(0, 28)}…`
              : customerName}
          </Link>
          <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">/</span>
          <span className="text-zinc-700 dark:text-zinc-300">Editar</span>
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          Editar cliente
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          Modifica los datos y direcciones. El historial de compras está en el{" "}
          <Link
            href={`/admin/customers/${customerId}`}
            className="font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900 dark:text-zinc-300 dark:decoration-zinc-600 dark:hover:text-zinc-100"
          >
            detalle del cliente
          </Link>
          .
        </p>
      </div>
      <Link
        href={`/admin/customers/${customerId}`}
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200/90 bg-white text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        aria-label="Volver al detalle"
      >
        <span className="text-lg leading-none" aria-hidden>
          ←
        </span>
      </Link>
    </div>
  );
}

export function EditCustomerForm(props: EditCustomerFormProps) {
  const {
    customerId,
    initialName,
    initialEmail,
    initialPhone,
    initialDocumentId,
    initialCustomerKind,
    initialWholesaleDiscountPercent,
    addressRows,
    shippingFallback,
  } = props;

  const [name, setName] = useState(initialName);
  const [documentId, setDocumentId] = useState(initialDocumentId);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);
  const [customerKind, setCustomerKind] = useState<"retail" | "wholesale">(
    () => (initialCustomerKind === "wholesale" ? "wholesale" : "retail"),
  );
  const [wholesalePct, setWholesalePct] = useState(() =>
    clampWholesaleDiscountPercent(initialWholesaleDiscountPercent),
  );
  const [addresses, setAddresses] = useState<Addr[]>(() =>
    initialAddressesFromProps(addressRows, shippingFallback),
  );

  const payload = useMemo(
    () =>
      JSON.stringify(
        addresses.map((a) => ({
          label: persistedLabel(a),
          address_line: a.addressLine,
          reference: a.reference,
        })),
      ),
    [addresses],
  );

  const filledAddresses = useMemo(
    () =>
      addresses.filter(
        (a) => a.addressLine.trim().length > 0 || a.reference.trim().length > 0,
      ).length,
    [addresses],
  );

  const wholesaleMissing: string[] = [];
  if (customerKind === "wholesale") {
    if (!documentId.trim()) wholesaleMissing.push("NIT");
    if (!phone.trim()) wholesaleMissing.push("teléfono");
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      wholesaleMissing.push("correo válido");
    }
  }

  const canSubmit = name.trim().length > 0 && wholesaleMissing.length === 0;

  function updateAddr(i: number, patch: Partial<Addr>) {
    setAddresses((prev) =>
      prev.map((a, j) => (j === i ? { ...a, ...patch } : a)),
    );
  }

  function addAddress() {
    setAddresses((prev) => [...prev, newAddress()]);
  }

  function removeAddress(i: number) {
    setAddresses((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, j) => j !== i),
    );
  }

  return (
    <form action={updateStoreCustomer} className="space-y-6">
      <input type="hidden" name="customer_id" value={customerId} readOnly />
      <input type="hidden" name="customer_kind" value={customerKind} readOnly />
      <input
        type="hidden"
        name="wholesale_discount_percent"
        value={customerKind === "wholesale" ? wholesalePct : 0}
        readOnly
      />
      <input type="hidden" name="addresses_payload" value={payload} readOnly />

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-2">
          <section className={cardClass}>
            <h2 className={sectionTitle}>Datos personales</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="ec-name" className={labelClass}>
                  Nombre completo{" "}
                  <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <input
                  id="ec-name"
                  name="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="ec-doc" className={labelClass}>
                  {customerKind === "wholesale" ? (
                    <>
                      NIT{" "}
                      <span className="text-red-600 dark:text-red-400">*</span>
                    </>
                  ) : (
                    "Cédula"
                  )}
                </label>
                <input
                  id="ec-doc"
                  name="document_id"
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  placeholder={
                    customerKind === "wholesale"
                      ? "Ej. 900123456-7"
                      : "Ej. 1234567890"
                  }
                  required={customerKind === "wholesale"}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="ec-phone" className={labelClass}>
                  Teléfono
                  {customerKind === "wholesale" ? (
                    <span className="text-red-600 dark:text-red-400"> *</span>
                  ) : null}
                </label>
                <input
                  id="ec-phone"
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  placeholder="Ej. 312 000 0000"
                  required={customerKind === "wholesale"}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="ec-email" className={labelClass}>
                  Correo electrónico
                  {customerKind === "wholesale" ? (
                    <span className="text-red-600 dark:text-red-400"> *</span>
                  ) : null}
                </label>
                <input
                  id="ec-email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="Ej. maria@ejemplo.com"
                  required={customerKind === "wholesale"}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <section className={cardClass}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <h2 className={sectionTitle}>Direcciones</h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Casa, oficina u otras. Dirección completa y punto de
                  referencia.
                </p>
              </div>
              <button
                type="button"
                onClick={addAddress}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                <span aria-hidden>+</span> Añadir dirección
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {addresses.map((a, i) => (
                <div
                  key={a.key}
                  className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 sm:p-5 dark:border-zinc-700 dark:bg-zinc-950/50"
                >
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                      Dirección {i + 1}
                    </p>
                    {addresses.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeAddress(i)}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-200/80 hover:text-red-600 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                        aria-label={`Quitar dirección ${i + 1}`}
                        title="Quitar"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.75}
                          className="size-4"
                          aria-hidden
                        >
                          <path
                            d="M3 6h18M8 6V4h8v2m-1 0v14a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V6h10z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                  <div className="space-y-4">
                    <div
                      className={
                        a.labelType === "Otro"
                          ? "grid gap-4 sm:grid-cols-2"
                          : "grid gap-4 sm:max-w-md"
                      }
                    >
                      <div>
                        <label className={labelClass}>Tipo</label>
                        <select
                          value={a.labelType}
                          onChange={(e) => {
                            const v = e.target.value as LabelOption;
                            updateAddr(i, {
                              labelType: v,
                              labelCustom: v === "Otro" ? a.labelCustom : "",
                            });
                          }}
                          className={inputClass}
                        >
                          {LABEL_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      {a.labelType === "Otro" ? (
                        <div>
                          <label className={labelClass}>Especificar</label>
                          <input
                            value={a.labelCustom}
                            onChange={(e) =>
                              updateAddr(i, { labelCustom: e.target.value })
                            }
                            placeholder="Ej. Principal"
                            className={inputClass}
                          />
                        </div>
                      ) : null}
                    </div>
                    <div>
                      <label className={labelClass}>Dirección completa</label>
                      <textarea
                        value={a.addressLine}
                        onChange={(e) =>
                          updateAddr(i, { addressLine: e.target.value })
                        }
                        rows={3}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Punto de referencia</label>
                      <textarea
                        value={a.reference}
                        onChange={(e) =>
                          updateAddr(i, { reference: e.target.value })
                        }
                        rows={2}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24 lg:col-span-1 lg:self-start">
          <section className={cardClass}>
            <h2 className={sectionTitle}>Tipo de cliente</h2>
            <div className="mt-5 space-y-4">
              <div className="flex flex-col gap-3">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-800 dark:text-zinc-200">
                  <input
                    type="radio"
                    value="retail"
                    checked={customerKind === "retail"}
                    onChange={() => setCustomerKind("retail")}
                    className="size-4 border-zinc-300 text-rose-950 focus:ring-rose-900/30 dark:border-zinc-600 dark:text-rose-300"
                  />
                  Consumidor final
                </label>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-800 dark:text-zinc-200">
                  <input
                    type="radio"
                    value="wholesale"
                    checked={customerKind === "wholesale"}
                    onChange={() => setCustomerKind("wholesale")}
                    className="size-4 border-zinc-300 text-rose-950 focus:ring-rose-900/30 dark:border-zinc-600 dark:text-rose-300"
                  />
                  Mayorista
                </label>
              </div>
              {customerKind === "wholesale" ? (
                <div>
                  <label htmlFor="ec-wholesale-pct" className={labelClass}>
                    Descuento en compra (%)
                  </label>
                  <input
                    id="ec-wholesale-pct"
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={wholesalePct}
                    onChange={(e) =>
                      setWholesalePct(
                        Math.max(
                          0,
                          Math.min(
                            100,
                            Math.floor(Number(e.target.value) || 0),
                          ),
                        ),
                      )
                    }
                    className={`${inputClass} max-w-[10rem]`}
                  />
                  <p className="mt-1.5 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                    Aplica en tienda en línea y en factura POS.
                  </p>
                </div>
              ) : (
                <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Compra al detal sin descuento mayorista.
                </p>
              )}
            </div>
          </section>

          <section className={cardClass}>
            <h2 className={sectionTitle}>Resumen del cliente</h2>
            <div className={summaryInset}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                Cliente
              </p>
              <dl className="mt-3 space-y-2 text-zinc-700 dark:text-zinc-300">
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500 dark:text-zinc-400">Nombre</dt>
                  <dd className="max-w-[60%] truncate text-right text-zinc-900 dark:text-zinc-100">
                    {name.trim() || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500 dark:text-zinc-400">Documento</dt>
                  <dd className="max-w-[55%] truncate text-right font-mono text-xs text-zinc-900 dark:text-zinc-100">
                    {documentId.trim() || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500 dark:text-zinc-400">Tipo</dt>
                  <dd className="text-right text-zinc-800 dark:text-zinc-100">
                    {customerKind === "wholesale" ? "Mayorista" : "Final"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-5 border-t border-zinc-200/70 pt-5 dark:border-zinc-800">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {customerKind === "wholesale"
                  ? "Descuento mayorista"
                  : "Contacto"}
              </p>
              {customerKind === "wholesale" ? (
                <p className="mt-1 text-2xl font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                  {wholesalePct}%
                </p>
              ) : (
                <p className="mt-1 truncate text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  {phone.trim() || email.trim() || "—"}
                </p>
              )}
            </div>

            <ul className="mt-4 space-y-1.5 border-t border-zinc-200/70 pt-4 text-sm dark:border-zinc-800">
              <li className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Teléfono</span>
                <span className="max-w-[55%] truncate text-right text-zinc-900 dark:text-zinc-100">
                  {phone.trim() || "—"}
                </span>
              </li>
              <li className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Correo</span>
                <span className="max-w-[55%] truncate text-right text-zinc-900 dark:text-zinc-100">
                  {email.trim() || "—"}
                </span>
              </li>
              <li className="flex justify-between font-medium text-zinc-900 dark:text-zinc-100">
                <span>Direcciones</span>
                <span className="tabular-nums">
                  {filledAddresses === 0 ? "Ninguna" : filledAddresses}
                </span>
              </li>
            </ul>

            {wholesaleMissing.length > 0 ? (
              <p
                className="mt-4 text-xs leading-relaxed text-amber-800 dark:text-amber-200"
                role="status"
              >
                Completá {wholesaleMissing.join(", ")} para guardar.
              </p>
            ) : (
              <>
                <p className="mt-5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Guardar cambios
                </p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Se actualizarán los datos del cliente. Las ventas previas no
                  se modifican.
                </p>
              </>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              title={
                !canSubmit
                  ? wholesaleMissing.length > 0
                    ? `Completá: ${wholesaleMissing.join(", ")}`
                    : "El nombre es obligatorio"
                  : undefined
              }
              className="mt-4 w-full rounded-lg border border-rose-950 bg-rose-950 py-3.5 text-sm font-medium text-white transition hover:border-rose-900 hover:bg-rose-900 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-200 disabled:text-zinc-500 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:disabled:border-zinc-700 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
            >
              Guardar cambios
            </button>
            <Link
              href={`/admin/customers/${customerId}`}
              className="mt-3 flex w-full items-center justify-center rounded-lg border border-zinc-200 bg-white py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Cancelar
            </Link>
          </section>
        </div>
      </div>
    </form>
  );
}
