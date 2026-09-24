import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { OperatorBackofficeShell } from "@/components/admin/OperatorBackofficeShell";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";

export default async function AdminCuentasLayout({
  children,
}: {
  children: ReactNode;
}) {
  const perm = await loadAdminPermissions();
  if (!perm) redirect("/admin/login");
  if (!perm.isPlatformOperator) redirect("/admin");

  return (
    <OperatorBackofficeShell
      displayName={perm.displayName}
      email={perm.email}
    >
      {children}
    </OperatorBackofficeShell>
  );
}
