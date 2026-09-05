import Link from "next/link";
import {
  UsuariosTeamTable,
  type TeamMemberRow,
} from "@/components/admin/UsuariosTeamTable";
import {
  adminPageSubtitleClass,
  adminPageTitleClass,
  adminToolbarBtnActiveClass,
  adminToolbarBtnBaseClass,
} from "@/lib/admin-ui";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  created_at: string;
  display_name: string | null;
  login_username: string | null;
  public_email: string | null;
  job_role: string | null;
  branch_label: string | null;
  is_active: boolean | null;
};

function jobLabel(jobRole: string | null | undefined): string {
  if (jobRole === "owner") return "Dueño";
  if (jobRole === "support") return "Apoyo";
  return "Cajero";
}

function jobToneClass(jobRole: string | null | undefined): string {
  if (jobRole === "owner") {
    return "font-medium text-emerald-700 dark:text-emerald-300";
  }
  if (jobRole === "support") {
    return "font-medium text-violet-700 dark:text-violet-300";
  }
  return "font-medium text-sky-700 dark:text-sky-300";
}

export default async function AdminUsuariosRolesPage() {
  const authPerm = await loadAdminPermissions();
  const canManageCollaborators = Boolean(
    authPerm?.permissions.colaboradores_gestionar,
  );

  const supabase = await createSupabaseServerClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      "id, created_at, display_name, login_username, public_email, job_role, branch_label, is_active",
    )
    .order("created_at", { ascending: true });

  const emailByUserId = new Map<string, string>();
  try {
    const service = createSupabaseServiceClient();
    const { data } = await service.auth.admin.listUsers({ perPage: 200 });
    for (const u of data?.users ?? []) {
      if (u.email) emailByUserId.set(u.id, u.email);
    }
  } catch {
    /* sin SUPABASE_SERVICE_ROLE_KEY: solo public_email en perfiles */
  }

  if (error) {
    return (
      <div className="w-full min-w-0 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/35 dark:text-amber-100">
        No se pudieron cargar los perfiles. Aplica la migración{" "}
        <code className="rounded bg-amber-100/80 px-1 py-0.5 text-xs dark:bg-amber-900/50">
          20260516120000_profiles_team_roles.sql
        </code>{" "}
        y revisa políticas RLS.
      </div>
    );
  }

  const rows: TeamMemberRow[] = ((profiles ?? []) as ProfileRow[]).map(
    (row) => {
      const title =
        row.display_name?.trim() ||
        row.login_username?.trim() ||
        "Colaborador";
      const email =
        row.public_email?.trim() || emailByUserId.get(row.id) || "—";
      const loginEmail = emailByUserId.get(row.id)?.trim() || "";
      const jobRole = row.job_role ?? "cashier";
      const avatarSeed =
        (loginEmail || (email !== "—" ? email : "") || title).toLowerCase();

      return {
        id: row.id,
        title,
        email,
        username: row.login_username?.trim() || "—",
        jobRole,
        jobLabel: jobLabel(jobRole),
        jobToneClass: jobToneClass(jobRole),
        active: row.is_active !== false,
        branchLabel: row.branch_label?.trim() || null,
        avatarSeed,
      };
    },
  );

  return (
    <div className="flex w-full min-w-0 max-w-none flex-col gap-4">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 gap-y-2">
        <div className="min-w-0">
          <h1 className={adminPageTitleClass}>Equipo</h1>
          <p className={adminPageSubtitleClass}>
            Colaboradores, roles y permisos
          </p>
        </div>
        {canManageCollaborators ? (
          <Link
            href="/admin/usuarios/nuevo"
            className={`${adminToolbarBtnBaseClass} ${adminToolbarBtnActiveClass}`}
          >
            + Nuevo colaborador
          </Link>
        ) : null}
      </header>

      <section className="border-t border-zinc-200/70 pt-4 dark:border-zinc-800">
        <UsuariosTeamTable
          rows={rows}
          canManage={canManageCollaborators}
        />
      </section>
    </div>
  );
}
