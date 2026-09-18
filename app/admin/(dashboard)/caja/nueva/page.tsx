import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Alta ahora es modal sobre el listado, como gastos. */
export default function AdminNuevaCajaPage() {
  redirect("/admin/caja?nuevo=1");
}
