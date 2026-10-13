import Image from "next/image";
import type { ReactNode } from "react";
import { AdminThemeToggle } from "@/components/admin/AdminThemeToggle";
import { LoginPhrases } from "@/components/admin/LoginPhrases";
import { adminProductBrand, adminSidebarLogoPath } from "@/lib/brand";

/** Chrome de autenticación (login en split) y picker de cuentas (canvas). */
export function AdminAuthShell({
  children,
  contentWidthClassName = "max-w-[420px]",
  layout = "split",
  headerActions,
}: {
  children: ReactNode;
  contentWidthClassName?: string;
  /** `split`: login (panel oscuro). `canvas`: cuentas (logo sobre blanco / dark). */
  layout?: "split" | "canvas";
  headerActions?: ReactNode;
}) {
  if (layout === "canvas") {
    return (
      <div className="relative min-h-dvh bg-white text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div
            className={`mx-auto flex w-full items-center justify-between gap-4 px-6 py-4 sm:px-8 ${contentWidthClassName}`}
          >
            <Image
              src={adminSidebarLogoPath}
              alt={adminProductBrand}
              width={480}
              height={265}
              className="h-8 w-auto max-w-[10.5rem] object-contain object-left"
              priority
            />
            <div className="flex items-center gap-1 sm:gap-2">
              {headerActions}
              <AdminThemeToggle className="rounded-lg" />
            </div>
          </div>
        </header>
        <main className="px-6 py-8 sm:px-8 sm:py-10">
          <div className={`mx-auto w-full ${contentWidthClassName}`}>
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-white text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
      <div className="pointer-events-none absolute right-3 top-3 z-20 sm:right-5 sm:top-5">
        <div className="pointer-events-auto">
          <AdminThemeToggle className="rounded-lg" />
        </div>
      </div>

      <div className="relative z-10 flex min-h-dvh flex-col lg:flex-row">
        <aside className="relative flex shrink-0 flex-col overflow-hidden bg-[#161618] px-8 py-8 text-white sm:px-12 lg:min-h-dvh lg:w-[46%] lg:flex-none lg:justify-between lg:px-14 lg:py-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_85%_100%,rgba(1,151,178,0.32),transparent_70%),radial-gradient(40%_35%_at_0%_0%,rgba(1,151,178,0.12),transparent_70%)]"
          />
          <Image
            src="/landing/berea-house-logo-white.png"
            alt="Berea House, software para negocios"
            width={663}
            height={312}
            className="relative h-14 w-auto self-start object-contain lg:h-[4.5rem]"
            priority
          />

          <div className="relative hidden max-w-md lg:block">
            <p className="text-[2.6rem] font-semibold leading-[1.08] tracking-tight">
              Todas tus sedes, créditos e inventario{" "}
              <span className="text-[#3cc3db]">en un solo sistema.</span>
            </p>
            <LoginPhrases className="mt-6 text-base text-white/60" />
          </div>

          <p className="relative hidden items-center gap-2 text-sm text-white/50 lg:flex">
            Hecho en Sincelejo, Colombia
            <svg viewBox="0 0 3 2" className="h-3.5 w-[21px] rounded-[3px]" role="img" aria-label="Bandera de Colombia">
              <rect width="3" height="1" fill="#FCD116" />
              <rect y="1" width="3" height="0.5" fill="#003893" />
              <rect y="1.5" width="3" height="0.5" fill="#CE1126" />
            </svg>
          </p>
        </aside>

        <main className="relative flex min-w-0 flex-1 flex-col justify-center px-6 py-12 sm:px-10 lg:px-16">
          <div className={`relative mx-auto w-full ${contentWidthClassName}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
