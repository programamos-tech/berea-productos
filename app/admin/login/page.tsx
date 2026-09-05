import Image from "next/image";
import { AdminThemeToggle } from "@/components/admin/AdminThemeToggle";
import { AdminLoginForm } from "@/components/admin/LoginForm";
import { ADMIN_BRAND_LOGO_ON_SIDEBAR_CLASS } from "@/lib/admin-theme";
import { adminPanelClass } from "@/lib/admin-ui";
import { adminProductBrand, adminSidebarLogoPath } from "@/lib/brand";

export default function AdminLoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-100 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
      {/* Atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_0%,color-mix(in_srgb,var(--admin-coral)_18%,transparent),transparent_55%),radial-gradient(ellipse_70%_50%_at_100%_100%,rgba(24,24,27,0.06),transparent_50%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_0%_0%,color-mix(in_srgb,var(--admin-coral)_22%,transparent),transparent_55%),radial-gradient(ellipse_70%_50%_at_100%_0%,rgba(255,255,255,0.04),transparent_45%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,rgba(24,24,27,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(24,24,27,0.04)_1px,transparent_1px)] [background-size:48px_48px] dark:opacity-[0.2] dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]"
      />

      <div className="pointer-events-none absolute right-3 top-3 z-20 sm:right-5 sm:top-5">
        <div className="pointer-events-auto rounded-lg border border-zinc-200/80 bg-white/90 shadow-sm backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/90">
          <AdminThemeToggle className="rounded-lg" />
        </div>
      </div>

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        <aside className="relative flex min-h-0 flex-1 flex-col overflow-hidden border-b border-zinc-200/80 bg-zinc-900 text-zinc-100 lg:min-h-screen lg:w-[42%] lg:max-w-xl lg:flex-none lg:border-b-0 lg:border-r lg:border-r-zinc-800">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 top-1/4 size-[28rem] rounded-full bg-[var(--admin-coral)]/25 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 right-0 size-[22rem] rounded-full bg-zinc-600/40 blur-3xl"
          />
          <div className="relative flex flex-1 flex-col justify-center px-8 py-12 sm:px-12 lg:py-20 lg:pl-14 lg:pr-10 xl:pl-20">
            <div className="mx-auto w-full max-w-sm lg:mx-0">
              <Image
                src={adminSidebarLogoPath}
                alt={adminProductBrand}
                width={1200}
                height={662}
                className={`h-auto w-full max-w-[11rem] object-contain object-left brightness-0 invert sm:max-w-[13rem] ${ADMIN_BRAND_LOGO_ON_SIDEBAR_CLASS}`}
                priority
              />
              <p className="mt-4 whitespace-nowrap text-[10px] font-medium tracking-wide text-zinc-400 sm:text-[11px]">
                Gestiona tu tienda de productos
              </p>
            </div>
          </div>
        </aside>

        <main className="relative flex flex-1 flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-24">
          <div className="relative mx-auto w-full max-w-[420px]">
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
          </div>
        </main>
      </div>
    </div>
  );
}
