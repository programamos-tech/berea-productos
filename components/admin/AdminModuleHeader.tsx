import type { ReactNode } from "react";
import {
  ArrowLeftRight,
  Banknote,
  BarChart3,
  Boxes,
  Building2,
  HandCoins,
  Package,
  Receipt,
  ScrollText,
  Settings,
  Store,
  Tags,
  UserRound,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";

const MODULE_ICONS = {
  reportes: BarChart3,
  caja: Wallet,
  ventas: Receipt,
  creditos: HandCoins,
  gastos: Banknote,
  inventario: Package,
  traslados: ArrowLeftRight,
  kits: Boxes,
  clientes: Users,
  configuracion: Settings,
  cuenta: UserRound,
  equipo: UsersRound,
  sucursales: Store,
  registros: ScrollText,
  cuentas: Building2,
  conceptos: Tags,
} as const;

export type AdminModuleIcon = keyof typeof MODULE_ICONS;

type Props = {
  title: string;
  subtitle?: ReactNode;
  branchName?: string | null;
  icon: AdminModuleIcon;
  actions?: ReactNode;
  actionsClassName?: string;
};

export function AdminModuleHeader({
  title,
  subtitle,
  branchName,
  icon,
  actions,
  actionsClassName,
}: Props) {
  const Icon = MODULE_ICONS[icon];
  const branch = branchName?.trim();

  return (
    <header className="rounded-xl border border-zinc-200 bg-white px-4 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300">
            <Icon className="size-5" strokeWidth={1.8} aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {title}
              </h1>
              {branch ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900">
                  <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
                  {branch}
                </span>
              ) : null}
            </div>
            {subtitle ? (
              typeof subtitle === "string" ? (
                <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>
              ) : (
                <div className="mt-0.5 text-sm text-zinc-500 [&_p]:mt-0">{subtitle}</div>
              )
            ) : null}
          </div>
        </div>
        {actions ? (
          <div
            className={
              actionsClassName ??
              "flex flex-wrap items-center justify-end gap-2"
            }
          >
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
