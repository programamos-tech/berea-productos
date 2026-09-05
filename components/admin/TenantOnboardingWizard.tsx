"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createTenantOnboarding,
  type CreateTenantOnboardingResult,
} from "@/app/actions/admin/tenant-onboarding";
import {
  adminButtonCancelClass,
  adminPanelClass,
} from "@/lib/admin-ui";
import {
  adminPrimarySubmitButtonClass,
} from "@/components/admin/AdminFormSubmitButton";
import {
  productInputClass,
  productLabelClass,
  productSectionTitle,
} from "@/components/admin/product-form-primitives";
import { isValidTenantSlug } from "@/lib/tenant-brand";
import { PLATFORM_PRODUCT_HOST } from "@/lib/tenancy";

const STEPS = [
  { id: 1, title: "Cuenta", hint: "Slug y nombre de la tienda" },
  { id: 2, title: "Facturación", hint: "Datos de tirilla / factura" },
  { id: 3, title: "Contacto", hint: "Teléfono, correo, WhatsApp" },
  { id: 4, title: "Logo", hint: "Imagen para impresión" },
  { id: 5, title: "Dueño", hint: "Primer usuario owner" },
  { id: 6, title: "Revisar", hint: "Crear la tienda" },
] as const;

type FormState = {
  slug: string;
  name: string;
  status: "trial" | "active";
  trade_name: string;
  legal_name: string;
  tax_nit: string;
  tax_regime: string;
  address: string;
  city: string;
  phone: string;
  contact_email: string;
  whatsapp: string;
  custom_domains: string;
  owner_email: string;
  owner_password: string;
  owner_display_name: string;
};

const INITIAL: FormState = {
  slug: "",
  name: "",
  status: "trial",
  trade_name: "",
  legal_name: "",
  tax_nit: "",
  tax_regime: "Responsables de IVA",
  address: "",
  city: "",
  phone: "",
  contact_email: "",
  whatsapp: "",
  custom_domains: "",
  owner_email: "",
  owner_password: "",
  owner_display_name: "",
};

function errorMessage(code: string): string {
  switch (code) {
    case "forbidden":
      return "Solo owners (o emails de plataforma) pueden crear tiendas desde el admin.";
    case "auth":
      return "Debés iniciar sesión o entrar desde productos.bereahouse.com.";
    case "no_service":
      return "Falta SUPABASE_SERVICE_ROLE_KEY en el entorno.";
    case "slug_invalid":
      return "Slug inválido: minúsculas, números y guiones (2–48).";
    case "slug_taken":
      return "Ese slug ya existe.";
    case "name_required":
      return "Indicá el nombre de la tienda.";
    case "billing_required":
      return "Razón social y NIT son obligatorios.";
    case "owner_invalid":
      return "Email del dueño y contraseña (mín. 6) son obligatorios.";
    case "owner_email_taken":
      return "Ese email de dueño ya está registrado en Auth.";
    case "logo_upload":
      return "No se pudo subir el logo (bucket product-images).";
    case "auth_user":
    case "profile":
    case "db":
      return "Error al crear la tienda. Revisá logs del servidor.";
    default:
      return "No se pudo completar el onboarding.";
  }
}

export function TenantOnboardingWizard({
  variant = "admin",
}: {
  /** `public` = self-serve en productos.bereahouse.com */
  variant?: "admin" | "public";
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Extract<
    CreateTenantOnboardingResult,
    { ok: true }
  > | null>(null);
  const [pending, startTransition] = useTransition();

  const hostPreview = useMemo(() => {
    const s = form.slug.trim().toLowerCase();
    if (!isValidTenantSlug(s)) return `…${PLATFORM_PRODUCT_HOST}`;
    return `${s}.${PLATFORM_PRODUCT_HOST}`;
  }, [form.slug]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function validateStep(n: number): string | null {
    if (n === 1) {
      if (!isValidTenantSlug(form.slug.trim().toLowerCase())) {
        return "Slug inválido (a-z, 0-9, guiones; 2–48 caracteres).";
      }
      if (form.name.trim().length < 2) return "Nombre comercial demasiado corto.";
    }
    if (n === 2) {
      if (!form.legal_name.trim()) return "Indicá la razón social.";
      if (!form.tax_nit.trim()) return "Indicá el NIT.";
    }
    if (n === 5) {
      if (!form.owner_email.includes("@")) return "Email del dueño inválido.";
      if (form.owner_password.length < 6) {
        return "Contraseña temporal: mínimo 6 caracteres.";
      }
    }
    return null;
  }

  function goNext() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    if (step === 1 && !form.trade_name.trim()) {
      setField("trade_name", form.name.trim());
    }
    setError(null);
    setStep((s) => Math.min(6, s + 1));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  function onLogoChange(file: File | null) {
    setLogoFile(file);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  }

  function submit() {
    const err = validateStep(5);
    if (err) {
      setError(err);
      setStep(5);
      return;
    }
    const fd = new FormData();
    fd.set("slug", form.slug.trim().toLowerCase());
    fd.set("name", form.name.trim());
    fd.set("status", form.status);
    fd.set("trade_name", (form.trade_name || form.name).trim());
    fd.set("legal_name", form.legal_name.trim());
    fd.set("tax_nit", form.tax_nit.trim());
    fd.set("tax_regime", form.tax_regime.trim());
    fd.set("address", form.address.trim());
    fd.set("city", form.city.trim());
    fd.set("phone", form.phone.trim());
    fd.set("contact_email", form.contact_email.trim());
    fd.set("whatsapp", form.whatsapp.trim());
    fd.set("custom_domains", form.custom_domains.trim());
    fd.set("owner_email", form.owner_email.trim().toLowerCase());
    fd.set("owner_password", form.owner_password);
    fd.set(
      "owner_display_name",
      (form.owner_display_name || form.trade_name || form.name).trim(),
    );
    if (logoFile) fd.set("logo", logoFile);

    startTransition(async () => {
      const result = await createTenantOnboarding(fd);
      if (!result.ok) {
        setError(errorMessage(result.error));
        return;
      }
      setSuccess(result);
    });
  }

  if (success) {
    return (
      <div className={`${adminPanelClass} p-5 sm:p-6`}>
        <p className={productSectionTitle}>Listo</p>
        <h2 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Tienda creada
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Slug <span className="font-mono text-zinc-900 dark:text-zinc-100">{success.slug}</span>
          . El dueño puede entrar con:
        </p>
        <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          {success.loginHint}
        </p>
        <p className="mt-3 text-xs text-zinc-500">
          Host canónico: {success.slug}.{PLATFORM_PRODUCT_HOST}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {variant === "admin" ? (
            <button
              type="button"
              className={adminPrimarySubmitButtonClass + " px-4 py-2.5"}
              onClick={() => {
                setSuccess(null);
                setForm(INITIAL);
                setLogoFile(null);
                setLogoPreview(null);
                setStep(1);
              }}
            >
              Crear otra
            </button>
          ) : null}
          <a
            href={
              variant === "public"
                ? `https://${success.slug}.${PLATFORM_PRODUCT_HOST}/admin/login`
                : "/admin"
            }
            className={
              variant === "public"
                ? `${adminPrimarySubmitButtonClass} px-4 py-2.5 no-underline`
                : adminButtonCancelClass
            }
          >
            {variant === "public" ? "Entrar al panel" : "Ir a reportes"}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <ol className="flex flex-wrap gap-1.5">
        {STEPS.map((s) => {
          const active = s.id === step;
          const done = s.id < step;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  if (s.id < step) setStep(s.id);
                }}
                disabled={s.id > step}
                className={[
                  "rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition",
                  active
                    ? "bg-[var(--admin-coral)] text-white"
                    : done
                      ? "bg-[var(--admin-coral-mist)] text-[var(--admin-coral-deep)]"
                      : "bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600",
                ].join(" ")}
              >
                {s.id}. {s.title}
              </button>
            </li>
          );
        })}
      </ol>

      <div className={`${adminPanelClass} flex min-h-0 flex-1 flex-col p-4 sm:p-5`}>
        <p className={productSectionTitle}>{STEPS[step - 1]!.hint}</p>

        {step === 1 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={productLabelClass} htmlFor="ob-slug">
                Slug (subdominio)
              </label>
              <input
                id="ob-slug"
                className={productInputClass + " font-mono"}
                value={form.slug}
                onChange={(e) =>
                  setField(
                    "slug",
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                  )
                }
                placeholder="mi-tienda"
                autoComplete="off"
              />
              <p className="mt-1.5 text-xs text-zinc-500">
                Host: <span className="font-mono">{hostPreview}</span>
              </p>
            </div>
            <div>
              <label className={productLabelClass} htmlFor="ob-name">
                Nombre comercial
              </label>
              <input
                id="ob-name"
                className={productInputClass}
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Mi Tienda"
              />
            </div>
            {variant === "admin" ? (
              <div>
                <label className={productLabelClass} htmlFor="ob-status">
                  Estado
                </label>
                <select
                  id="ob-status"
                  className={productInputClass}
                  value={form.status}
                  onChange={(e) =>
                    setField("status", e.target.value as "trial" | "active")
                  }
                >
                  <option value="trial">Prueba (trial)</option>
                  <option value="active">Activa</option>
                </select>
              </div>
            ) : null}
            {variant === "admin" ? (
              <div className="sm:col-span-2">
                <label className={productLabelClass} htmlFor="ob-domains">
                  Dominios personalizados (opcional)
                </label>
                <input
                  id="ob-domains"
                  className={productInputClass}
                  value={form.custom_domains}
                  onChange={(e) => setField("custom_domains", e.target.value)}
                  placeholder="tienda.com, www.tienda.com"
                />
              </div>
            ) : null}
          </div>
        )}

        {step === 2 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={productLabelClass} htmlFor="ob-trade">
                Nombre en tirilla
              </label>
              <input
                id="ob-trade"
                className={productInputClass}
                value={form.trade_name}
                onChange={(e) => setField("trade_name", e.target.value)}
                placeholder={form.name || "Nombre corto"}
              />
            </div>
            <div>
              <label className={productLabelClass} htmlFor="ob-legal">
                Razón social
              </label>
              <input
                id="ob-legal"
                className={productInputClass}
                value={form.legal_name}
                onChange={(e) => setField("legal_name", e.target.value)}
                placeholder="Mi Tienda SAS"
              />
            </div>
            <div>
              <label className={productLabelClass} htmlFor="ob-nit">
                NIT
              </label>
              <input
                id="ob-nit"
                className={productInputClass}
                value={form.tax_nit}
                onChange={(e) => setField("tax_nit", e.target.value)}
                placeholder="900.000.000-0"
              />
            </div>
            <div>
              <label className={productLabelClass} htmlFor="ob-regime">
                Régimen tributario
              </label>
              <input
                id="ob-regime"
                className={productInputClass}
                value={form.tax_regime}
                onChange={(e) => setField("tax_regime", e.target.value)}
              />
            </div>
            <div>
              <label className={productLabelClass} htmlFor="ob-addr">
                Dirección
              </label>
              <input
                id="ob-addr"
                className={productInputClass}
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
              />
            </div>
            <div>
              <label className={productLabelClass} htmlFor="ob-city">
                Ciudad
              </label>
              <input
                id="ob-city"
                className={productInputClass}
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
                placeholder="Cali"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={productLabelClass} htmlFor="ob-phone">
                Teléfono
              </label>
              <input
                id="ob-phone"
                className={productInputClass}
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="+57 300 0000000"
              />
            </div>
            <div>
              <label className={productLabelClass} htmlFor="ob-email">
                Email de contacto
              </label>
              <input
                id="ob-email"
                type="email"
                className={productInputClass}
                value={form.contact_email}
                onChange={(e) => setField("contact_email", e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={productLabelClass} htmlFor="ob-wa">
                WhatsApp (opcional)
              </label>
              <input
                id="ob-wa"
                className={productInputClass}
                value={form.whatsapp}
                onChange={(e) => setField("whatsapp", e.target.value)}
                placeholder="573000000000"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex-1">
              <label className={productLabelClass} htmlFor="ob-logo">
                Logo para factura / tirilla
              </label>
              <input
                id="ob-logo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--admin-coral-mist)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--admin-coral-deep)]"
                onChange={(e) => onLogoChange(e.target.files?.[0] ?? null)}
              />
              <p className="mt-2 text-xs text-zinc-500">
                Se guarda en Storage: product-images/tenants/…/logo.*
              </p>
            </div>
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoPreview}
                alt="Vista previa del logo"
                className="size-28 rounded-lg border border-zinc-200 object-contain bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-950"
              />
            ) : (
              <div className="flex size-28 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-[11px] text-zinc-400 dark:border-zinc-700">
                Sin logo
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={productLabelClass} htmlFor="ob-owner-name">
                Nombre del dueño
              </label>
              <input
                id="ob-owner-name"
                className={productInputClass}
                value={form.owner_display_name}
                onChange={(e) => setField("owner_display_name", e.target.value)}
                placeholder={form.trade_name || form.name || "Dueño"}
              />
            </div>
            <div>
              <label className={productLabelClass} htmlFor="ob-owner-email">
                Email (login)
              </label>
              <input
                id="ob-owner-email"
                type="email"
                className={productInputClass}
                value={form.owner_email}
                onChange={(e) => setField("owner_email", e.target.value)}
                autoComplete="off"
              />
            </div>
            <div>
              <label className={productLabelClass} htmlFor="ob-owner-pw">
                Contraseña temporal
              </label>
              <input
                id="ob-owner-pw"
                type="password"
                className={productInputClass}
                value={form.owner_password}
                onChange={(e) => setField("owner_password", e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>
        )}

        {step === 6 && (
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <ReviewRow label="Slug" value={form.slug} mono />
            <ReviewRow label="Estado" value={form.status} />
            <ReviewRow label="Nombre" value={form.name} />
            <ReviewRow
              label="Tirilla"
              value={form.trade_name || form.name}
            />
            <ReviewRow label="Razón social" value={form.legal_name} />
            <ReviewRow label="NIT" value={form.tax_nit} />
            <ReviewRow label="Régimen" value={form.tax_regime} />
            <ReviewRow
              label="Dirección"
              value={[form.address, form.city].filter(Boolean).join(", ") || "—"}
            />
            <ReviewRow label="Teléfono" value={form.phone || "—"} />
            <ReviewRow label="Email" value={form.contact_email || "—"} />
            <ReviewRow label="Dueño" value={form.owner_email} />
            <ReviewRow
              label="Logo"
              value={logoFile ? logoFile.name : "Sin archivo (env default)"}
            />
            {form.custom_domains.trim() ? (
              <ReviewRow
                label="Dominios"
                value={form.custom_domains}
                className="sm:col-span-2"
              />
            ) : null}
          </dl>
        )}

        {error ? (
          <p
            className="mt-4 rounded-lg border border-[color-mix(in_srgb,var(--admin-coral)_40%,transparent)] bg-[var(--admin-coral-mist)] px-3 py-2 text-sm text-[var(--admin-coral-deep)]"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <button
            type="button"
            className={adminButtonCancelClass}
            onClick={goBack}
            disabled={step === 1 || pending}
          >
            Atrás
          </button>
          {step < 6 ? (
            <button
              type="button"
              className={adminPrimarySubmitButtonClass + " px-5 py-2.5"}
              onClick={goNext}
            >
              Siguiente
            </button>
          ) : (
            <button
              type="button"
              className={adminPrimarySubmitButtonClass + " px-5 py-2.5"}
              onClick={submit}
              disabled={pending}
            >
              {pending ? "Creando…" : "Crear tienda"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  mono,
  className = "",
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
        {label}
      </dt>
      <dd
        className={[
          "mt-0.5 text-zinc-900 dark:text-zinc-100",
          mono ? "font-mono text-xs" : "",
        ].join(" ")}
      >
        {value || "—"}
      </dd>
    </div>
  );
}
