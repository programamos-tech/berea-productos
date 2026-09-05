import Image from "next/image";
import Link from "next/link";
import { AdminThemeToggle } from "@/components/admin/AdminThemeToggle";
import { AdminLoginForm } from "@/components/admin/LoginForm";
import {
  ADMIN_BEREA_MARK_IMG_CLASS,
  ADMIN_BEREA_SIGNATURE_ON_SIDEBAR_CLASS,
  ADMIN_BRAND_LOGO_ON_SIDEBAR_CLASS,
} from "@/lib/admin-theme";
import {
  adminSidebarLogoPath,
  bereaSignaturePath,
  storeBrand,
} from "@/lib/brand";

const serif = "[font-family:ui-serif,Georgia,Cambria,'Times_New_Roman',serif]";

export default function AdminLoginPage() {
  return (
    <div className="relative min-h-screen bg-white text-stone-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
      <div className="pointer-events-none absolute right-3 top-3 z-20 sm:right-5 sm:top-5">
        <div className="pointer-events-auto rounded-lg border border-[color-mix(in_srgb,var(--admin-coral)_30%,transparent)] bg-white/90 shadow-sm backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/90">
          <AdminThemeToggle className="rounded-lg" />
        </div>
      </div>
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Marca — mismo fondo coral mist que el sidebar del panel */}
        <aside className="relative flex min-h-0 flex-1 flex-col border-b border-[color-mix(in_srgb,var(--admin-coral-deep)_14%,transparent)] bg-[var(--admin-sidebar-bg)] lg:min-h-screen lg:w-[44%] lg:max-w-xl lg:flex-none lg:border-b-0 lg:border-r lg:border-r-[color-mix(in_srgb,var(--admin-coral-deep)_14%,transparent)]">
          <div className="relative flex flex-1 flex-col justify-center px-8 py-12 sm:px-12 lg:py-20 lg:pl-14 lg:pr-10 xl:pl-20">
            <div className="mx-auto w-full max-w-sm lg:mx-0">
              <Link
                href="/"
                className="inline-block outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-coral)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--admin-sidebar-bg)]"
              >
                <Image
                  src={adminSidebarLogoPath}
                  alt={storeBrand}
                  width={728}
                  height={343}
                  className={`h-auto w-full max-w-[11rem] object-contain object-left sm:max-w-[13rem] lg:max-w-[15.5rem] ${ADMIN_BRAND_LOGO_ON_SIDEBAR_CLASS}`}
                  priority
                />
              </Link>
              <p className="mt-10 text-[10px] font-semibold uppercase tracking-[0.38em] text-[var(--admin-coral-deep)]/55">
                Backoffice
              </p>
              <p
                className={`mt-4 max-w-[19rem] text-[17px] leading-[1.55] text-[var(--admin-coral-deep)]/90 ${serif}`}
              >
                Gestioná inventario, ventas y clientes desde un solo lugar.
              </p>
              <div className="mt-10 flex items-center gap-3" aria-hidden>
                <span className="h-px w-12 bg-[var(--admin-coral-soft)]" />
                <span className="text-[9px] font-semibold uppercase tracking-[0.32em] text-[var(--admin-coral-deep)]/55">
                  Milagros Guacarí
                </span>
              </div>
            </div>
          </div>
          <div className="relative shrink-0 border-t border-[color-mix(in_srgb,var(--admin-coral-deep)_14%,transparent)] px-8 py-6 sm:px-12 lg:px-14 xl:px-20">
            <div className="mx-auto flex max-w-sm flex-col items-center gap-1.5 text-center lg:mx-0 lg:items-start lg:text-left">
              <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-[var(--admin-coral-deep)]/55">
                Experiencia por
              </span>
              <div className="flex justify-center lg:justify-start">
                <Image
                  src={bereaSignaturePath}
                  alt="Berea — diseño y desarrollo de software a la medida"
                  width={320}
                  height={82}
                  className={`${ADMIN_BEREA_MARK_IMG_CLASS} lg:object-left ${ADMIN_BEREA_SIGNATURE_ON_SIDEBAR_CLASS}`}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Formulario */}
        <main className="relative flex flex-1 flex-col justify-center bg-white px-6 py-12 sm:px-10 lg:px-16 xl:px-24 dark:bg-zinc-950">
          <div className="relative mx-auto w-full max-w-[420px]">
            <div className="border border-[color-mix(in_srgb,var(--admin-coral)_28%,transparent)] bg-white px-8 py-10 shadow-[0_24px_64px_-32px_color-mix(in_srgb,var(--admin-coral-deep)_28%,transparent)] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_24px_64px_-32px_rgba(0,0,0,0.45)] sm:px-10 sm:py-12">
              <h1 className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--admin-coral-deep)] dark:text-zinc-100">
                Iniciar sesión
              </h1>
              <p
                className={`mt-5 text-[15px] leading-relaxed text-stone-600 dark:text-zinc-400 ${serif}`}
              >
                Entra con tu cuenta para continuar al panel.
              </p>

              <div className="mt-10">
                <AdminLoginForm />
              </div>

              <p className="mt-10 text-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--admin-coral-deep)]/55 transition-colors hover:text-[var(--admin-coral-deep)] dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  <span aria-hidden className="text-lg leading-none">
                    ←
                  </span>
                  Volver a la tienda
                </Link>
              </p>
            </div>

            <p className="mt-8 text-center text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500 dark:text-zinc-500">
              Solo personal autorizado
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
