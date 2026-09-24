"use client";

import { useFormStatus } from "react-dom";
import { setTenantAccountModuleAction } from "@/app/actions/admin/platform-accounts";
import {
  listedAccountModules,
  type AccountModuleId,
} from "@/lib/admin-account-modules";
import { adminFilterLabelClass, adminPanelClass } from "@/lib/admin-ui";

function ModuleSwitch({
  enabled,
  label,
}: {
  enabled: boolean;
  label: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      role="switch"
      aria-checked={enabled}
      aria-label={`${label}: ${enabled ? "encendido" : "apagado"}`}
      disabled={pending}
      className={[
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition",
        enabled
          ? "border-zinc-900 bg-zinc-900 dark:border-zinc-100 dark:bg-zinc-100"
          : "border-zinc-300 bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800",
        pending ? "opacity-60" : "",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block size-5 rounded-full bg-white shadow-sm transition dark:bg-zinc-950",
          enabled ? "translate-x-6" : "translate-x-1",
        ].join(" ")}
      />
      <span className="sr-only">{enabled ? "Encendido" : "Apagado"}</span>
    </button>
  );
}

export function OperatorAccountModulesPanel({
  tenantId,
  disabledModules,
  errorBanner,
}: {
  tenantId: string;
  disabledModules: AccountModuleId[];
  errorBanner?: string | null;
}) {
  const disabled = new Set(disabledModules);
  const modules = listedAccountModules();

  return (
    <section className={`${adminPanelClass} p-4 sm:p-5`}>
      <h2 className={adminFilterLabelClass}>Módulos</h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Lo que apagues desaparece del menú y del panel de esta cuenta, para
        todo el equipo.
      </p>
      {errorBanner ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/35 dark:text-red-100">
          {errorBanner}
        </p>
      ) : null}
      <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
        {modules.map((mod) => {
          const enabled = !disabled.has(mod.id);
          return (
            <li key={mod.id} className="py-3 first:pt-0 last:pb-0">
              <form
                action={setTenantAccountModuleAction}
                className="flex items-center justify-between gap-3"
              >
                <input type="hidden" name="tenant_id" value={tenantId} />
                <input type="hidden" name="module_id" value={mod.id} />
                <input
                  type="hidden"
                  name="enabled"
                  value={enabled ? "0" : "1"}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {mod.label}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {enabled ? "Visible" : "Apagado"}
                    {mod.hint ? ` · ${mod.hint}` : ""}
                  </p>
                </div>
                <ModuleSwitch enabled={enabled} label={mod.label} />
              </form>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
