"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  inviteCollaboratorAction,
  updateCollaboratorAction,
} from "@/app/actions/admin/collaborators";
import { AdminFormSubmitButton } from "@/components/admin/AdminFormSubmitButton";
import { AdminUserAvatar } from "@/components/admin/AdminUserAvatar";
import {
  productInputClass as inputClass,
  productLabelClass as labelClass,
  productSectionTitle as sectionTitle,
} from "@/components/admin/product-form-primitives";
import {
  mergePermissionsWithDefaults,
  permissionsFromRoleTemplate,
  PERMISSION_MODULES,
  type CollaboratorJobRole,
  type PermissionKey,
  type PermissionMap,
} from "@/lib/admin-permissions";
import { adminPanelLgClass } from "@/lib/admin-ui";
import { slugUsername } from "@/lib/collaborator-utils";

const cardClass = `${adminPanelLgClass} p-5 sm:p-6`;

const checkboxClass =
  "mt-0.5 size-4 shrink-0 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400/40 disabled:cursor-not-allowed dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100";

export type CollaboratorInitial = {
  profileId: string;
  display_name: string | null;
  login_username: string | null;
  public_email: string | null;
  job_role: CollaboratorJobRole;
  avatar_variant: string | null;
  permissions: PermissionMap | null;
  is_active: boolean;
};

export function NewCollaboratorHeader() {
  return (
    <div className="mb-6 flex min-w-0 flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <Link href="/admin/usuarios" className="hover:text-zinc-800 dark:hover:text-zinc-200">
            Equipo
          </Link>
          <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">/</span>
          <span className="text-zinc-700 dark:text-zinc-300">Nuevo colaborador</span>
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
          Nuevo colaborador
        </h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
          Nombre, acceso y permisos del panel.
        </p>
      </div>
      <Link
        href="/admin/usuarios"
        className="inline-flex size-10 shrink-0 items-center justify-center self-start rounded-lg border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:shadow-none dark:hover:bg-zinc-800 dark:hover:text-zinc-100 sm:self-auto"
        aria-label="Volver al listado"
      >
        <span className="text-lg leading-none" aria-hidden>
          ←
        </span>
      </Link>
    </div>
  );
}

export function EditCollaboratorHeader({ name }: { name: string }) {
  return (
    <div className="mb-6 flex min-w-0 flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <Link href="/admin/usuarios" className="hover:text-zinc-800 dark:hover:text-zinc-200">
            Equipo
          </Link>
          <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">/</span>
          <span className="text-zinc-700 dark:text-zinc-300">Editar</span>
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
          Editar colaborador
        </h1>
        <p className="mt-2 max-w-xl break-words text-sm text-zinc-500 dark:text-zinc-400">
          {name}
        </p>
      </div>
      <Link
        href="/admin/usuarios"
        className="inline-flex size-10 shrink-0 items-center justify-center self-start rounded-lg border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:shadow-none dark:hover:bg-zinc-800 dark:hover:text-zinc-100 sm:self-auto"
        aria-label="Volver al listado"
      >
        <span className="text-lg leading-none" aria-hidden>
          ←
        </span>
      </Link>
    </div>
  );
}

function roleLabel(role: CollaboratorJobRole) {
  if (role === "owner") return "Dueño";
  if (role === "support") return "Apoyo";
  return "Cajero";
}

type Props = {
  mode: "create" | "edit";
  storeLabel?: string;
  initial?: CollaboratorInitial;
};

export function NewCollaboraboratorForm({ mode, initial }: Props) {
  const [displayName, setDisplayName] = useState(initial?.display_name ?? "");
  const [loginUsername, setLoginUsername] = useState(initial?.login_username ?? "");
  const [usernameTouched, setUsernameTouched] = useState(mode === "edit");
  const [email, setEmail] = useState(initial?.public_email ?? "");
  const [password, setPassword] = useState("");
  const [jobRole, setJobRole] = useState<CollaboratorJobRole>(
    initial?.job_role ?? "cashier",
  );
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [permissions, setPermissions] = useState<PermissionMap>(() =>
    mergePermissionsWithDefaults(
      initial?.permissions ?? undefined,
      initial?.job_role ?? "cashier",
    ),
  );

  useEffect(() => {
    if (mode === "edit" || usernameTouched) return;
    setLoginUsername(slugUsername(displayName));
  }, [displayName, mode, usernameTouched]);

  const avatarSeed = useMemo(
    () => (email.trim() || displayName.trim() || "berea-house").toLowerCase(),
    [email, displayName],
  );

  const payloadJson = useMemo(() => JSON.stringify(permissions), [permissions]);

  const summaryRole = roleLabel(jobRole);
  const grantedCount = PERMISSION_MODULES.reduce(
    (n, mod) => n + mod.items.filter((i) => Boolean(permissions[i.key])).length,
    0,
  );

  function togglePermission(key: PermissionKey, readOnly?: boolean) {
    if (readOnly) return;
    setPermissions((p) => ({ ...p, [key]: !p[key] }));
  }

  function restoreByRole() {
    setPermissions(permissionsFromRoleTemplate(jobRole));
  }

  const canSubmitCreate =
    displayName.trim().length > 0 &&
    loginUsername.trim().length > 0 &&
    email.includes("@") &&
    password.length >= 6;

  const canSubmitEdit =
    displayName.trim().length > 0 &&
    loginUsername.trim().length > 0 &&
    (password.length === 0 || password.length >= 6);

  const canSubmit = mode === "create" ? canSubmitCreate : canSubmitEdit;

  return (
    <form
      action={mode === "create" ? inviteCollaboratorAction : updateCollaboratorAction}
      className="space-y-6"
    >
      {mode === "edit" && initial ? (
        <input type="hidden" name="profile_id" value={initial.profileId} readOnly />
      ) : null}
      <input type="hidden" name="permissions_json" value={payloadJson} readOnly />
      <input
        type="hidden"
        name="avatar_variant"
        value={(initial?.avatar_variant ?? "A").slice(0, 1).toUpperCase() || "A"}
        readOnly
      />

      <div className="grid gap-6 xl:grid-cols-2 xl:gap-8">
        <div className="min-w-0">
          <section className={cardClass}>
            <h2 className={sectionTitle}>Datos del colaborador</h2>

            <div className="mt-5 flex items-center gap-4">
              <AdminUserAvatar
                displayName={displayName.trim() || "Colaborador"}
                seed={avatarSeed}
                size={64}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {displayName.trim() || "Sin nombre"}
                </p>
                <p className="mt-0.5 truncate text-xs text-zinc-500">
                  {email.trim() || "Sin correo"}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="display_name" className={labelClass}>
                  Nombre completo <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <input
                  id="display_name"
                  name="display_name"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ej. María López"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="login_username" className={labelClass}>
                  Usuario (acceso) <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <input
                  id="login_username"
                  name="login_username"
                  required
                  value={loginUsername}
                  onChange={(e) => {
                    setUsernameTouched(true);
                    setLoginUsername(e.target.value.toLowerCase().replace(/\s+/g, ""));
                  }}
                  placeholder="Ej. mlopez"
                  autoComplete="username"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="job_role" className={labelClass}>
                  Rol
                </label>
                <select
                  id="job_role"
                  name="job_role"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value as CollaboratorJobRole)}
                  className={inputClass}
                >
                  <option value="owner">Dueño</option>
                  <option value="cashier">Cajero</option>
                  <option value="support">Apoyo</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="email" className={labelClass}>
                  Correo <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                {mode === "create" ? (
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ej. maria@tienda.com"
                    autoComplete="email"
                    className={inputClass}
                  />
                ) : (
                  <input
                    id="email"
                    type="email"
                    readOnly
                    value={email}
                    className={`${inputClass} bg-zinc-50 text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-300`}
                  />
                )}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="password" className={labelClass}>
                  {mode === "create" ? (
                    <>
                      Contraseña inicial <span className="text-red-600 dark:text-red-400">*</span>
                    </>
                  ) : (
                    "Nueva contraseña (opcional)"
                  )}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required={mode === "create"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === "create" ? "••••••••" : "•••••••• · vacío = no cambiar"
                  }
                  autoComplete="new-password"
                  className={inputClass}
                  minLength={mode === "create" ? 6 : undefined}
                />
              </div>
              {mode === "edit" ? (
                <div className="sm:col-span-2">
                  <input
                    type="hidden"
                    name="is_active"
                    value={isActive ? "true" : "false"}
                    readOnly
                  />
                  <label
                    htmlFor="is_active"
                    className="inline-flex cursor-pointer items-center gap-2.5 text-sm font-medium text-zinc-800 dark:text-zinc-200"
                  >
                    <input
                      id="is_active"
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className={checkboxClass}
                    />
                    Colaborador activo
                  </label>
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-24 xl:self-start">
          <section className={cardClass}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className={sectionTitle}>Permisos</h2>
                <p className="mt-1 text-xs tabular-nums text-zinc-500">
                  {grantedCount} activos · {summaryRole}
                </p>
              </div>
              <button
                type="button"
                onClick={restoreByRole}
                className="shrink-0 text-xs font-semibold text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
              >
                Restaurar por rol
              </button>
            </div>

            <div className="mt-4 space-y-5">
              {PERMISSION_MODULES.map((mod) => (
                <div key={mod.id}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                    {mod.label}
                  </p>
                  <div className="mt-2 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                    {mod.items.map((item) => (
                      <label
                        key={item.key}
                        className={`flex cursor-pointer items-start gap-2.5 rounded-lg px-1 py-0.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 ${item.readOnly ? "opacity-80" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(permissions[item.key])}
                          onChange={() => togglePermission(item.key, item.readOnly)}
                          disabled={item.readOnly}
                          className={checkboxClass}
                        />
                        <span className="text-sm leading-snug text-zinc-800 dark:text-zinc-200">
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <AdminFormSubmitButton pendingLabel="Guardando…" disabled={!canSubmit}>
              {mode === "create" ? "Crear colaborador" : "Guardar cambios"}
            </AdminFormSubmitButton>
          </section>
        </div>
      </div>
    </form>
  );
}
