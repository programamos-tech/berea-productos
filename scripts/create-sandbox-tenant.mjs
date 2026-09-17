#!/usr/bin/env node
/**
 * Crea (o repara) la cuenta de pruebas Berea Tech.
 * Catálogo vacío, aislada de Aleya y demás clientes.
 *
 *   node scripts/create-sandbox-tenant.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const SLUG = "berea-tech";
const NAME = "Berea Tech";
const HOLDER = "Berea Tech";
const EMAIL = "berea@housetech.com";
const LOGO = "/logo-berea-house-mark.png";

function parseEnvFile(p) {
  const out = {};
  if (!existsSync(p)) return out;
  const raw = readFileSync(p, "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function loadEnvIntoProcess(p) {
  const parsed = parseEnvFile(p);
  for (const [k, v] of Object.entries(parsed)) {
    if (!v || /\[SENSITIVE\]/i.test(v)) continue;
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvIntoProcess(join(root, ".env.local"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const brand = {
  sandbox: true,
  trade_name: NAME,
  legal_name: "Berea House",
  tax_nit: "000.000.000",
  tax_regime: "No responsable de IVA",
  email: EMAIL,
  city: "Cali",
  logo_path: LOGO,
  primary_color: "#0f766e",
};

const expenseConcepts = [
  ["Administración", "administracion", "transferencia", true, false, false, null, 20],
  ["Arriendo", "fijo", "transferencia", true, false, false, null, 30],
  ["Servicio público", "servicios", "transferencia", true, false, false, null, 40],
  ["Personal Turnos", "nomina", "efectivo", true, false, false, "personal_turnos", 60],
  ["Publicidad", "marketing", "tarjeta", true, false, false, null, 140],
  ["Pago a proveedor", "insumos", "transferencia", false, true, false, "supplier_payment", 240],
  ["Otro", "operativo", "transferencia", true, false, true, "other_gasto", 900],
  ["IVA", "impuestos", "transferencia", false, true, false, null, 1020],
  ["Otro impuesto", "impuestos", "transferencia", false, true, true, "other_egreso", 1900],
];

const { data: existing, error: existingErr } = await supabase
  .from("tenants")
  .select("id, slug, kind")
  .eq("slug", SLUG)
  .maybeSingle();

if (existingErr) {
  console.error("tenants lookup:", existingErr.message);
  process.exit(1);
}

if (existing?.kind === "platform") {
  console.error(`El slug ${SLUG} está ocupado por el tenant de plataforma.`);
  process.exit(1);
}

let tenantId = existing?.id ?? null;

if (!tenantId) {
  const { data: created, error: createErr } = await supabase
    .from("tenants")
    .insert({
      slug: SLUG,
      name: NAME,
      status: "active",
      kind: "customer",
      account_holder_name: HOLDER,
      account_holder_email: EMAIL,
      brand,
      storefront_config: { checkout_mode: "transfer", invoice_layout: "letter" },
    })
    .select("id")
    .single();
  if (createErr || !created?.id) {
    console.error("insert tenant:", createErr?.message);
    process.exit(1);
  }
  tenantId = created.id;
  console.log("Tenant creado");
} else {
  const { error: updateErr } = await supabase
    .from("tenants")
    .update({
      name: NAME,
      status: "active",
      kind: "customer",
      account_holder_name: HOLDER,
      account_holder_email: EMAIL,
      brand,
    })
    .eq("id", tenantId);
  if (updateErr) {
    console.error("update tenant:", updateErr.message);
    process.exit(1);
  }
  console.log("Tenant ya existía; datos de pruebas actualizados");
}

const { data: branches, error: bErr } = await supabase
  .from("branches")
  .select("id, name, code, is_default")
  .eq("tenant_id", tenantId)
  .eq("is_active", true);
if (bErr) {
  console.error("branches:", bErr.message);
  process.exit(1);
}

if (!branches?.length) {
  const { error: insBranch } = await supabase.from("branches").insert({
    tenant_id: tenantId,
    name: "Principal",
    code: "principal",
    is_default: true,
  });
  if (insBranch) {
    console.error("insert branch:", insBranch.message);
    process.exit(1);
  }
  console.log("Sucursal Principal creada");
} else {
  console.log(
    `Sucursales: ${branches.map((b) => `${b.name} (${b.code})`).join(", ")}`,
  );
}

const { data: concepts, error: cErr } = await supabase
  .from("store_expense_concepts")
  .select("id")
  .eq("tenant_id", tenantId)
  .limit(1);
if (cErr) {
  console.error("expense concepts:", cErr.message);
  process.exit(1);
}
if (!concepts?.length) {
  const { error: insConcepts } = await supabase.from("store_expense_concepts").insert(
    expenseConcepts.map(
      ([
        name,
        category,
        default_payment_method,
        applies_to_gasto,
        applies_to_egreso,
        allows_custom_text,
        special_key,
        sort_order,
      ]) => ({
        tenant_id: tenantId,
        name,
        category,
        default_payment_method,
        applies_to_gasto,
        applies_to_egreso,
        allows_custom_text,
        special_key,
        sort_order,
        is_active: true,
        is_system: Boolean(special_key),
      }),
    ),
  );
  if (insConcepts) {
    console.error("insert concepts:", insConcepts.message);
    process.exit(1);
  }
  console.log("Conceptos de gasto semilla listos");
}

const { data: cats, error: catErr } = await supabase
  .from("categories")
  .select("id")
  .eq("tenant_id", tenantId)
  .limit(1);
if (catErr) {
  console.error("categories:", catErr.message);
  process.exit(1);
}
if (!cats?.length) {
  const { error: insCat } = await supabase.from("categories").insert({
    tenant_id: tenantId,
    name: "General",
    sort_order: 10,
  });
  if (insCat) {
    console.error("insert category:", insCat.message);
    process.exit(1);
  }
  console.log("Categoría General creada");
}

const { data: defaultBranch, error: dbErr } = await supabase
  .from("branches")
  .select("id")
  .eq("tenant_id", tenantId)
  .eq("is_default", true)
  .maybeSingle();
if (dbErr) {
  console.error("default branch:", dbErr.message);
  process.exit(1);
}
if (defaultBranch?.id) {
  const { data: walkIn } = await supabase
    .from("customers")
    .select("id")
    .eq("tenant_id", tenantId)
    .ilike("name", "Cliente Final")
    .maybeSingle();
  if (!walkIn?.id) {
    const { error: insCust } = await supabase.from("customers").insert({
      tenant_id: tenantId,
      branch_id: defaultBranch.id,
      name: "Cliente Final",
      source: "manual",
    });
    if (insCust) {
      console.error("insert customer:", insCust.message);
      process.exit(1);
    }
    console.log("Cliente Final creado");
  }
}

const { count: productCount, error: pErr } = await supabase
  .from("products")
  .select("id", { count: "exact", head: true })
  .eq("tenant_id", tenantId);
if (pErr) {
  console.error("products count:", pErr.message);
  process.exit(1);
}

console.log("");
console.log("Cuenta de pruebas lista");
console.log(`  tenant:   ${SLUG} (${tenantId})`);
console.log(`  productos: ${productCount ?? 0}`);
console.log("  picker:   https://productos.bereahouse.com/admin/cuentas");
console.log(`  tienda:   https://${SLUG}.productos.bereahouse.com`);
console.log("  admin:    entra desde Cuentas → Berea Tech (no uses Aleya ni Estación iPhone)");
