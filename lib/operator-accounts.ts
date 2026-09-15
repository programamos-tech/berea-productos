import { accountHolderLabel } from "@/lib/platform-operator";
import { formatStoreDateTime } from "@/lib/store-datetime-format";
import { adminAccountChrome, parseTenantBrand } from "@/lib/tenant-brand";

export type TenantAccountStatus = "active" | "trial" | "suspended";

export type OperatorAccountRow = {
  id: string;
  slug: string;
  logoSrc: string;
  holderName: string;
  tradeName: string;
  email: string | null;
  phone: string | null;
  status: TenantAccountStatus;
  lastSaleAt: string | null;
  lastSaleLabel: string;
  canEnter: boolean;
};

export function parseTenantAccountStatus(raw: unknown): TenantAccountStatus {
  if (raw === "trial" || raw === "suspended") return raw;
  return "active";
}

export function tenantAccountStatusTone(status: TenantAccountStatus): {
  label: string;
  className: string;
} {
  if (status === "trial") {
    return {
      label: "Prueba",
      className: "font-medium text-amber-800 dark:text-amber-300",
    };
  }
  if (status === "suspended") {
    return {
      label: "Suspendida",
      className: "font-medium text-red-600 dark:text-red-400",
    };
  }
  return {
    label: "Activa",
    className: "font-medium text-emerald-700 dark:text-emerald-400",
  };
}

export function tenantOperationalTone(input: {
  status: TenantAccountStatus;
  lastSaleAt: string | null;
}): { label: string; className: string } {
  if (input.status === "suspended") {
    return {
      label: "Suspendida",
      className: "font-medium text-red-600 dark:text-red-400",
    };
  }
  if (!input.lastSaleAt) {
    return {
      label: "Sin ventas",
      className: "font-medium text-zinc-500 dark:text-zinc-400",
    };
  }
  const ageMs = Date.now() - new Date(input.lastSaleAt).getTime();
  if (Number.isNaN(ageMs) || ageMs > 14 * 24 * 60 * 60 * 1000) {
    return {
      label: "Sin actividad reciente",
      className: "font-medium text-amber-800 dark:text-amber-300",
    };
  }
  return {
    label: "Operando",
    className: "font-medium text-emerald-700 dark:text-emerald-400",
  };
}

export function toOperatorAccountRow(row: {
  id: string;
  slug: string;
  name: string;
  status: unknown;
  account_holder_name: string | null;
  account_holder_email: string | null;
  brand: unknown;
  lastSaleAt?: string | null;
}): OperatorAccountRow {
  const chrome = adminAccountChrome({
    slug: row.slug,
    name: row.name,
    brand: row.brand,
  });
  const brand = parseTenantBrand(row.brand);
  const status = parseTenantAccountStatus(row.status);
  const lastSaleAt = row.lastSaleAt ?? null;
  return {
    id: row.id,
    slug: row.slug,
    logoSrc: chrome.logoSrc,
    holderName: accountHolderLabel(row.account_holder_name),
    tradeName: chrome.name,
    email: row.account_holder_email?.trim() || null,
    phone: brand.phone || null,
    status,
    lastSaleAt,
    lastSaleLabel: lastSaleAt
      ? formatStoreDateTime(lastSaleAt, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—",
    canEnter: status === "active" || status === "trial",
  };
}
