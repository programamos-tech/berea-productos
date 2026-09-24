import { AdminAuthShell } from "@/components/admin/AdminAuthShell";
import { AdminLoginForm } from "@/components/admin/LoginForm";

export default function AdminLoginPage() {
  return (
    <AdminAuthShell>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        Iniciar sesión
      </h1>
      <div className="mt-8">
        <AdminLoginForm />
      </div>
    </AdminAuthShell>
  );
}
