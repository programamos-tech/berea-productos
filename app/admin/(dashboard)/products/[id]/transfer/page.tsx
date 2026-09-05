import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

/** Traslados ocultos: redirige al detalle del producto. */
export default async function AdminTransferStockPage({ params }: Props) {
  const { id } = await params;
  redirect(`/admin/products/${id}`);
}
