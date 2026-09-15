import type { ReactNode } from "react";
import { signOutAdmin } from "@/app/actions/admin/auth";
import { AdminAuthShell } from "@/components/admin/AdminAuthShell";

export default function AdminCuentasLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AdminAuthShell
      layout="canvas"
      contentWidthClassName="max-w-6xl"
      headerActions={
        <form action={signOutAdmin}>
          <button
            type="submit"
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
          >
            Cerrar sesión
          </button>
        </form>
      }
    >
      {children}
    </AdminAuthShell>
  );
}
