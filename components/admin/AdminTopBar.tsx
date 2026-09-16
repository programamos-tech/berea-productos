import Image from "next/image";
import Link from "next/link";
import { AdminGlobalSearch } from "@/components/admin/AdminGlobalSearch";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
import { AdminThemeToggle } from "@/components/admin/AdminThemeToggle";
import { AdminUserAvatar } from "@/components/admin/AdminUserAvatar";
import { AdminUserMenu } from "@/components/admin/AdminUserMenu";
import { LeaveAccountButton } from "@/components/admin/LeaveAccountButton";
import { BranchSwitcher } from "@/components/admin/BranchSwitcher";
import type { BranchContext } from "@/lib/branch-context";

function IconHelp() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.65} strokeLinecap="round" className="size-5" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 0 1 4.2-1.7c.6.6.8 1.5.5 2.3-.4 1-1.2 1.4-1.7 2.1-.2.3-.3.6-.3 1.1V14" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function IconPulse() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.65} strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden>
      <path d="M4 12h3l2-6 4 12 2-6h5" />
    </svg>
  );
}

type AdminTopBarProps = {
  showOrderNotifications?: boolean;
  displayName: string;
  email: string;
  isPlatformOperator?: boolean;
  actingAccount?: {
    holderName: string;
    storeName: string;
  } | null;
  accountBrand: {
    name: string;
    logoSrc: string;
  };
  branchContext: BranchContext;
};

const iconBtnClass =
  "rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

export function AdminTopBar({
  showOrderNotifications = false,
  displayName,
  email,
  isPlatformOperator = false,
  actingAccount = null,
  accountBrand,
  branchContext,
}: AdminTopBarProps) {
  return (
    <header className="sticky top-0 z-50 w-full min-w-0 max-w-full overflow-visible border-b border-zinc-200 bg-white/90 backdrop-blur-md print:hidden dark:border-zinc-800 dark:bg-zinc-900/90">
      {actingAccount ? (
        <div className="flex min-h-9 items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-900 px-3 py-1.5 text-[12px] text-zinc-100 sm:px-6">
          <p className="min-w-0 truncate">
            <span className="font-semibold">Cuenta de {actingAccount.holderName}</span>
            <span className="text-zinc-400"> · {actingAccount.storeName}</span>
          </p>
          <LeaveAccountButton className="shrink-0 rounded-md px-2 py-0.5 font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white disabled:opacity-60">
            Cambiar
          </LeaveAccountButton>
        </div>
      ) : null}
      <div className="flex h-14 min-w-0 max-w-full items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-6">
        <Link
          href="/admin"
          prefetch
          className="flex shrink-0 items-center rounded-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-zinc-400/50 lg:hidden"
          title={accountBrand.name}
        >
          <Image
            src={accountBrand.logoSrc}
            alt={accountBrand.name}
            width={64}
            height={64}
            className="size-8 rounded-md object-cover sm:size-9"
            priority
          />
        </Link>

        <div className="flex min-w-0 flex-1 basis-0 items-center">
          <div className="w-full min-w-0 pl-0.5">
            <AdminGlobalSearch />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <BranchSwitcher
            active={branchContext.active}
            branches={branchContext.available}
          />
          <div className="lg:hidden">
            <AdminThemeToggle />
          </div>
          <Link
            href="/admin/ventas/nueva"
            className="flex size-9 items-center justify-center rounded-full border border-[var(--admin-coral)] bg-[var(--admin-coral)] text-lg font-light leading-none text-white shadow-[0_8px_24px_-12px_color-mix(in_srgb,var(--admin-coral-deep)_40%,transparent)] transition hover:border-[var(--admin-coral-hover)] hover:bg-[var(--admin-coral-hover)] sm:size-10"
            title="Nueva factura"
          >
            +
          </Link>
          {showOrderNotifications ? (
            <AdminNotificationBell className="lg:hidden" />
          ) : null}
          <div className="ml-0.5 hidden items-center gap-0.5 border-l border-zinc-200 pl-2 dark:border-zinc-700 lg:flex">
            <AdminThemeToggle />
            <button type="button" className={iconBtnClass} title="Ayuda">
              <IconHelp />
            </button>
            <Link
              href="/admin/actividades"
              className={iconBtnClass}
              title="Registros"
            >
              <IconPulse />
            </Link>
            {showOrderNotifications ? <AdminNotificationBell /> : null}
          </div>

          <AdminUserMenu
            displayName={displayName}
            email={email}
            isPlatformOperator={isPlatformOperator}
            avatar={
              <AdminUserAvatar
                displayName={displayName}
                seed={email || displayName}
                size={40}
              />
            }
          />
        </div>
      </div>
    </header>
  );
}
