import Image from "next/image";
import { AdminThemeToggle } from "@/components/admin/AdminThemeToggle";
import { AdminLoginForm } from "@/components/admin/LoginForm";
import { ADMIN_BRAND_LOGO_ON_SIDEBAR_CLASS } from "@/lib/admin-theme";
import { adminProductBrand, adminSidebarLogoPath } from "@/lib/brand";

export default function AdminLoginPage() {
  return (
    <div className="relative min-h-screen bg-white text-[var(--admin-coral-deep)] antialiased dark:bg-zinc-950 dark:text-zinc-100">
      <div className="pointer-events-none absolute right-3 top-3 z-20 sm:right-5 sm:top-5">
        <div className="pointer-events-auto rounded-lg border border-[color-mix(in_srgb,var(--admin-coral)_30%,transparent)] bg-white/90 shadow-sm backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/90">
          <AdminThemeToggle className="rounded-lg" />
        </div>
      </div>
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="relative flex min-h-0 flex-1 flex-col border-b border-[color-mix(in_srgb,var(--admin-coral-deep)_14%,transparent)] bg-[var(--admin-sidebar-bg)] lg:min-h-screen lg:w-[44%] lg:max-w-xl lg:flex-none lg:border-b-0 lg:border-r lg:border-r-[color-mix(in_srgb,var(--admin-coral-deep)_14%,transparent)]">
          <div className="relative flex flex-1 flex-col justify-center px-8 py-12 sm:px-12 lg:py-20 lg:pl-14 lg:pr-10 xl:pl-20">
            <div className="mx-auto w-full max-w-sm lg:mx-0">
              <Image
                src={adminSidebarLogoPath}
                alt={adminProductBrand}
                width={1200}
                height={662}
                className={`h-auto w-full max-w-[12rem] object-contain object-left sm:max-w-[14rem] lg:max-w-[16rem] ${ADMIN_BRAND_LOGO_ON_SIDEBAR_CLASS}`}
                priority
              />
              <p className="mt-10 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--admin-coral-deep)]/55">
                Backoffice
              </p>
              <p className="mt-4 max-w-[20rem] text-[15px] font-medium leading-relaxed text-[var(--admin-coral-deep)]/85">
                Gestioná inventario, ventas y clientes desde un solo lugar.
              </p>
            </div>
          </div>
        </aside>

        <main className="relative flex flex-1 flex-col justify-center bg-white px-6 py-12 sm:px-10 lg:px-16 xl:px-24 dark:bg-zinc-950">
          <div className="relative mx-auto w-full max-w-[420px]">
            <div className="rounded-xl border border-[color-mix(in_srgb,var(--admin-coral)_28%,transparent)] bg-white px-8 py-10 shadow-[0_24px_64px_-32px_color-mix(in_srgb,var(--admin-coral-deep)_28%,transparent)] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_24px_64px_-32px_rgba(0,0,0,0.45)] sm:px-10 sm:py-12">
              <h1 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--admin-coral)]">
                Iniciar sesión
              </h1>
              <p className="mt-4 text-[15px] font-medium leading-relaxed text-[var(--admin-coral-deep)]/70 dark:text-zinc-400">
                Entra con tu cuenta para continuar al panel.
              </p>

              <div className="mt-10">
                <AdminLoginForm />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
