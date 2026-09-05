import { redirect } from "next/navigation";
import type { ReactNode } from "react";

/** Módulo oculto temporalmente: no accesible por URL ni sidebar. */
export default async function ProveedoresLayout({
  children: _children,
}: {
  children: ReactNode;
}) {
  redirect("/admin");
}
