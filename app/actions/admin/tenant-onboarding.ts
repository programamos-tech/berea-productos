"use server";

/**
 * Tenant onboarding (Berea Productos).
 *
 * Authorization:
 * - Self-serve on `productos.bereahouse.com` (no session required), OR
 * - Authenticated admin with `profiles.job_role === 'owner'`, OR
 * - Session email listed in `BEREA_PLATFORM_ADMIN_EMAILS`.
 */

import { defaultPermissionsOwner } from "@/lib/admin-permissions";
import { slugUsername } from "@/lib/collaborator-utils";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  buildTenantBrandJson,
  isValidTenantSlug,
} from "@/lib/tenant-brand";
import { assertCanCreateTenant } from "@/lib/tenant-onboarding-auth";
import { tenantProductHost } from "@/lib/tenancy";
import { revalidatePath } from "next/cache";

export type CreateTenantOnboardingResult =
  | {
      ok: true;
      tenantId: string;
      slug: string;
      loginHint: string;
    }
  | { ok: false; error: string };

function parseCustomDomains(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((d) => d.trim().toLowerCase().replace(/\.$/, ""))
    .filter((d) => d.length > 0 && d.includes("."));
}

function extFromFilename(name: string): string {
  const m = /\.([a-zA-Z0-9]+)$/.exec(name);
  const ext = (m?.[1] ?? "png").toLowerCase();
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) {
    return ext === "jpeg" ? "jpg" : ext;
  }
  return "png";
}

async function uploadTenantLogo(
  service: ReturnType<typeof createSupabaseServiceClient>,
  tenantId: string,
  file: Blob,
  filenameHint?: string,
): Promise<{ path: string } | { error: string }> {
  const ext =
    typeof File !== "undefined" && file instanceof File
      ? extFromFilename(file.name)
      : filenameHint
        ? extFromFilename(filenameHint)
        : "png";
  const objectPath = `tenants/${tenantId}/logo.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await service.storage.from("product-images").upload(objectPath, buf, {
    contentType: file.type || `image/${ext === "jpg" ? "jpeg" : ext}`,
    upsert: true,
  });
  if (error) {
    console.error("[onboarding] logo upload:", error.message);
    return { error: "logo_upload" };
  }
  return { path: `product-images/${objectPath}` };
}

/**
 * Create a new tenant + first owner (Auth user + profiles row).
 * Uses service role. Does not clone catalog/data.
 */
export async function createTenantOnboarding(
  formData: FormData,
): Promise<CreateTenantOnboardingResult> {
  const gate = await assertCanCreateTenant();
  if (!gate.ok) return gate;

  let service: ReturnType<typeof createSupabaseServiceClient>;
  try {
    service = createSupabaseServiceClient();
  } catch {
    return { ok: false, error: "no_service" };
  }

  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "trial").trim();
  const status =
    gate.selfServe
      ? "trial"
      : statusRaw === "active" || statusRaw === "trial"
        ? statusRaw
        : "trial";

  const tradeName = String(formData.get("trade_name") ?? "").trim() || name;
  const legalName = String(formData.get("legal_name") ?? "").trim();
  const taxNit = String(formData.get("tax_nit") ?? "").trim();
  const taxRegime = String(formData.get("tax_regime") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "")
    .trim()
    .toLowerCase();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const customDomainsRaw = String(formData.get("custom_domains") ?? "");
  const customDomains = parseCustomDomains(customDomainsRaw);

  const ownerEmail = String(formData.get("owner_email") ?? "")
    .trim()
    .toLowerCase();
  const ownerPassword = String(formData.get("owner_password") ?? "");
  const ownerDisplayName =
    String(formData.get("owner_display_name") ?? "").trim() || tradeName;

  if (!isValidTenantSlug(slug)) {
    return { ok: false, error: "slug_invalid" };
  }
  if (!name || name.length < 2) {
    return { ok: false, error: "name_required" };
  }
  if (!legalName || !taxNit) {
    return { ok: false, error: "billing_required" };
  }
  if (!ownerEmail.includes("@") || ownerPassword.length < 6) {
    return { ok: false, error: "owner_invalid" };
  }

  const { data: existing } = await service
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing?.id) {
    return { ok: false, error: "slug_taken" };
  }

  const brand = buildTenantBrandJson({
    tradeName,
    legalName,
    taxNit,
    taxRegime: taxRegime || "Responsables de IVA",
    phone,
    email: contactEmail,
    whatsapp: whatsapp || undefined,
    address,
    city,
  });

  const { data: tenant, error: tErr } = await service
    .from("tenants")
    .insert({
      slug,
      name,
      status,
      custom_domains: customDomains,
      brand,
    })
    .select("id, slug")
    .single();

  if (tErr || !tenant?.id) {
    console.error("[onboarding] insert tenant:", tErr?.message);
    if ((tErr?.message ?? "").toLowerCase().includes("duplicate")) {
      return { ok: false, error: "slug_taken" };
    }
    return { ok: false, error: "db" };
  }

  const tenantId = tenant.id as string;

  const logoRaw = formData.get("logo");
  if (
    logoRaw != null &&
    typeof logoRaw !== "string" &&
    logoRaw instanceof Blob &&
    logoRaw.size > 0
  ) {
    const up = await uploadTenantLogo(
      service,
      tenantId,
      logoRaw,
      logoRaw instanceof File ? logoRaw.name : undefined,
    );
    if ("path" in up) {
      brand.logo_path = up.path;
      const { error: brandErr } = await service
        .from("tenants")
        .update({ brand })
        .eq("id", tenantId);
      if (brandErr) {
        console.error("[onboarding] brand logo update:", brandErr.message);
      }
    }
  }

  const loginUsername = slugUsername(ownerDisplayName) || `owner-${slug}`;

  const { data: created, error: cErr } = await service.auth.admin.createUser({
    email: ownerEmail,
    password: ownerPassword,
    email_confirm: true,
    user_metadata: {
      display_name: ownerDisplayName,
      login_username: loginUsername,
    },
    app_metadata: {
      tenant_id: tenantId,
      tenant_slug: slug,
    },
  });

  if (cErr || !created.user) {
    await service.from("tenants").delete().eq("id", tenantId);
    const msg = (cErr?.message ?? "").toLowerCase();
    if (msg.includes("already") || msg.includes("registered")) {
      return { ok: false, error: "owner_email_taken" };
    }
    console.error("[onboarding] createUser:", cErr?.message);
    return { ok: false, error: "auth_user" };
  }

  const uid = created.user.id;
  const permissions = defaultPermissionsOwner();

  const { error: pErr } = await service.from("profiles").insert({
    id: uid,
    role: "admin",
    display_name: ownerDisplayName,
    login_username: loginUsername,
    public_email: ownerEmail,
    job_role: "owner",
    permissions: permissions as object,
    avatar_variant: "A",
    is_active: true,
    tenant_id: tenantId,
  });

  if (pErr) {
    console.error("[onboarding] profile insert:", pErr.message);
    await service.auth.admin.deleteUser(uid);
    await service.from("tenants").delete().eq("id", tenantId);
    return { ok: false, error: "profile" };
  }

  const loginHint = `${ownerEmail} · ${tenantProductHost(slug)}/admin/login`;

  revalidatePath("/admin/tenants/nuevo");
  return {
    ok: true,
    tenantId,
    slug,
    loginHint,
  };
}
