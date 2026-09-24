"use client";

import { useFormStatus } from "react-dom";
import { setTenantAccountModuleAction } from "@/app/actions/admin/platform-accounts";
import {
  listedAccountModules,
  type AccountModuleId,
} from "@/lib/admin-account-modules";

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
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition",
        enabled
          ? "border-zinc-900 bg-zinc-900 dark:border-zinc-100 dark:bg-zinc-100"
          : "border-zinc-300 bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800",
        pending ? "opacity-60" : "",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block size-4 rounded-full bg-white shadow-sm transition dark:bg-zinc-950",
          enabled ? "translate-x-6" : "translate-x-0.5",
        ].join(" ")}
      />
    </button>
  );
}

const th =
  "px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";

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
    <div>
      {errorBanner ? (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/35 dark:text-red-100">
          {errorBanner}
        </p>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
            <tr>
              <th className={th}>Módulo</th>
              <th className={th}>En el menú del cliente</th>
              <th className={`${th} text-right`}>Visible</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((mod) => {
              const enabled = !disabled.has(mod.id);
              return (
                <tr
                  key={mod.id}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/80"
                >
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {mod.label}
                    </p>
                    {mod.hint ? (
                      <p className="mt-0.5 text-xs text-zinc-500">{mod.hint}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 text-zinc-600 dark:text-zinc-300">
                    {enabled ? "Visible" : "Apagado"}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <form action={setTenantAccountModuleAction} className="inline-flex">
                      <input type="hidden" name="tenant_id" value={tenantId} />
                      <input type="hidden" name="module_id" value={mod.id} />
                      <input type="hidden" name="enabled" value={enabled ? "0" : "1"} />
                      <ModuleSwitch enabled={enabled} label={mod.label} />
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
