import { AdminUserAvatar } from "@/components/admin/AdminUserAvatar";
import {
  PERMISSION_MODULES,
  type PermissionMap,
} from "@/lib/admin-permissions";
import {
  adminFilterLabelClass,
  adminPageSubtitleClass,
  adminPageTitleClass,
  adminPanelClass,
} from "@/lib/admin-ui";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function jobRoleLabel(role: string | null | undefined): string {
  const r = String(role ?? "").toLowerCase();
  if (r === "owner") return "Propietario";
  if (r === "cashier") return "Cajero";
  if (r === "support") return "Soporte";
  return role ? String(role) : "—";
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function grantedPermissionGroups(permissions: PermissionMap) {
  return PERMISSION_MODULES.map((mod) => ({
    id: mod.id,
    label: mod.label,
    items: mod.items.filter((item) => Boolean(permissions[item.key])),
  })).filter((mod) => mod.items.length > 0);
}

export default async function AdminCuentaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const forbiddenNotice = sp.notice === "forbidden";

  const perm = await loadAdminPermissions();
  if (!perm) redirect("/admin/login");

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("login_username, public_email, branch_label")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = perm.displayName;
  const email = perm.email;
  const roleLabel = jobRoleLabel(perm.jobRole);
  const username = profile?.login_username?.trim() || "—";
  const permissionGroups = grantedPermissionGroups(perm.permissions);
  const grantedCount = permissionGroups.reduce(
    (n, g) => n + g.items.length,
    0,
  );
  const totalCount = PERMISSION_MODULES.reduce(
    (n, m) => n + m.items.length,
    0,
  );

  const metaBits = [
    roleLabel,
    email || null,
    profile?.branch_label?.trim() || null,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <header className="flex items-start gap-4 sm:items-center">
        <AdminUserAvatar
          displayName={displayName}
          seed={email || displayName}
          size={64}
          className="mt-0.5 sm:mt-0"
        />
        <div className="min-w-0 flex-1">
          <h1 className={adminPageTitleClass}>Mi cuenta</h1>
          <p className="mt-1 truncate text-base font-medium text-zinc-900 dark:text-zinc-100">
            {displayName}
          </p>
          <p className={`${adminPageSubtitleClass} mt-0.5 truncate`}>
            {metaBits.join(" · ")}
          </p>
        </div>
      </header>

      {forbiddenNotice ? (
        <div
          className="rounded-lg border border-amber-200/90 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          No tenés permiso para abrir esa sección. Pedile al dueño que revise tu
          rol en Equipo.
        </div>
      ) : null}

      <section className={`${adminPanelClass} p-4 sm:p-5`}>
        <h2 className={adminFilterLabelClass}>Perfil</h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-4">
          <div className="min-w-0">
            <dt className="text-[11px] text-zinc-500">Usuario</dt>
            <dd className="mt-0.5 truncate font-mono text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
              {username}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] text-zinc-500">Correo de acceso</dt>
            <dd className="mt-0.5 truncate text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
              {email || "—"}
            </dd>
          </div>
          {profile?.public_email?.trim() ? (
            <div className="min-w-0">
              <dt className="text-[11px] text-zinc-500">Correo público</dt>
              <dd className="mt-0.5 truncate text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                {profile.public_email.trim()}
              </dd>
            </div>
          ) : null}
          <div className="min-w-0">
            <dt className="text-[11px] text-zinc-500">Rol</dt>
            <dd className="mt-0.5 text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
              {roleLabel}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] text-zinc-500">Cuenta desde</dt>
            <dd className="mt-0.5 text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
              {formatDate(user.created_at)}
            </dd>
          </div>
        </dl>
      </section>

      <section className={`${adminPanelClass} p-4 sm:p-5`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className={adminFilterLabelClass}>Permisos</h2>
          <p className="text-[11px] tabular-nums text-zinc-500">
            {grantedCount} de {totalCount} activos · {roleLabel}
          </p>
        </div>
        {permissionGroups.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            No tenés permisos activos. Pedile al dueño que revise tu rol en
            Equipo.
          </p>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {permissionGroups.map((group) => (
              <div key={group.id} className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  {group.label}
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <li key={item.key}>
                      <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
