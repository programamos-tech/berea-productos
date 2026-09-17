import { AdminOrderInvoiceScreen } from "@/components/admin/AdminOrderInvoiceScreen";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminCreditoDetailPage({
  params,
  searchParams,
}: Props) {
  const { orderId } = await params;
  const sp = await searchParams;
  const perm = await loadAdminPermissions();
  return (
    <AdminOrderInvoiceScreen
      orderId={orderId}
      searchParams={sp}
      listHref="/admin/creditos"
      listLabel="Créditos"
      requireCredit
      creditVariant="full"
      canRegisterCredit={Boolean(perm?.permissions.creditos_abonar)}
    />
  );
}
