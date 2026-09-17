import { AdminOrderInvoiceScreen } from "@/components/admin/AdminOrderInvoiceScreen";
import { safeAdminVentasListReturnPath } from "@/lib/admin-ventas-list-url";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminOrderDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  return (
    <AdminOrderInvoiceScreen
      orderId={id}
      searchParams={sp}
      listHref={safeAdminVentasListReturnPath(sp.returnTo)}
      listLabel="Ventas"
      creditVariant="summary"
    />
  );
}
