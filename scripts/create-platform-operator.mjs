#!/usr/bin/env node
/**
 * Crea el operador de plataforma berea@housetech.com en el tenant `berea`.
 * No aparece en Equipo de las cuentas cliente.
 *
 *   node scripts/create-platform-operator.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

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

const EMAIL = "berea@housetech.com";
const PERMISSION_KEYS = [
  "inicio_reportes",
  "reportes_tienda",
  "ventas_ver",
  "ventas_crear",
  "clientes_ver",
  "clientes_crear",
  "clientes_editar",
  "egresos_ver",
  "egresos_crear",
  "proveedores_ver",
  "inventario_ver",
  "productos_crear",
  "productos_editar",
  "categorias_gestionar",
  "stock_actualizar",
  "stock_transferir",
  "caja_ver",
  "caja_gestionar",
  "roles_ver",
  "colaboradores_gestionar",
  "sucursales_ver",
  "sucursales_gestionar",
  "actividades_ver",
  "marketing_ver",
  "ajustes_tienda_ver",
  "kits_ver",
  "kits_gestionar",
];

function defaultPermissionsOwner() {
  const m = {};
  for (const k of PERMISSION_KEYS) m[k] = true;
  return m;
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findAuthUserByEmail(target) {
  const want = target.toLowerCase();
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    const users = data.users ?? [];
    const hit = users.find((u) => u.email?.toLowerCase() === want);
    if (hit) return hit;
    if (users.length < perPage) return null;
    page += 1;
    if (page > 50) return null;
  }
}

const { data: tenant, error: tErr } = await supabase
  .from("tenants")
  .select("id, slug")
  .eq("slug", "berea")
  .maybeSingle();

if (tErr || !tenant?.id) {
  console.error("Tenant plataforma `berea` no encontrado:", tErr?.message);
  process.exit(1);
}

const password = randomBytes(12).toString("base64url");
const existing = await findAuthUserByEmail(EMAIL);
let userId;

if (existing) {
  const { error: uErr } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
    app_metadata: {
      ...(existing.app_metadata ?? {}),
      tenant_id: tenant.id,
      tenant_slug: "berea",
      is_platform_operator: true,
    },
    user_metadata: {
      ...(existing.user_metadata ?? {}),
      display_name: "Berea House",
      login_username: "berea",
    },
  });
  if (uErr) {
    console.error("updateUser:", uErr.message);
    process.exit(1);
  }
  userId = existing.id;
} else {
  const { data: created, error: cErr } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password,
    email_confirm: true,
    app_metadata: {
      tenant_id: tenant.id,
      tenant_slug: "berea",
      is_platform_operator: true,
    },
    user_metadata: {
      display_name: "Berea House",
      login_username: "berea",
    },
  });
  if (cErr || !created.user) {
    console.error("createUser:", cErr?.message);
    process.exit(1);
  }
  userId = created.user.id;
}

const { error: pErr } = await supabase.from("profiles").upsert(
  {
    id: userId,
    role: "admin",
    display_name: "Berea House",
    login_username: "berea",
    public_email: EMAIL,
    job_role: "owner",
    permissions: defaultPermissionsOwner(),
    avatar_variant: "A",
    is_active: true,
    tenant_id: tenant.id,
    is_platform_operator: true,
  },
  { onConflict: "id" },
);

if (pErr) {
  console.error("profiles:", pErr.message);
  process.exit(1);
}

console.log("Operador listo");
console.log(`  email:    ${EMAIL}`);
console.log(`  password: ${password}`);
console.log(`  tenant:   ${tenant.slug} (${tenant.id})`);
console.log("  login:    https://productos.bereahouse.com/admin/login");
