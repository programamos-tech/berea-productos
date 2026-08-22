import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Alta ahora es modal sobre el listado. */
export default function AdminNuevoEgresoPage() {
  redirect("/admin/egresos?nuevo=1");
}
