import Image from "next/image";
import type { ReactNode } from "react";
import { AdminThemeToggle } from "@/components/admin/AdminThemeToggle";
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
    <div className="relative min-h-dvh overflow-x-clip bg-zinc-100 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
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

      <div className="relative z-10 flex min-h-dvh flex-col lg:flex-row">
        <aside className="relative flex shrink-0 flex-col border-b border-zinc-200/80 bg-[#f7f7f5] text-zinc-900 lg:min-h-dvh lg:w-[42%] lg:max-w-xl lg:flex-none lg:border-b-0 lg:border-r">
          <div className="flex flex-col justify-center px-8 py-12 sm:px-12 lg:flex-1 lg:py-20 lg:pl-14 lg:pr-10 xl:pl-20">
            <div className="mx-auto w-full max-w-sm lg:mx-0">
              <Image
                src={adminSidebarLogoPath}
                alt={adminProductBrand}
                width={1200}
                height={662}
                className="h-auto w-full max-w-[12.5rem] object-contain object-left sm:max-w-[15rem]"
                priority
              />
              <p className="mt-8 text-sm font-medium text-zinc-800">
                Software para tu negocio.
              </p>
              <p className="mt-1.5 text-sm text-zinc-500">
                Nuevas mejoras, pronto.
              </p>
            </div>
          </div>
        </aside>

        <main className="relative flex min-w-0 flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:px-16 xl:px-24">
          <div className={`relative mx-auto w-full ${contentWidthClassName}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
