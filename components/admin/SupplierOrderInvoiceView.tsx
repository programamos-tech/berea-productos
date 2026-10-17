import Image from "next/image";
import Link from "next/link";
import {
  deleteSupplierInvoiceAttachmentAction,
  toggleSupplierLineDefectAction,
  uploadSupplierInvoiceAttachmentAction,
} from "@/app/actions/admin/suppliers";
import { SupplierAbonoForm } from "@/components/admin/SupplierAbonoForm";
import { SupplierCancelInvoiceButton } from "@/components/admin/SupplierCancelInvoiceButton";
import { SupplierOrderAddProducts } from "@/components/admin/SupplierOrderAddProducts";
import { StaticCopCents } from "@/components/admin/ReportsAnimatedFigures";
import { formatCop } from "@/lib/money";
import { formatStoreDateTime } from "@/lib/store-datetime-format";
import { supplierInvoiceStatusBadge, type SupplierInvoiceUiStatus } from "@/lib/supplier-invoices";
import { shouldUnoptimizeStorageImageUrl, storagePublicObjectUrl } from "@/lib/storage-public-url";

const th =
  "pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";
const labelClass = "text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";

export type SupplierOrderLine = {
  id: string;
  name: string;
  reference: string | null;
  quantity: number;
  unitPriceCents: number;
  grossCents: number;
  isDefective: boolean;
};

export type SupplierOrderPayment = {
  id: string;
  amountCents: number;
  methodLabel: string;
  paidAt: string | null;
  notes: string | null;
  expenseId: string | null;
  expenseCancelled: boolean;
};

export type SupplierOrderAttachment = {
  id: string;
  fileName: string;
  storagePath: string;
};

export function SupplierOrderInvoiceView({
  supplierId,
  supplierName,
  supplierDocument,
  supplierPhone,
  supplierAddress,
  invoiceId,
  folio,
  issueLabel,
  notes,
  cancelled,
  totalCents,
  paidCents,
  pendingCents,
  status,
  lines,
  payments,
  attachments,
  errorMessage,
}: {
  supplierId: string;
  supplierName: string;
  supplierDocument: string | null;
  supplierPhone: string | null;
  supplierAddress: string | null;
  invoiceId: string;
  folio: string;
  issueLabel: string;
  notes: string | null;
  cancelled: boolean;
  totalCents: number;
  paidCents: number;
  pendingCents: number;
  status: SupplierInvoiceUiStatus;
  lines: SupplierOrderLine[];
  payments: SupplierOrderPayment[];
  attachments: SupplierOrderAttachment[];
  errorMessage: string | null;
}) {
  const badge = supplierInvoiceStatusBadge(status);
  const pagoLabel = cancelled ? "Anulada" : pendingCents <= 0 ? "Pagada" : "Crédito · pendiente";

  return (
    <div className="flex w-full min-w-0 max-w-none flex-col gap-4">
      {errorMessage ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/35 dark:text-amber-100">
          {errorMessage}
        </p>
      ) : null}

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] text-zinc-500">
            <Link href="/admin/proveedores" className="hover:text-zinc-800 dark:hover:text-zinc-200">
              Proveedores
            </Link>
            <span className="mx-1.5 text-zinc-400">/</span>
            Orden #{folio}
          </p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            Orden #{folio}
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-zinc-500">
            <span className="tabular-nums text-zinc-700 dark:text-zinc-300">{issueLabel}</span>
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <Link
              href={`/admin/proveedores/${supplierId}`}
              className="font-medium text-zinc-800 underline-offset-2 hover:underline dark:text-zinc-200"
            >
              {supplierName}
            </Link>
            {supplierDocument ? (
              <>
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                <span>
                  NIT <span className="font-medium text-zinc-800 dark:text-zinc-200">{supplierDocument}</span>
                </span>
              </>
            ) : null}
            {supplierPhone ? (
              <>
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                <span>
                  Tel. <span className="font-medium text-zinc-800 dark:text-zinc-200">{supplierPhone}</span>
                </span>
              </>
            ) : null}
            {supplierAddress ? (
              <>
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                <span>
                  Dir. <span className="font-medium text-zinc-800 dark:text-zinc-200">{supplierAddress}</span>
                </span>
              </>
            ) : null}
          </p>
          {notes ? <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-300">{notes}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SupplierAbonoForm invoiceId={invoiceId} supplierId={supplierId} pendingCents={pendingCents} />
          {!cancelled ? <SupplierCancelInvoiceButton supplierId={supplierId} invoiceId={invoiceId} /> : null}
          <Link
            href="/admin/proveedores"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
            aria-label="Volver a proveedores"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4" aria-hidden>
              <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </header>

      <div className="flex flex-col gap-6 border-t border-zinc-200/70 pt-4 dark:border-zinc-800 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,20rem)] lg:items-start lg:gap-10">
        <section className="min-w-0">
          {lines.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Esta orden todavía no tiene productos.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200/70 dark:border-zinc-800">
                    <th className={th}>Producto</th>
                    <th className={`${th} text-right`}>Ud</th>
                    <th className={`${th} text-right`}>P. unit.</th>
                    <th className={`${th} text-right`}>Subtotal</th>
                    <th className={`${th} text-right`}> </th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                      <td className="py-3 pr-4">
                        <span className="block font-medium text-zinc-900 dark:text-zinc-100">{line.name}</span>
                        {line.reference ? (
                          <span className="mt-0.5 block font-mono text-xs text-zinc-500">Ref. {line.reference}</span>
                        ) : null}
                        {line.isDefective ? (
                          <span className="mt-1 inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-800 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-800">
                            Malo
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                        {line.quantity}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                        {formatCop(line.unitPriceCents)}
                      </td>
                      <td className="py-3 pr-4 text-right text-base font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                        {formatCop(line.grossCents)}
                      </td>
                      <td className="py-3 text-right">
                        {!cancelled ? (
                          <form action={toggleSupplierLineDefectAction}>
                            <input type="hidden" name="invoice_id" value={invoiceId} />
                            <input type="hidden" name="supplier_id" value={supplierId} />
                            <input type="hidden" name="line_id" value={line.id} />
                            <input type="hidden" name="is_defective" value={line.isDefective ? "0" : "1"} />
                            <button
                              type="submit"
                              className="text-xs font-medium text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-300"
                            >
                              {line.isDefective ? "Quitar marca" : "Marcar como malo"}
                            </button>
                          </form>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!cancelled ? <SupplierOrderAddProducts invoiceId={invoiceId} supplierId={supplierId} /> : null}

          {payments.length > 0 ? (
            <div className="mt-6">
              <p className={labelClass}>Abonos</p>
              <ul className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
                {payments.map((pay) => (
                  <li key={pay.id} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                    <div>
                      <p className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                        {formatCop(pay.amountCents)}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {pay.paidAt
                          ? formatStoreDateTime(pay.paidAt, { dateStyle: "medium", timeStyle: "short" })
                          : ""}
                        {" · "}
                        {pay.methodLabel}
                        {pay.notes ? ` · ${pay.notes}` : ""}
                      </p>
                      {pay.expenseId ? (
                        <Link
                          href={`/admin/egresos/${pay.expenseId}`}
                          className="text-xs font-medium text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
                        >
                          {pay.expenseCancelled ? "Egreso anulado" : "Egreso de caja"}
                        </Link>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <aside className="space-y-5 border-t border-zinc-200/70 pt-4 dark:border-zinc-800 lg:sticky lg:top-3 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0 dark:lg:border-zinc-800">
          <div>
            <p className={labelClass}>Total</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
              <StaticCopCents cents={totalCents} />
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className={labelClass}>Pagado</p>
              <p className="mt-1 font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                <StaticCopCents cents={paidCents} />
              </p>
            </div>
            <div>
              <p className={labelClass}>Pendiente</p>
              <p className="mt-1 font-semibold tabular-nums text-orange-600 dark:text-orange-400">
                <StaticCopCents cents={pendingCents} />
              </p>
            </div>
          </div>
          <div>
            <p className={labelClass}>Estado del pago</p>
            <p className="mt-1.5">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                {badge.label}
              </span>
            </p>
            <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-300">{pagoLabel}</p>
          </div>

          <div>
            <p className={labelClass}>Comprobantes</p>
            {!cancelled && attachments.length < 5 ? (
              <form action={uploadSupplierInvoiceAttachmentAction} className="mt-2 space-y-2">
                <input type="hidden" name="invoice_id" value={invoiceId} />
                <input type="hidden" name="supplier_id" value={supplierId} />
                <input
                  name="file"
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  required
                  className="block w-full text-xs text-zinc-600 file:mr-2 file:rounded-md file:border-0 file:bg-zinc-100 file:px-2 file:py-1.5 file:text-xs file:font-medium dark:text-zinc-300 dark:file:bg-zinc-800"
                />
                <button type="submit" className="text-xs font-medium text-zinc-800 underline dark:text-zinc-200">
                  Subir archivo
                </button>
              </form>
            ) : null}
            {attachments.length === 0 ? (
              <p className="mt-1.5 text-sm text-zinc-500">Sin comprobantes.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {attachments.map((file) => {
                  const url = storagePublicObjectUrl(file.storagePath);
                  const isPdf = file.fileName.toLowerCase().endsWith(".pdf") || file.storagePath.toLowerCase().endsWith(".pdf");
                  return (
                    <li key={file.id} className="text-sm">
                      {url && !isPdf ? (
                        <div className="relative mb-1 aspect-[4/3] overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
                          <Image
                            src={url}
                            alt=""
                            fill
                            className="object-contain"
                            sizes="320px"
                            unoptimized={shouldUnoptimizeStorageImageUrl(url)}
                          />
                        </div>
                      ) : null}
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="font-medium underline-offset-2 hover:underline">
                          {file.fileName || (isPdf ? "PDF" : "Archivo")}
                        </a>
                      ) : (
                        <span>{file.fileName || "Archivo"}</span>
                      )}
                      <form action={deleteSupplierInvoiceAttachmentAction} className="inline">
                        <input type="hidden" name="attachment_id" value={file.id} />
                        <input type="hidden" name="invoice_id" value={invoiceId} />
                        <input type="hidden" name="supplier_id" value={supplierId} />
                        <input type="hidden" name="storage_path" value={file.storagePath} />
                        <button type="submit" className="ml-2 text-xs text-red-600 hover:underline">
                          Quitar
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
