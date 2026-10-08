import { redirect } from "next/navigation";
import { requireAccountModule } from "@/lib/require-admin-permission";

export default async function AdminTransferStockPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAccountModule("traslados");
  const { id } = await params;
  redirect(`/admin/traslados/nuevo?product=${id}`);
}
