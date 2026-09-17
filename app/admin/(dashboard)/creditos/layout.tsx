import { requireAdminPermission } from "@/lib/require-admin-permission";
import type { ReactNode } from "react";

export default async function CreditosLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminPermission("creditos_ver");
  return children;
}
