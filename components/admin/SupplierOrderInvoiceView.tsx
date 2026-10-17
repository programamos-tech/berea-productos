import Image from "next/image";
import Link from "next/link";
import {
  deleteSupplierInvoiceAttachmentAction,
  receiveSupplierOrderStockAction,
  toggleSupplierLineDefectAction,
  uploadSupplierInvoiceAttachmentAction,
} from "@/app/actions/admin/suppliers";
import { SupplierOrderAbonosPanel } from "@/components/admin/SupplierOrderAbonosPanel";
import { SupplierCancelInvoiceButton } from "@/components/admin/SupplierCancelInvoiceButton";
import { SupplierOrderAddProducts } from "@/components/admin/SupplierOrderAddProducts";
import { SupplierOrderReceiptSelect } from "@/components/admin/SupplierOrderReceiptSelect";
import { StaticCopCents } from "@/components/admin/ReportsAnimatedFigures";
import { formatCop } from "@/lib/money";
import { ventaCreditoToneClass } from "@/lib/ventas-sales";
import {
  isSupplierReceiptStatus,
  type SupplierInvoiceUiStatus,
  type SupplierReceiptStatus,
} from "@/lib/supplier-invoices";
import { shouldUnoptimizeStorageImageUrl, storagePublicObjectUrl } from "@/lib/storage-public-url";

const th =
  "pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";
const labelClass = "text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";
const metaIconClass = "size-4 shrink-0 text-zinc-400 dark:text-zinc-500";
const metaTextClass = "text-zinc-700 dark:text-zinc-300";
const metaSepClass = "text-zinc-300 dark:text-zinc-600";

function IconClock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.65} strokeLinecap="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6l3.5 2" />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.65} strokeLinecap="round" className={className} aria-hidden>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconBuilding({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.65} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12h12" />
      <path d="M6 16h12" />
      <path d="M10 6h4" />
      <path d="M10 22v-4h4v4" />
    </svg>
  );
}

export type SupplierOrderLine = {
  id: string;
  productId: string | null;
  name: string;
  reference: string | null;
  quantity: number;
  receivedQuantity: number;
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
  isCancelled: boolean;
  cancellationReason: string | null;
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
  receiptStatus,
  lines,
  payments,
  attachments,
  errorMessage,
  preview = false,
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
  receiptStatus: string;
  lines: SupplierOrderLine[];
  payments: SupplierOrderPayment[];
  attachments: SupplierOrderAttachment[];
  errorMessage: string | null;
  /** Misma pantalla, sin guardar cambios. */
  preview?: boolean;
}) {
  const listHref = preview ? "/admin/modulos/proveedores" : "/admin/proveedores";
  const receipt: SupplierReceiptStatus = isSupplierReceiptStatus(receiptStatus)
    ? receiptStatus
    : "sent";
  const canEnterQty =
    !cancelled && (receipt === "receiving" || receipt === "received");
  const hasPendingQty = lines.some((line) => line.receivedQuantity < line.quantity);
  const receiveFormId = `receive-${invoiceId}`;

  return (
    <div className="flex w-full min-w-0 max-w-none flex-col gap-4">
      {errorMessage ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/35 dark:text-amber-100">
          {errorMessage}
        </p>
      ) : null}

      <header className="flex flex-wrap items-center justify-between gap-2 gap-y-2">
        <div className="min-w-0">
          <p className="text-[11px] text-zinc-500">
            <Link href={listHref} className="hover:text-zinc-800 dark:hover:text-zinc-200">
              Proveedores
            </Link>
            <span className="mx-1.5 text-zinc-400">/</span>
            Orden de compra #{folio}
          </p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            Orden de compra #{folio}
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <IconClock className={metaIconClass} />
              <span className={`tabular-nums ${metaTextClass}`}>{issueLabel}</span>
            </span>
            <span className={metaSepClass} aria-hidden>
              ·
            </span>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <IconUser className={metaIconClass} />
              {preview ? (
                <span className="min-w-0 truncate font-medium text-zinc-800 dark:text-zinc-200">
                  {supplierName}
                </span>
              ) : (
                <Link
                  href={`/admin/proveedores/${supplierId}`}
                  className="min-w-0 truncate font-medium text-zinc-800 underline-offset-2 transition hover:text-zinc-950 hover:underline dark:text-zinc-200 dark:hover:text-white"
                >
                  {supplierName}
                </Link>
              )}
            </span>
            {supplierAddress ? (
              <>
                <span className={metaSepClass} aria-hidden>
                  ·
                </span>
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <IconBuilding className={metaIconClass} />
                  <span className={`min-w-0 truncate ${metaTextClass}`}>{supplierAddress}</span>
                </span>
              </>
            ) : null}
            {supplierDocument ? (
              <>
                <span className={metaSepClass} aria-hidden>
                  ·
                </span>
                <span>
                  NIT{" "}
                  <span className="font-medium tabular-nums text-zinc-800 dark:text-zinc-200">
                    {supplierDocument}
                  </span>
                </span>
              </>
            ) : null}
            {supplierPhone ? (
              <>
                <span className={metaSepClass} aria-hidden>
                  ·
                </span>
                <span>
                  Tel.{" "}
                  <span className="font-medium tabular-nums text-zinc-800 dark:text-zinc-200">
                    {supplierPhone}
                  </span>
                </span>
              </>
            ) : null}
          </p>
          {notes ? <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-300">{notes}</p> : null}
        </div>
        <Link
          href={listHref}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          title="Volver"
          aria-label="Volver a proveedores"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4" aria-hidden>
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </header>

      <div className="flex flex-col gap-6 border-t border-zinc-200/70 pt-4 dark:border-zinc-800 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,20rem)] lg:items-start lg:gap-10 xl:gap-12">
        <section className="reports-chart-reveal min-w-0">
          {!preview && canEnterQty && hasPendingQty ? (
            <form id={receiveFormId} action={receiveSupplierOrderStockAction} className="hidden">
              <input type="hidden" name="invoice_id" value={invoiceId} />
              <input type="hidden" name="supplier_id" value={supplierId} />
            </form>
          ) : null}
          {lines.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Esta orden todavía no tiene productos.</p>
          ) : (
            <>
              <div className="max-h-[min(56dvh,32rem)] overflow-x-auto overflow-y-auto lg:max-h-[calc(100dvh-13rem)]">
                <table className="w-full min-w-[40rem] table-fixed text-left text-sm leading-relaxed sm:text-[15px]">
                  <colgroup>
                    <col className="w-auto" />
                    <col className="w-14" />
                    {canEnterQty && hasPendingQty ? <col className="w-[6.5rem]" /> : null}
                    <col className="w-[7.5rem]" />
                    <col className="w-[9.5rem]" />
                  </colgroup>
                  <thead className="sticky top-0 z-[1] bg-white dark:bg-zinc-950">
                    <tr className="border-b border-zinc-200/70 dark:border-zinc-800">
                      <th className={th}>Producto</th>
                      <th className={`${th} text-right`}>Ud</th>
                      {canEnterQty && hasPendingQty ? (
                        <th className={`${th} text-right`}>A ingresar</th>
                      ) : null}
                      <th className={`${th} text-right`}>P. unit.</th>
                      <th className={`${th} !pr-6 text-right sm:!pr-8`}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => {
                      const ref = line.reference?.trim();
                      const remaining = Math.max(0, line.quantity - line.receivedQuantity);
                      const suggested =
                        line.isDefective && line.receivedQuantity === 0 ? 0 : remaining;
                      return (
                        <tr
                          key={line.id}
                          className="border-b border-zinc-100/80 last:border-0 dark:border-zinc-800/80"
                        >
                          <td className="py-3 pr-5 align-middle text-zinc-800 dark:text-zinc-200">
                            <span className="block font-medium leading-snug">{line.name}</span>
                            {ref ? (
                              <span className="mt-1 block font-mono text-xs text-zinc-500">Ref. {ref}</span>
                            ) : null}
                            {line.isDefective ? (
                              <span className="mt-1 inline-flex text-xs font-semibold text-red-600 dark:text-red-400">
                                Malo
                              </span>
                            ) : null}
                            {!preview && !cancelled ? (
                              <form action={toggleSupplierLineDefectAction} className="mt-1">
                                <input type="hidden" name="invoice_id" value={invoiceId} />
                                <input type="hidden" name="supplier_id" value={supplierId} />
                                <input type="hidden" name="line_id" value={line.id} />
                                <input type="hidden" name="is_defective" value={line.isDefective ? "0" : "1"} />
                                <button
                                  type="submit"
                                  className="text-xs font-medium text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
                                >
                                  {line.isDefective ? "Quitar marca" : "Marcar como malo"}
                                </button>
                              </form>
                            ) : null}
                          </td>
                          <td className="py-3 pr-4 text-right align-middle tabular-nums text-zinc-700 dark:text-zinc-300">
                            {line.quantity}
                            {line.receivedQuantity > 0 ? (
                              <span className="mt-1 block text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                                {line.receivedQuantity} ingresadas
                              </span>
                            ) : null}
                          </td>
                          {canEnterQty && hasPendingQty ? (
                            <td className="py-3 pr-4 text-right align-middle">
                              {remaining > 0 ? (
                                <input
                                  form={preview ? undefined : receiveFormId}
                                  name={`receive_${line.id}`}
                                  type="number"
                                  min={0}
                                  max={remaining}
                                  defaultValue={suggested}
                                  readOnly={preview}
                                  disabled={preview}
                                  aria-label={`Cantidad a ingresar de ${line.name}`}
                                  className="ml-auto block w-16 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-right text-sm font-medium tabular-nums text-zinc-800 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                                />
                              ) : (
                                <span className="text-sm text-zinc-400">—</span>
                              )}
                            </td>
                          ) : null}
                          <td className="whitespace-nowrap py-3 pr-4 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                            {formatCop(line.unitPriceCents)}
                          </td>
                          <td className="whitespace-nowrap py-3 pl-3 pr-6 text-right tabular-nums text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:pr-8">
                            {formatCop(line.grossCents)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {!preview && !cancelled ? <SupplierOrderAddProducts invoiceId={invoiceId} supplierId={supplierId} /> : null}
        </section>

        <aside className="reports-chart-reveal shrink-0 space-y-5 border-t border-zinc-200/70 pt-4 dark:border-zinc-800 lg:sticky lg:top-3 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0 xl:pl-10 dark:lg:border-zinc-800">
          <div>
            <p className={labelClass}>Total</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
              <StaticCopCents cents={totalCents} />
            </p>
          </div>

          <div>
            <p className={labelClass}>Método de pago</p>
            <p className={`mt-1.5 text-sm ${ventaCreditoToneClass}`}>Crédito</p>
          </div>

          <div>
            <p className={labelClass}>Estado de recepción</p>
            <div className="mt-1.5">
              <SupplierOrderReceiptSelect
                invoiceId={invoiceId}
                supplierId={supplierId}
                currentStatus={receipt}
                disabled={cancelled || preview}
              />
            </div>
            {canEnterQty && hasPendingQty ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs leading-relaxed text-zinc-500">
                  Ajustá la columna A ingresar y sumalas al inventario de esta sucursal.
                </p>
                <button
                  type={preview ? "button" : "submit"}
                  form={preview ? undefined : receiveFormId}
                  disabled={preview}
                  className="inline-flex w-full items-center justify-center rounded-lg border border-[var(--admin-coral)] bg-[var(--admin-coral)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:border-[var(--admin-coral-hover)] hover:bg-[var(--admin-coral-hover)] disabled:cursor-default disabled:opacity-80"
                >
                  Ingresar al inventario
                </button>
              </div>
            ) : null}
          </div>

          {!preview && !cancelled ? (
            <SupplierCancelInvoiceButton supplierId={supplierId} invoiceId={invoiceId} />
          ) : null}

          <div>
            <p className={labelClass}>Comprobantes</p>
            {attachments.length === 0 ? (
              <p className="mt-1.5 text-sm text-zinc-500">Sin comprobantes.</p>
            ) : (
              <ul className="mt-1.5 space-y-1">
                {attachments.map((file, idx) => {
                  const url = storagePublicObjectUrl(file.storagePath);
                  const label = file.fileName.trim() || `Archivo ${idx + 1}`;
                  const isPdf =
                    file.fileName.toLowerCase().endsWith(".pdf") ||
                    file.storagePath.toLowerCase().endsWith(".pdf");
                  return (
                    <li key={file.id} className="flex items-center gap-2">
                      {url && !isPdf ? (
                        <span className="relative size-8 shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-900">
                          <Image
                            src={url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="32px"
                            unoptimized={shouldUnoptimizeStorageImageUrl(url)}
                          />
                        </span>
                      ) : null}
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-w-0 flex-1 truncate text-xs font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-400"
                        >
                          {label}
                        </a>
                      ) : (
                        <span className="min-w-0 flex-1 truncate text-xs text-zinc-600">{label}</span>
                      )}
                      {!preview ? (
                      <form action={deleteSupplierInvoiceAttachmentAction}>
                        <input type="hidden" name="attachment_id" value={file.id} />
                        <input type="hidden" name="invoice_id" value={invoiceId} />
                        <input type="hidden" name="supplier_id" value={supplierId} />
                        <input type="hidden" name="storage_path" value={file.storagePath} />
                        <button type="submit" className="text-[11px] text-red-600 hover:underline">
                          Quitar
                        </button>
                      </form>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
            {!preview && !cancelled && attachments.length < 5 ? (
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
                <button type="submit" className="text-xs font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-400">
                  Subir archivo
                </button>
              </form>
            ) : null}
          </div>
        </aside>
      </div>

      <SupplierOrderAbonosPanel
        invoiceId={invoiceId}
        supplierId={supplierId}
        totalCents={totalCents}
          cancelled={cancelled}
          payments={payments}
          readOnly={preview}
        />
    </div>
  );
}
