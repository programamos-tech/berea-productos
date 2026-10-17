import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ModuleCreditPreview } from "@/components/admin/ModuleCreditPreview";
import { SupplierOrderInvoiceView } from "@/components/admin/SupplierOrderInvoiceView";
import { MOCK_CREDITS } from "@/components/admin/AccountModulePreview";
import {
  accountModuleById,
  isAccountModuleEnabled,
  isAccountModuleId,
  modulePreviewHref,
} from "@/lib/admin-account-modules";
import { ADMIN_FORBIDDEN_REDIRECT, requireAdminSession } from "@/lib/require-admin-permission";

export const dynamic = "force-dynamic";

const ORDERS = {
  "0": {
    supplierName: "Milagros",
    supplierDocument: "900.111.222",
    supplierPhone: "300 111 2233",
    supplierAddress: "Guacarí",
    folio: "FV-20261017-78B65EA1",
    issueLabel: "17/10/2026",
    totalCents: 8939280,
    receiptStatus: "receiving",
    lines: [
      {
        id: "l1",
        productId: null,
        name: "Cable USB-C 2 m",
        reference: "BT-AC-001",
        quantity: 8,
        receivedQuantity: 0,
        unitPriceCents: 49000,
        grossCents: 466480,
        isDefective: false,
      },
      {
        id: "l2",
        productId: null,
        name: "Migración a Microsoft 365",
        reference: "BT-SO-004",
        quantity: 8,
        receivedQuantity: 0,
        unitPriceCents: 890000,
        grossCents: 8472800,
        isDefective: false,
      },
    ],
    payments: [
      {
        id: "p1",
        amountCents: 100000,
        methodLabel: "Efectivo",
        paidAt: "2026-10-17T16:16:00.000Z",
        notes: null,
        isCancelled: false,
        cancellationReason: null,
      },
      {
        id: "p2",
        amountCents: 50000,
        methodLabel: "Transferencia",
        paidAt: "2026-10-17T16:16:00.000Z",
        notes: null,
        isCancelled: false,
        cancellationReason: null,
      },
    ],
  },
  "1": {
    supplierName: "Insumos del Valle",
    supplierDocument: "800.333.444",
    supplierPhone: "310 444 5566",
    supplierAddress: "Cali",
    folio: "OC-218",
    issueLabel: "12/10/2026",
    totalCents: 1200000,
    receiptStatus: "sent",
    lines: [
      {
        id: "l3",
        productId: null,
        name: "Cajas de empaque",
        reference: "EMP-12",
        quantity: 40,
        receivedQuantity: 0,
        unitPriceCents: 30000,
        grossCents: 1200000,
        isDefective: false,
      },
    ],
    payments: [],
  },
  "2": {
    supplierName: "Empaques Norte",
    supplierDocument: "901.555.666",
    supplierPhone: "320 777 8899",
    supplierAddress: "Bogotá",
    folio: "OC-211",
    issueLabel: "02/10/2026",
    totalCents: 640000,
    receiptStatus: "received",
    lines: [
      {
        id: "l4",
        productId: null,
        name: "Bolsas",
        reference: "BOL-1",
        quantity: 80,
        receivedQuantity: 80,
        unitPriceCents: 8000,
        grossCents: 640000,
        isDefective: false,
      },
    ],
    payments: [
      {
        id: "p3",
        amountCents: 640000,
        methodLabel: "Transferencia",
        paidAt: "2026-10-04T15:00:00.000Z",
        notes: null,
        isCancelled: false,
        cancellationReason: null,
      },
    ],
  },
} as const;

type Props = {
  params: Promise<{ moduleId: string; itemId: string }>;
};

export default async function AccountModulePreviewDetailPage({ params }: Props) {
  const { moduleId, itemId } = await params;
  if (!isAccountModuleId(moduleId)) notFound();
  const mod = accountModuleById(moduleId);
  if (!mod || mod.listed === false) notFound();

  const perm = await requireAdminSession();
  if (isAccountModuleEnabled(perm.disabledModules, moduleId)) {
    const canOpen = mod.permissionKeys.some((key) => perm.permissions[key]);
    if (canOpen && mod.href) redirect(mod.href);
    redirect(ADMIN_FORBIDDEN_REDIRECT);
  }

  if (moduleId === "creditos") {
    const row = MOCK_CREDITS.find((item) => item.id === itemId);
    if (!row) notFound();
    return <ModuleCreditPreview row={row} />;
  }

  if (moduleId === "proveedores") {
    const order = ORDERS[itemId as keyof typeof ORDERS];
    if (!order) notFound();
    return (
      <SupplierOrderInvoiceView
        preview
        supplierId={itemId}
        supplierName={order.supplierName}
        supplierDocument={order.supplierDocument}
        supplierPhone={order.supplierPhone}
        supplierAddress={order.supplierAddress}
        invoiceId={itemId}
        folio={order.folio}
        issueLabel={order.issueLabel}
        notes={null}
        cancelled={false}
        totalCents={order.totalCents}
        paidCents={0}
        pendingCents={0}
        status="pending"
        receiptStatus={order.receiptStatus}
        lines={[...order.lines]}
        payments={[...order.payments]}
        attachments={[]}
        errorMessage={null}
      />
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <p className="text-[11px] text-zinc-500">
        <Link href={modulePreviewHref(moduleId)} className="hover:text-zinc-800 dark:hover:text-zinc-200">
          {mod.label}
        </Link>
        <span className="mx-1.5 text-zinc-400">/</span>
        Detalle
      </p>
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {mod.label}
      </h1>
      <p className="text-sm text-zinc-500">{mod.pitch}</p>
      <Link
        href={modulePreviewHref(moduleId)}
        className="text-sm font-medium text-zinc-800 underline-offset-2 hover:underline dark:text-zinc-200"
      >
        Volver
      </Link>
    </div>
  );
}
