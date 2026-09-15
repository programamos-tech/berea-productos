import Link from "next/link";
import { LogIn } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { OperatorAccountEnterButton } from "@/components/admin/OperatorAccountEnterButton";
import { OperatorAccountLogo } from "@/components/admin/OperatorAccountLogo";
import {
  adminFilterLabelClass,
  adminPageSubtitleClass,
  adminPageTitleClass,
  adminPanelClass,
  adminToolbarBtnActiveClass,
  adminToolbarBtnBaseClass,
} from "@/lib/admin-ui";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";
import {
  tenantAccountStatusTone,
  tenantOperationalTone,
  toOperatorAccountRow,
} from "@/lib/operator-accounts";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { parseTenantBrand } from "@/lib/tenant-brand";
import { tenantProductHost } from "@/lib/tenancy";
import { formatStoreDateTime } from "@/lib/store-datetime-format";

export const dynamic = "force-dynamic";

function formatDay(iso: string | null | undefined) {
  if (!iso) return "—";
  return formatStoreDateTime(iso, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-zinc-500">{label}</dt>
      <dd className="mt-0.5 truncate text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
        {value?.trim() || "—"}
      </dd>
    </div>
  );
}

export default async function AdminCuentaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const perm = await loadAdminPermissions();
  if (!perm) redirect("/admin/login");
  if (!perm.isPlatformOperator) redirect("/admin");

  let service: ReturnType<typeof createSupabaseServiceClient>;
  try {
    service = createSupabaseServiceClient();
  } catch {
    redirect("/admin/cuentas");
  }

  const { data: tenant } = await service
    .from("tenants")
    .select(
      "id, slug, name, status, account_holder_name, account_holder_email, brand, custom_domains, created_at",
    )
    .eq("id", id)
    .eq("kind", "customer")
    .maybeSingle();

  if (!tenant?.id) notFound();

  const [{ data: lastOrder }, staffRes, productsRes] = await Promise.all([
    service
      .from("orders")
      .select("created_at, status, total_cents")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    service
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .eq("is_platform_operator", false),
    service
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id),
  ]);

  const row = toOperatorAccountRow({
    id: tenant.id as string,
    slug: tenant.slug as string,
    name: tenant.name as string,
    status: tenant.status,
    account_holder_name: tenant.account_holder_name as string | null,
    account_holder_email: tenant.account_holder_email as string | null,
    brand: tenant.brand,
    lastSaleAt: (lastOrder?.created_at as string | undefined) ?? null,
  });
  const brand = parseTenantBrand(tenant.brand);
  const estado = tenantAccountStatusTone(row.status);
  const operativo = tenantOperationalTone({
    status: row.status,
    lastSaleAt: row.lastSaleAt,
  });
  const domains = Array.isArray(tenant.custom_domains)
    ? (tenant.custom_domains as string[]).filter(Boolean)
    : [];
  const staffCount = staffRes.count ?? 0;
  const productCount = productsRes.count ?? 0;

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <p>
        <Link
          href="/admin/cuentas"
          className="text-sm font-medium text-zinc-500 underline-offset-4 hover:text-zinc-800 hover:underline dark:hover:text-zinc-200"
        >
          ← Cuentas
        </Link>
      </p>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <OperatorAccountLogo src={row.logoSrc} name={row.tradeName} size={64} />
          <div className="min-w-0">
            <h1 className={adminPageTitleClass}>{row.holderName}</h1>
            <p className="mt-1 truncate text-base font-medium text-zinc-900 dark:text-zinc-100">
              {row.tradeName}
            </p>
            <p className={`${adminPageSubtitleClass} mt-0.5`}>
              <span className={estado.className}>{estado.label}</span>
              <span className="mx-1.5 text-zinc-400">·</span>
              <span className={operativo.className}>{operativo.label}</span>
            </p>
          </div>
        </div>
        {row.canEnter ? (
          <OperatorAccountEnterButton
            row={row}
            className={`${adminToolbarBtnBaseClass} ${adminToolbarBtnActiveClass}`}
          >
            <LogIn className="size-4" strokeWidth={2} aria-hidden />
            Entrar a la cuenta
          </OperatorAccountEnterButton>
        ) : null}
      </header>

      <section className={`${adminPanelClass} p-4 sm:p-5`}>
        <h2 className={adminFilterLabelClass}>Cliente</h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
          <Field label="Nombre" value={row.holderName} />
          <Field label="Correo" value={row.email} />
          <Field label="Teléfono" value={row.phone} />
          <Field label="WhatsApp" value={brand.whatsapp} />
        </dl>
      </section>

      <section className={`${adminPanelClass} p-4 sm:p-5`}>
        <h2 className={adminFilterLabelClass}>Negocio</h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
          <Field label="Nombre comercial" value={row.tradeName} />
          <Field label="Razón social" value={brand.legal_name} />
          <Field label="NIT" value={brand.tax_nit} />
          <Field label="Régimen" value={brand.tax_regime} />
          <Field label="Ciudad" value={brand.city} />
          <Field label="Dirección" value={brand.address} />
          <Field label="Correo del negocio" value={brand.email} />
        </dl>
      </section>

      <section className={`${adminPanelClass} p-4 sm:p-5`}>
        <h2 className={adminFilterLabelClass}>Estado operativo</h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
          <div className="min-w-0">
            <dt className="text-[11px] text-zinc-500">Cuenta</dt>
            <dd className={`mt-0.5 text-[13px] ${estado.className}`}>
              {estado.label}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] text-zinc-500">Operación</dt>
            <dd className={`mt-0.5 text-[13px] ${operativo.className}`}>
              {operativo.label}
            </dd>
          </div>
          <Field label="Alta" value={formatDay(tenant.created_at as string)} />
          <Field label="Última venta" value={formatDay(row.lastSaleAt)} />
          <Field
            label="Equipo"
            value={`${staffCount} ${staffCount === 1 ? "persona" : "personas"}`}
          />
          <Field
            label="Productos"
            value={`${productCount}`}
          />
          <Field label="Slug" value={row.slug} />
          <Field
            label="Host Berea"
            value={tenantProductHost(row.slug)}
          />
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-[11px] text-zinc-500">Dominios</dt>
            <dd className="mt-0.5 text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
              {domains.length > 0 ? domains.join(", ") : "—"}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
