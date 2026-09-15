import { AdminAuthShell } from "@/components/admin/AdminAuthShell";
import { AdminLoginForm } from "@/components/admin/LoginForm";
import { adminPanelClass } from "@/lib/admin-ui";

export default function AdminLoginPage() {
  return (
    <AdminAuthShell>
      <div className={`${adminPanelClass} px-8 py-10 sm:px-10 sm:py-12`}>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Iniciar sesión
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Entra con tu cuenta para continuar al panel.
        </p>

        <div className="mt-8">
          <AdminLoginForm />
        </div>
      </div>
    </AdminAuthShell>
  );
}
