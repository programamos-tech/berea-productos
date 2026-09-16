import { requireAdminSession } from "@/lib/require-admin-permission";
import type { ReactNode } from "react";

export default async function ConfiguracionLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminSession();
  return children;
}
