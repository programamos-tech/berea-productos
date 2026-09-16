#!/usr/bin/env node
/**
 * Llena SOLO el tenant `berea-tech` con datos de demostración.
 * No toca Aleya ni Estación iPhone.
 *
 *   node scripts/seed-berea-tech-demo.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const TENANT_SLUG = "berea-tech";
const STAFF_PASSWORD = "Pruebas2026!";
const DEMO_EMAIL_DOMAIN = "bereatech.demo";

function parseEnvFile(p) {
  const out = {};
  if (!existsSync(p)) return out;
  for (const line of readFileSync(p, "utf8").split("\n")) {
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

function loadEnv() {
  const parsed = parseEnvFile(join(root, ".env.local"));
  for (const [k, v] of Object.entries(parsed)) {
    if (!v || /\[SENSITIVE\]/i.test(v)) continue;
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function mulberry32(seed) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260916);

function pick(list) {
  return list[Math.floor(rand() * list.length)];
}

function money(pesos) {
  return Math.max(0, Math.round(pesos));
}

function bogotaYmd(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function atBogotaHour(ymd, hour, minute = 0) {
  return new Date(`${ymd}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-05:00`);
}

function daysAgoYmd(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return bogotaYmd(d);
}

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

function perms(role) {
  const all = Object.fromEntries(PERMISSION_KEYS.map((k) => [k, true]));
  const none = Object.fromEntries(PERMISSION_KEYS.map((k) => [k, false]));
  if (role === "admin") {
    all.reportes_tienda = false;
    return all;
  }
  if (role === "inventory") {
    return {
      ...none,
      inventario_ver: true,
      productos_crear: true,
      productos_editar: true,
      categorias_gestionar: true,
      stock_actualizar: true,
    };
  }
  return {
    ...none,
    ventas_ver: true,
    ventas_crear: true,
    clientes_ver: true,
    clientes_crear: true,
    clientes_editar: true,
    egresos_ver: true,
    egresos_crear: true,
    proveedores_ver: true,
    inventario_ver: true,
    kits_ver: true,
    caja_ver: true,
    caja_gestionar: true,
    actividades_ver: true,
  };
}

async function must(label, result) {
  if (result.error) {
    console.error(`${label}:`, result.error.message);
    process.exit(1);
  }
  return result.data;
}

async function countTenant(table, tenantId) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);
  if (error) throw new Error(`${table} count: ${error.message}`);
  return count ?? 0;
}

async function findAuthUserByEmail(email) {
  const want = email.toLowerCase();
  let page = 1;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const users = data.users ?? [];
    const hit = users.find((u) => u.email?.toLowerCase() === want);
    if (hit) return hit;
    if (users.length < 200) return null;
    page += 1;
    if (page > 30) return null;
  }
}

async function upsertStaffUser({ email, displayName, username, jobRole, tenantId }) {
  const existing = await findAuthUserByEmail(email);
  let userId = existing?.id;
  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: STAFF_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: displayName, login_username: username },
      app_metadata: {
        ...(existing.app_metadata ?? {}),
        tenant_id: tenantId,
        tenant_slug: TENANT_SLUG,
        is_platform_operator: false,
      },
    });
    if (error) throw error;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: STAFF_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: displayName, login_username: username },
      app_metadata: {
        tenant_id: tenantId,
        tenant_slug: TENANT_SLUG,
        is_platform_operator: false,
      },
    });
    if (error || !data.user) throw error ?? new Error("createUser");
    userId = data.user.id;
  }

  const { error: pErr } = await supabase.from("profiles").upsert(
    {
      id: userId,
      role: "admin",
      display_name: displayName,
      login_username: username,
      public_email: email,
      job_role: jobRole,
      permissions: perms(jobRole),
      avatar_variant: "A",
      is_active: true,
      tenant_id: tenantId,
      is_platform_operator: false,
    },
    { onConflict: "id" },
  );
  if (pErr) throw pErr;
  return userId;
}

const { data: tenant, error: tenantErr } = await supabase
  .from("tenants")
  .select("id, slug, kind, name")
  .eq("slug", TENANT_SLUG)
  .maybeSingle();

if (tenantErr || !tenant?.id) {
  console.error("No existe el tenant berea-tech.");
  process.exit(1);
}
if (tenant.slug !== TENANT_SLUG || tenant.kind !== "customer") {
  console.error("Abortado: el tenant no es la cuenta de pruebas.");
  process.exit(1);
}

const tenantId = tenant.id;

const { data: aleyaBefore } = await supabase
  .from("tenants")
  .select("id")
  .eq("slug", "aleya")
  .maybeSingle();
const aleyaId = aleyaBefore?.id ?? null;
const aleyaProductsBefore = aleyaId ? await countTenant("products", aleyaId) : null;
const aleyaOrdersBefore = aleyaId ? await countTenant("orders", aleyaId) : null;

console.log(`Sembrando ${tenant.name} (${tenantId})`);

const existingBranches = await must(
  "branches",
  await supabase
    .from("branches")
    .select("id, name, code, is_default")
    .eq("tenant_id", tenantId),
);

let principal = (existingBranches ?? []).find((b) => b.is_default) ?? (existingBranches ?? [])[0];
if (!principal) {
  principal = await must(
    "principal",
    await supabase
      .from("branches")
      .insert({
        tenant_id: tenantId,
        name: "Principal",
        code: "principal",
        is_default: true,
      })
      .select("id, name, code, is_default")
      .single(),
  );
}

async function ensureBranch(name, code) {
  const found = (existingBranches ?? []).find((b) => b.code === code);
  if (found) return found;
  return must(
    code,
    await supabase
      .from("branches")
      .insert({ tenant_id: tenantId, name, code, is_default: false })
      .select("id, name, code, is_default")
      .single(),
  );
}

const norte = await ensureBranch("Norte", "norte");
const bodega = await ensureBranch("Bodega", "bodega");
const branches = [principal, norte, bodega];
const branchByCode = Object.fromEntries(branches.map((b) => [b.code, b]));

console.log("Limpiando datos previos de berea-tech…");

const wipe = [
  "admin_activity_log",
  "store_expenses",
  "cash_register_sessions",
  "order_items",
  "orders",
  "customers",
  "branch_inventory",
  "products",
  "categories",
];
for (const table of wipe) {
  const { error } = await supabase.from(table).delete().eq("tenant_id", tenantId);
  if (error) {
    console.error(`wipe ${table}:`, error.message);
    process.exit(1);
  }
}

const { data: oldStaff } = await supabase
  .from("profiles")
  .select("id, public_email")
  .eq("tenant_id", tenantId)
  .eq("is_platform_operator", false);
for (const row of oldStaff ?? []) {
  await supabase.from("profile_branch_memberships").delete().eq("profile_id", row.id);
  await supabase.from("profiles").delete().eq("id", row.id);
  if (String(row.public_email ?? "").endsWith(`@${DEMO_EMAIL_DOMAIN}`)) {
    await supabase.auth.admin.deleteUser(row.id);
  }
}

const staff = {
  admin: await upsertStaffUser({
    email: `laura.admin@${DEMO_EMAIL_DOMAIN}`,
    displayName: "Laura Méndez",
    username: "laura",
    jobRole: "admin",
    tenantId,
  }),
  sales: await upsertStaffUser({
    email: `andres.venta@${DEMO_EMAIL_DOMAIN}`,
    displayName: "Andrés Ríos",
    username: "andres",
    jobRole: "sales",
    tenantId,
  }),
  inventory: await upsertStaffUser({
    email: `camila.inventario@${DEMO_EMAIL_DOMAIN}`,
    displayName: "Camila Soto",
    username: "camila",
    jobRole: "inventory",
    tenantId,
  }),
};

await must(
  "memberships",
  await supabase.from("profile_branch_memberships").insert([
    { profile_id: staff.sales, branch_id: principal.id },
    { profile_id: staff.sales, branch_id: norte.id },
    { profile_id: staff.inventory, branch_id: principal.id },
    { profile_id: staff.inventory, branch_id: norte.id },
    { profile_id: staff.inventory, branch_id: bodega.id },
  ]),
);

const categoryRows = [
  { name: "Software", sort_order: 10, icon_key: "sparkles" },
  { name: "Hardware", sort_order: 20, icon_key: "thermometer" },
  { name: "Cursos", sort_order: 30, icon_key: "hand-heart" },
  { name: "Accesorios", sort_order: 40, icon_key: "shopping-bag" },
  { name: "Soporte", sort_order: 50, icon_key: "tag" },
];
const categories = await must(
  "categories",
  await supabase
    .from("categories")
    .insert(categoryRows.map((c) => ({ ...c, tenant_id: tenantId })))
    .select("id, name"),
);
const cat = Object.fromEntries((categories ?? []).map((c) => [c.name, c.id]));

const productDefs = [
  ["Software", "BT-SW-001", "Microsoft 365 Empresa", "Licencia anual 5 usuarios", "Microsoft", 189000, 92000, true],
  ["Software", "BT-SW-002", "Adobe Creative Cloud", "Plan anual fotografía y diseño", "Adobe", 420000, 250000, true],
  ["Software", "BT-SW-003", "Windows 11 Pro", "Licencia OEM digital", "Microsoft", 159000, 78000, true],
  ["Software", "BT-SW-004", "Antivirus Bitdefender", "3 dispositivos / 1 año", "Bitdefender", 89000, 41000, true],
  ["Software", "BT-SW-005", "Notion Plus equipo", "Workspace anual 8 puestos", "Notion", 129000, 60000, false],
  ["Software", "BT-SW-006", "Canva Pro Educativo", "Licencia colegio 12 meses", "Canva", 99000, 45000, true],
  ["Hardware", "BT-HW-001", "Laptop Lenovo IdeaPad 15", "Ryzen 5 / 16 GB / 512 SSD", "Lenovo", 2499000, 1980000, true],
  ["Hardware", "BT-HW-002", "Monitor LG 27 4K", "USB-C 65 W", "LG", 1299000, 980000, true],
  ["Hardware", "BT-HW-003", "Teclado mecánico Keychron", "Switch brown, layout ES", "Keychron", 389000, 240000, true],
  ["Hardware", "BT-HW-004", "Mouse Logitech MX Master", "Inalámbrico grafito", "Logitech", 429000, 310000, true],
  ["Hardware", "BT-HW-005", "Dock USB-C 8 en 1", "HDMI 4K + Ethernet", "Anker", 189000, 98000, true],
  ["Hardware", "BT-HW-006", "Webcam Logitech Brio", "4K con micrófono", "Logitech", 799000, 560000, false],
  ["Cursos", "BT-CU-001", "Curso Excel avanzado", "16 horas, certificado", "Berea Escuela", 280000, 40000, true],
  ["Cursos", "BT-CU-002", "Curso Python para negocios", "24 horas virtuales", "Berea Escuela", 450000, 60000, true],
  ["Cursos", "BT-CU-003", "Taller de ciberseguridad", "Jornada sábado 8 h", "Berea Escuela", 190000, 35000, true],
  ["Cursos", "BT-CU-004", "Mentoría founders", "4 sesiones 1 a 1", "Berea Escuela", 620000, 80000, true],
  ["Cursos", "BT-CU-005", "Onboarding Notion + IA", "Taller interno 4 h", "Berea Escuela", 150000, 25000, true],
  ["Accesorios", "BT-AC-001", "Cable USB-C 2 m", "Carga 100 W", "Anker", 49000, 18000, true],
  ["Accesorios", "BT-AC-002", "Hub USB-C slim", "4 puertos", "Baseus", 79000, 32000, true],
  ["Accesorios", "BT-AC-003", "Funda laptop 15", "Neopreno gris", "Berea", 65000, 22000, true],
  ["Accesorios", "BT-AC-004", "Soporte monitor aluminio", "Altura ajustable", "Berea", 119000, 48000, true],
  ["Accesorios", "BT-AC-005", "Audífonos Sony WH-CH720", "Bluetooth ANC", "Sony", 449000, 310000, true],
  ["Soporte", "BT-SO-001", "Hora de soporte remoto", "Mesa de ayuda", "Berea Tech", 85000, 0, true],
  ["Soporte", "BT-SO-002", "Visita técnica Cali", "Desplazamiento incluido", "Berea Tech", 180000, 0, true],
  ["Soporte", "BT-SO-003", "Mantenimiento preventivo PC", "Limpieza + backup", "Berea Tech", 120000, 25000, true],
  ["Soporte", "BT-SO-004", "Migración a Microsoft 365", "Hasta 10 buzones", "Berea Tech", 890000, 120000, true],
];

const products = await must(
  "products",
  await supabase
    .from("products")
    .insert(
      productDefs.map((d) => {
        const [catName, reference, name, description, brand, price, cost, published] = d;
        return {
          tenant_id: tenantId,
          category_id: cat[catName],
          reference,
          name,
          description,
          brand,
          price_cents: money(price),
          cost_cents: money(cost),
          cost_gross_cents: money(Math.round(cost * 1.19)),
          currency: "COP",
          is_published: published,
          has_vat: true,
          vat_percent: 19,
          stock_local: 0,
          stock_warehouse: 0,
        };
      }),
    )
    .select("id, name, reference, price_cents, category_id"),
);

const inventoryRows = [];
for (const p of products ?? []) {
  const isService = String(p.reference).startsWith("BT-SO") || String(p.reference).startsWith("BT-CU");
  for (const b of branches) {
    let qty = 0;
    if (isService) qty = b.code === "bodega" ? 0 : 40 + Math.floor(rand() * 20);
    else if (b.code === "bodega") qty = 18 + Math.floor(rand() * 25);
    else if (b.code === "norte") qty = 6 + Math.floor(rand() * 10);
    else qty = 8 + Math.floor(rand() * 14);
    inventoryRows.push({
      tenant_id: tenantId,
      branch_id: b.id,
      product_id: p.id,
      quantity: qty,
    });
  }
}
const { error: invErr } = await supabase.from("branch_inventory").upsert(inventoryRows, {
  onConflict: "branch_id,product_id",
});
if (invErr) {
  console.error("inventory:", invErr.message);
  process.exit(1);
}

const customerSeeds = [
  ["Ana Torres", "ana.torres@correo.co", "3001112233", "retail", principal.code, "Cali"],
  ["Diego Vargas", "diego.vargas@correo.co", "3002223344", "retail", principal.code, "Cali"],
  ["Valentina Ruiz", "valen.ruiz@correo.co", "3013334455", "retail", norte.code, "Cali"],
  ["Santiago Mora", "santi.mora@correo.co", "3024445566", "retail", principal.code, "Palmira"],
  ["Carolina Peña", "caro.pena@correo.co", "3105556677", "retail", norte.code, "Cali"],
  ["Julián Castro", "julian.castro@correo.co", "3116667788", "retail", principal.code, "Yumbo"],
  ["Manuela Ortiz", "manu.ortiz@correo.co", "3127778899", "retail", norte.code, "Cali"],
  ["Felipe Gómez", "felipe.gomez@correo.co", "3138889900", "retail", principal.code, "Cali"],
  ["Natalia Herrera", "nata.herrera@correo.co", "3149990011", "retail", norte.code, "Jamundí"],
  ["Camilo León", "camilo.leon@correo.co", "3150001122", "retail", principal.code, "Cali"],
  ["Escuela Andina SAS", "compras@andina.edu.co", "6024455667", "wholesale", principal.code, "Cali"],
  ["Colegio del Río", "sistemas@colegiodelrio.edu.co", "6027788990", "wholesale", norte.code, "Cali"],
  ["Taller Nova", "nova@taller.co", "3001212121", "retail", principal.code, "Cali"],
  ["María Isabel Cano", "mariaisabel@correo.co", "3161231234", "retail", norte.code, "Cali"],
  ["Ricardo Mejía", "ricardo.mejia@correo.co", "3172342345", "retail", principal.code, "Cali"],
  ["Laura Palacios", "laura.palacios@correo.co", "3183453456", "retail", norte.code, "Cali"],
  ["Agencia Pixel", "hola@pixel.agency", "3194564567", "wholesale", principal.code, "Cali"],
  ["Juan Pablo Díaz", "jp.diaz@correo.co", "3205675678", "retail", principal.code, "Cali"],
];

const customers = await must(
  "customers",
  await supabase
    .from("customers")
    .insert(
      customerSeeds.map((c, idx) => {
        const [name, email, phone, kind, branchCode, city] = c;
        const wholesale = kind === "wholesale";
        return {
          tenant_id: tenantId,
          branch_id: branchByCode[branchCode].id,
          name,
          email,
          phone,
          document_type: wholesale ? "nit" : "cc",
          document_id: wholesale ? `90122${1000 + idx}` : `1143${400000 + idx}`,
          customer_kind: kind,
          wholesale_discount_percent: wholesale ? 8 : 0,
          shipping_city: city,
          shipping_address: `Calle ${10 + idx} # ${idx + 2}-20`,
          source: "manual",
          notes: wholesale ? "Cuenta corporativa de pruebas" : null,
        };
      }),
    )
    .select("id, name, email, branch_id, customer_kind"),
);

const walkIn = await must(
  "walk-in",
  await supabase
    .from("customers")
    .insert({
      tenant_id: tenantId,
      branch_id: principal.id,
      name: "Cliente Final",
      source: "manual",
      customer_kind: "retail",
      document_type: "cc",
    })
    .select("id, name, email, branch_id, customer_kind")
    .single(),
);

const allCustomers = [...(customers ?? []), walkIn];
const retailCustomers = allCustomers.filter((c) => c.customer_kind !== "wholesale");

const paymentMix = ["cash", "cash", "cash", "transfer", "transfer", "mixed"];
const shopBranches = [principal, norte, principal, principal, norte];

function buildSale(dayOffset) {
  const ymd = daysAgoYmd(dayOffset);
  const hour = 9 + Math.floor(rand() * 9);
  const created = atBogotaHour(ymd, hour, Math.floor(rand() * 50));
  const branch = pick(shopBranches);
  const eligible = allCustomers.filter((c) => c.branch_id === branch.id);
  if (!eligible.length) return null;
  const customer = pick(eligible);
  const lineCount = 1 + Math.floor(rand() * 3);
  const lines = [];
  const used = new Set();
  for (let i = 0; i < lineCount; i += 1) {
    const product = pick(products);
    if (used.has(product.id)) continue;
    used.add(product.id);
    const qty = 1 + Math.floor(rand() * 2);
    lines.push({
      product_id: product.id,
      quantity: qty,
      unit_price_cents: product.price_cents,
      product_name_snapshot: product.name,
      tenant_id: tenantId,
      branch_id: branch.id,
    });
  }
  if (!lines.length) return null;
  const total = lines.reduce((s, l) => s + l.unit_price_cents * l.quantity, 0);
  const method = pick(paymentMix);
  const mixedCash = method === "mixed" ? Math.round(total * 0.4) : null;
  const cancelled = rand() < 0.06;
  return {
    order: {
      tenant_id: tenantId,
      branch_id: branch.id,
      status: cancelled ? "cancelled" : "paid",
      customer_id: customer.id,
      customer_name: customer.name,
      customer_email: customer.email || `pos-${customer.id.slice(0, 8)}@local.invalid`,
      total_cents: total,
      currency: "COP",
      checkout_payment_method: method === "transfer" ? "transfer" : "wompi",
      wompi_reference: cancelled ? "POS:cash" : `POS:${method}`,
      pos_mixed_cash_cents: method === "mixed" && !cancelled ? mixedCash : null,
      pos_mixed_transfer_cents:
        method === "mixed" && !cancelled ? total - mixedCash : null,
      fulfillment_status: cancelled ? null : "completed",
      cancellation_reason: cancelled ? "Cliente desistió de la compra" : null,
      created_at: created.toISOString(),
      updated_at: created.toISOString(),
    },
    lines,
    ymd,
    method: cancelled ? "cash" : method,
    cancelled,
    actor: pick([staff.sales, staff.admin]),
  };
}

const sales = [];
for (let day = 1; day <= 18; day += 1) {
  const n = day <= 2 ? 4 : 2 + Math.floor(rand() * 3);
  for (let i = 0; i < n; i += 1) {
    const sale = buildSale(day);
    if (sale) sales.push(sale);
  }
}

const insertedOrders = await must(
  "orders",
  await supabase.from("orders").insert(sales.map((s) => s.order)).select("id"),
);

const itemRows = [];
(insertedOrders ?? []).forEach((row, i) => {
  for (const line of sales[i].lines) {
    itemRows.push({ ...line, order_id: row.id });
  }
});
await must("order_items", await supabase.from("order_items").insert(itemRows));

const quotation = buildSale(0);
if (quotation) {
  quotation.order.status = "quotation";
  quotation.order.wompi_reference = "POS:quotation";
  quotation.order.fulfillment_status = null;
  quotation.order.checkout_payment_method = "wompi";
  quotation.cancelled = false;
  const qRow = await must(
    "quotation",
    await supabase.from("orders").insert(quotation.order).select("id").single(),
  );
  await must(
    "quotation items",
    await supabase.from("order_items").insert(
      quotation.lines.map((line) => ({ ...line, order_id: qRow.id })),
    ),
  );
}

const expenseDays = [1, 2, 3, 5, 7, 8, 10, 12, 14];
const dailyExpenses = expenseDays.flatMap((day, i) => {
  const ymd = daysAgoYmd(day);
  const branch = i % 2 === 0 ? principal : norte;
  return [
    {
      tenant_id: tenantId,
      branch_id: branch.id,
      concept: i % 3 === 0 ? "Publicidad" : "Material/insumos y papelería",
      category: i % 3 === 0 ? "marketing" : "insumos",
      amount_cents: money(i % 3 === 0 ? 45000 : 28000),
      payment_method: i % 2 === 0 ? "efectivo" : "transferencia",
      expense_kind: "gasto",
      expense_scope: "diario",
      expense_date: ymd,
      notes: "Gasto de demostración Berea Tech",
    },
  ];
});
const monthlyExpenses = [
  {
    tenant_id: tenantId,
    branch_id: principal.id,
    concept: "Arriendo",
    category: "fijo",
    amount_cents: money(2800000),
    payment_method: "transferencia",
    expense_kind: "gasto",
    expense_scope: "mensual",
    expense_date: daysAgoYmd(4),
    notes: "Local Principal — demo",
  },
  {
    tenant_id: tenantId,
    branch_id: norte.id,
    concept: "Servicio público",
    category: "servicios",
    amount_cents: money(420000),
    payment_method: "transferencia",
    expense_kind: "gasto",
    expense_scope: "mensual",
    expense_date: daysAgoYmd(6),
    notes: "Energía Norte — demo",
  },
  {
    tenant_id: tenantId,
    branch_id: principal.id,
    concept: "IVA",
    category: "impuestos",
    amount_cents: money(860000),
    payment_method: "transferencia",
    expense_kind: "egreso",
    expense_scope: "mensual",
    expense_date: daysAgoYmd(9),
    notes: "Declaración demo",
  },
];
await must(
  "expenses",
  await supabase.from("store_expenses").insert([...dailyExpenses, ...monthlyExpenses]),
);

function salesForDay(branchId, ymd) {
  return sales.filter((s) => s.ymd === ymd && s.order.branch_id === branchId && !s.cancelled);
}

const cashRows = [];
for (const branch of [principal, norte]) {
  const closedDays = branch.code === "principal" ? 14 : 9;
  for (let day = 1; day <= closedDays; day += 1) {
    const ymd = daysAgoYmd(day);
    const daySales = salesForDay(branch.id, ymd);
    let cash = 0;
    let transfer = 0;
    let mixed = 0;
    let units = 0;
    for (const s of daySales) {
      units += s.lines.reduce((n, l) => n + l.quantity, 0);
      if (s.method === "cash") cash += s.order.total_cents;
      else if (s.method === "transfer") transfer += s.order.total_cents;
      else mixed += s.order.total_cents;
    }
    const expensesCash = dailyExpenses
      .filter((e) => e.branch_id === branch.id && e.expense_date === ymd && e.payment_method === "efectivo")
      .reduce((s, e) => s + e.amount_cents, 0);
    const expensesOther = dailyExpenses
      .filter((e) => e.branch_id === branch.id && e.expense_date === ymd && e.payment_method !== "efectivo")
      .reduce((s, e) => s + e.amount_cents, 0);
    const opening = 200000;
    const expected = opening + cash - expensesCash;
    const counted = expected + Math.round((rand() - 0.5) * 20000);
    cashRows.push({
      tenant_id: tenantId,
      branch_id: branch.id,
      business_day: ymd,
      status: "closed",
      opening_float_cents: opening,
      opened_at: atBogotaHour(ymd, 8, 5).toISOString(),
      opened_by: staff.sales,
      closed_at: atBogotaHour(ymd, 19, 10).toISOString(),
      closed_by: staff.admin,
      sales_count: daySales.length,
      sales_total_cents: cash + transfer + mixed,
      sales_cash_cents: cash,
      sales_transfer_cents: transfer,
      sales_mixed_cents: mixed,
      sales_other_cents: 0,
      expenses_cash_cents: expensesCash,
      expenses_other_cents: expensesOther,
      expected_cash_cents: expected,
      counted_cash_cents: counted,
      cash_difference_cents: counted - expected,
      units_sold: units,
      stock_out_lines: [],
      expense_lines: dailyExpenses
        .filter((e) => e.branch_id === branch.id && e.expense_date === ymd)
        .map((e) => ({
          id: randomUUID(),
          concept: e.concept,
          payment_method: e.payment_method,
          amount_cents: e.amount_cents,
        })),
      notes: "Cierre de demostración",
    });
  }
}

const today = daysAgoYmd(0);
cashRows.push({
  tenant_id: tenantId,
  branch_id: principal.id,
  business_day: today,
  status: "open",
  opening_float_cents: 250000,
  opened_at: atBogotaHour(today, 8, 12).toISOString(),
  opened_by: staff.sales,
  sales_count: null,
  sales_total_cents: null,
  sales_cash_cents: null,
  sales_transfer_cents: null,
  sales_mixed_cents: null,
  sales_other_cents: null,
  expenses_cash_cents: null,
  expenses_other_cents: null,
  expected_cash_cents: null,
  counted_cash_cents: null,
  cash_difference_cents: null,
  units_sold: null,
  stock_out_lines: [],
  expense_lines: [],
  notes: "Turno abierto de pruebas",
});

await must("cash", await supabase.from("cash_register_sessions").insert(cashRows));

const activities = [];
for (const p of (products ?? []).slice(0, 12)) {
  activities.push({
    tenant_id: tenantId,
    branch_id: principal.id,
    actor_id: staff.inventory,
    action_type: "product_created",
    entity_type: "product",
    entity_id: p.id,
    summary: `Creó el producto ${p.name}`,
    metadata: { reference: p.reference },
    created_at: atBogotaHour(daysAgoYmd(16), 10, 12).toISOString(),
  });
}
for (const c of (customers ?? []).slice(0, 10)) {
  activities.push({
    tenant_id: tenantId,
    branch_id: c.branch_id,
    actor_id: staff.sales,
    action_type: "customer_created",
    entity_type: "customer",
    entity_id: c.id,
    summary: `Registró al cliente ${c.name}`,
    metadata: {},
    created_at: atBogotaHour(daysAgoYmd(15), 11, 20).toISOString(),
  });
}
(insertedOrders ?? []).forEach((row, i) => {
  const sale = sales[i];
  activities.push({
    tenant_id: tenantId,
    branch_id: sale.order.branch_id,
    actor_id: sale.actor,
    action_type: sale.cancelled ? "sale_cancelled" : "sale_created",
    entity_type: "order",
    entity_id: row.id,
    summary: sale.cancelled
      ? `Anuló la venta de ${sale.order.customer_name}`
      : `Registró venta a ${sale.order.customer_name}`,
    metadata: { total_cents: sale.order.total_cents },
    created_at: sale.order.created_at,
  });
});
for (const session of cashRows) {
  activities.push({
    tenant_id: tenantId,
    branch_id: session.branch_id,
    actor_id: session.opened_by,
    action_type: "cash_session_opened",
    entity_type: "cash_session",
    entity_id: null,
    summary: `Abrió caja del ${session.business_day}`,
    metadata: { business_day: session.business_day },
    created_at: session.opened_at,
  });
  if (session.status === "closed") {
    activities.push({
      tenant_id: tenantId,
      branch_id: session.branch_id,
      actor_id: session.closed_by,
      action_type: "cash_session_closed",
      entity_type: "cash_session",
      entity_id: null,
      summary: `Cerró caja del ${session.business_day}`,
      metadata: { business_day: session.business_day },
      created_at: session.closed_at,
    });
  }
}
await must("activity", await supabase.from("admin_activity_log").insert(activities));

const aleyaProductsAfter = aleyaId ? await countTenant("products", aleyaId) : null;
const aleyaOrdersAfter = aleyaId ? await countTenant("orders", aleyaId) : null;
if (
  aleyaProductsBefore != null &&
  (aleyaProductsAfter !== aleyaProductsBefore || aleyaOrdersAfter !== aleyaOrdersBefore)
) {
  console.error("ABORTADO: cambió el conteo de Aleya. Revisa el seed.");
  process.exit(1);
}

const summary = {
  sucursales: branches.length,
  categorias: await countTenant("categories", tenantId),
  productos: await countTenant("products", tenantId),
  clientes: await countTenant("customers", tenantId),
  ventas: await countTenant("orders", tenantId),
  gastos: await countTenant("store_expenses", tenantId),
  cajas: await countTenant("cash_register_sessions", tenantId),
  actividades: await countTenant("admin_activity_log", tenantId),
};

console.log("");
console.log("Berea Tech listo (Aleya intacta)");
console.log(summary);
console.log("");
console.log("Equipo de pruebas (misma clave):");
console.log(`  ${STAFF_PASSWORD}`);
console.log(`  laura.admin@${DEMO_EMAIL_DOMAIN}     · Administradora`);
console.log(`  andres.venta@${DEMO_EMAIL_DOMAIN}    · Venta`);
console.log(`  camila.inventario@${DEMO_EMAIL_DOMAIN} · Inventario`);
console.log("");
console.log("Entrá con el operador a Cuentas → Berea Tech.");
