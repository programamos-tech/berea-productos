import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

/** Stock se actualiza desde el modal en Productos (solo punto). */
export default async function AdminProductStockPage({ params }: Props) {
  const { id } = await params;
  redirect(`/admin/products/${id}`);
}
