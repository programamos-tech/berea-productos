import { requireAdminPermission } from "@/lib/require-admin-permission";
import type { ReactNode } from "react";

export default async function SucursalesLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminPermission("sucursales_ver");
  return children;
}
