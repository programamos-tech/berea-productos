#!/usr/bin/env node
/**
 * Migra Estación iPhone (Nou org) → tenant `estacion-iphone` en Berea Productos.
 *
 * Pasa: categorías, usuarios (Isaac owner + María admin), productos+stock, ventas.
 * Productos quedan `is_published=false` (POS/admin sí; aleyashop.net no los lista).
 *
 *   node scripts/migrate-estacion-iphone.mjs
 *
 * Credenciales:
 *   Berea: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *          (o BEREA_SUPABASE_URL / BEREA_SUPABASE_SERVICE_ROLE_KEY)
 *   Nou:   NOU_SUPABASE_URL + NOU_SUPABASE_SERVICE_ROLE_KEY
 *          o el .env.local de nou/berea-tech
 */

import { createClient } from "@supabase/supabase-js";
import { randomBytes, randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const ISAAC_ORG_ID = "9fd9cc05-ff94-44ed-a9ee-7087e01338cc";
const ISAAC_BRANCH_ID = "06c2f39f-cbb3-4f74-89e6-9913422becb1";
const TENANT_SLUG = "estacion-iphone";

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

function allTrue() {
  const m = {};
  for (const k of PERMISSION_KEYS) m[k] = true;
  return m;
}

function defaultPermissionsAdmin() {
  const m = allTrue();
  m.reportes_tienda = false;
  return m;
}

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

function loadEnvIntoProcess(p, { overwrite = false } = {}) {
  const parsed = parseEnvFile(p);
  for (const [k, v] of Object.entries(parsed)) {
    if (!v || /\[SENSITIVE\]/i.test(v)) continue;
    if (!process.env[k] || overwrite) process.env[k] = v;
  }
}

function pesosToCents(v) {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
}

function randomPassword() {
  return randomBytes(12).toString("base64url");
}

function slugUsername(name) {
  const base = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 32)
    .trim();
  return base.length > 0 ? base : "usuario";
}

async function fetchAll(client, table, columns, apply) {
  const pageSize = 1000;
  let from = 0;
  const all = [];
  for (;;) {
    let q = client.from(table).select(columns).range(from, from + pageSize - 1);
    if (apply) q = apply(q);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

async function insertChunks(client, table, rows, chunkSize = 80) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await client.from(table).insert(chunk);
    if (error) {
      throw new Error(`${table} insert @${i}: ${error.message}`);
    }
  }
}

function posRef(method) {
  const m = String(method ?? "").toLowerCase();
  if (m === "cash" || m === "efectivo") return "POS:cash";
  if (m === "transfer" || m === "transferencia") return "POS:transfer";
  if (m === "mixed" || m === "mixto") return "POS:mixed";
  return "POS:cash";
}

function saleStatus(raw) {
  const s = String(raw ?? "").toLowerCase();
  if (s === "cancelled" || s === "canceled" || s === "anulada") return "cancelled";
  return "paid";
}

async function main() {
  loadEnvIntoProcess(join(root, ".env.production.local"));
  loadEnvIntoProcess(join(root, ".env.local"), { overwrite: true });

  const bereaUrl =
    process.env.BEREA_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const bereaKey =
    process.env.BEREA_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  const nouLocal = parseEnvFile(
    join("/Users/programamos.st/Developer/nou/berea-tech", ".env.local"),
  );
  let nouUrl = process.env.NOU_SUPABASE_URL || nouLocal.NEXT_PUBLIC_SUPABASE_URL;
  let nouKey =
    process.env.NOU_SUPABASE_SERVICE_ROLE_KEY || nouLocal.SUPABASE_SERVICE_ROLE_KEY;

  if (!nouUrl || /127\.0\.0\.1|localhost/.test(nouUrl)) {
    const solucion = join(
      "/Users/programamos.st/Developer/nou/berea-tech",
      "SOLUCION_ERROR_ORGANIZACION.md",
    );
    if (existsSync(solucion)) {
      const md = readFileSync(solucion, "utf8");
      nouUrl =
        (md.match(/NEXT_PUBLIC_SUPABASE_URL`\s*=\s*`([^`]+)`/) || [])[1] || nouUrl;
      nouKey =
        (md.match(/SUPABASE_SERVICE_ROLE_KEY`\s*=\s*`([^`]+)`/) || [])[1] || nouKey;
    }
  }

  if (!bereaUrl || !bereaKey) {
    throw new Error("Faltan credenciales Berea (URL + service role)");
  }
  if (!nouUrl || !nouKey) {
    throw new Error("Faltan credenciales Nou (NOU_SUPABASE_* o nou .env.local)");
  }
  if (/127\.0\.0\.1|localhost/.test(nouUrl)) {
    throw new Error("Nou sigue en localhost; no se encontró URL de producción.");
  }
  if (/127\.0\.0\.1|localhost/.test(bereaUrl)) {
    throw new Error(
      `Berea apunta a ${bereaUrl}. Usa .env.production.local o BEREA_SUPABASE_URL.`,
    );
  }

  const berea = createClient(bereaUrl, bereaKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const nou = createClient(nouUrl, nouKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existingTenant, error: tLookupErr } = await berea
    .from("tenants")
    .select("id, slug")
    .eq("slug", TENANT_SLUG)
    .maybeSingle();
  if (tLookupErr) throw new Error(tLookupErr.message);

  if (existingTenant?.id) {
    const { count } = await berea
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", existingTenant.id);
    if ((count ?? 0) > 0 && process.argv.includes("--force") === false) {
      console.log(
        `Tenant ${TENANT_SLUG} ya tiene ${count} productos. Usa --force para repetir.`,
      );
      return;
    }
  }

  console.log("Nou host", new URL(nouUrl).host);

  let orgId = ISAAC_ORG_ID;
  let branchId = ISAAC_BRANCH_ID;
  const { data: orgs } = await nou.from("organizations").select("id,name");
  const namedOrg = (orgs ?? []).find((o) =>
    /estacion|iphone/i.test(String(o.name ?? "")),
  );
  if (namedOrg?.id) orgId = namedOrg.id;
  const { data: branches } = await nou
    .from("branches")
    .select("id,name,organization_id")
    .eq("organization_id", orgId);
  const namedBranch = (branches ?? []).find((b) =>
    /estacion|iphone/i.test(String(b.name ?? "")),
  );
  if (namedBranch?.id) branchId = namedBranch.id;
  console.log("Org", orgId, namedOrg?.name ?? "(fallback id)");
  console.log("Branch", branchId, namedBranch?.name ?? "(fallback id)");
  const categories = await fetchAll(
    nou,
    "categories",
    "id,name,display_order,created_at",
    (q) => q.eq("organization_id", orgId),
  );

  const products = await fetchAll(
    nou,
    "products",
    "id,name,sku,brand,base_cost,base_price,apply_iva,category_id,description,created_at,updated_at",
    (q) => q.eq("organization_id", orgId),
  );

  const inventory = await fetchAll(
    nou,
    "inventory",
    "product_id,quantity,branch_id",
    (q) => q.eq("branch_id", branchId),
  );

  const stockByProduct = new Map();
  for (const row of inventory) {
    const pid = String(row.product_id);
    stockByProduct.set(
      pid,
      (stockByProduct.get(pid) ?? 0) + Math.max(0, Math.floor(Number(row.quantity ?? 0))),
    );
  }

  const customersNou = await fetchAll(
    nou,
    "customers",
    "id,name,email,phone,created_at",
    (q) => q.eq("organization_id", orgId),
  );

  const sales = await fetchAll(
    nou,
    "sales",
    "id,invoice_number,status,payment_method,notes,amount_cash,amount_transfer,customer_id,total,created_at,updated_at",
    (q) => q.eq("branch_id", branchId),
  );

  const saleIds = sales.map((s) => s.id);
  const saleItems = [];
  for (let i = 0; i < saleIds.length; i += 200) {
    const batch = saleIds.slice(i, i + 200);
    const { data, error } = await nou
      .from("sale_items")
      .select(
        "id,sale_id,product_id,quantity,unit_price,discount_percent,discount_amount",
      )
      .in("sale_id", batch);
    if (error) throw new Error(`sale_items: ${error.message}`);
    saleItems.push(...(data ?? []));
  }

  console.log(
    `Nou: ${categories.length} cats, ${products.length} productos, ${sales.length} ventas, ${saleItems.length} ítems`,
  );

  const brand = {
    trade_name: "Estación iPhone",
    legal_name: "Estación iPhone",
    tax_nit: "1103738806",
    tax_regime: "Responsables de IVA",
    phone: "3054801918",
    email: "estacioniphone6@gmail.com",
    whatsapp: "3054801918",
    address: "Cll 24 #17-20",
    city: "Guacarí",
  };

  let tenantId = existingTenant?.id ?? null;
  if (!tenantId) {
    const { data: tenant, error: tErr } = await berea
      .from("tenants")
      .insert({
        slug: TENANT_SLUG,
        name: "Estación iPhone",
        status: "active",
        custom_domains: [],
        brand,
      })
      .select("id")
      .single();
    if (tErr || !tenant?.id) throw new Error(tErr?.message ?? "tenant insert");
    tenantId = tenant.id;
    console.log("Tenant creado", tenantId);
  } else {
    await berea.from("tenants").update({ brand, status: "active" }).eq("id", tenantId);
    console.log("Tenant existente", tenantId);
  }

  const { count: existingStaff } = await berea
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  if ((existingStaff ?? 0) >= 2) {
    console.log("Usuarios del tenant ya existen; no se regeneran claves.");
  } else {
    const staff = [
      {
        email: "isaachernandezmendoza3@gmail.com",
        displayName: "Isaac Hernández",
        jobRole: "owner",
        permissions: allTrue(),
      },
      {
        email: "estacioniphone6@gmail.com",
        displayName: "María Lucía",
        jobRole: "admin",
        permissions: defaultPermissionsAdmin(),
      },
    ];
    const credentials = [];

    for (const person of staff) {
      const password = randomPassword();
      const loginUsername = slugUsername(person.displayName);
      const { data: created, error: cErr } = await berea.auth.admin.createUser({
        email: person.email,
        password,
        email_confirm: true,
        user_metadata: {
          display_name: person.displayName,
          login_username: loginUsername,
        },
        app_metadata: {
          tenant_id: tenantId,
          tenant_slug: TENANT_SLUG,
        },
      });
      if (cErr || !created.user) {
        const msg = (cErr?.message ?? "").toLowerCase();
        if (msg.includes("already") || msg.includes("registered")) {
          console.warn(`Auth ya existe ${person.email}; no se reescribe la clave.`);
          const { data: listed } = await berea.auth.admin.listUsers({
            perPage: 200,
          });
          const found = listed?.users?.find(
            (u) => (u.email ?? "").toLowerCase() === person.email,
          );
          if (!found) throw new Error(`No se encontró ${person.email} en Auth`);
          await berea.from("profiles").upsert({
            id: found.id,
            role: "admin",
            display_name: person.displayName,
            login_username: loginUsername,
            public_email: person.email,
            job_role: person.jobRole,
            permissions: person.permissions,
            avatar_variant: "A",
            is_active: true,
            tenant_id: tenantId,
          });
          credentials.push({
            email: person.email,
            password: "(ya existía — no se rotó)",
            role: person.jobRole,
          });
          continue;
        }
        throw new Error(`createUser ${person.email}: ${cErr?.message}`);
      }
      const { error: pErr } = await berea.from("profiles").insert({
        id: created.user.id,
        role: "admin",
        display_name: person.displayName,
        login_username: loginUsername,
        public_email: person.email,
        job_role: person.jobRole,
        permissions: person.permissions,
        avatar_variant: "A",
        is_active: true,
        tenant_id: tenantId,
      });
      if (pErr) throw new Error(`profile ${person.email}: ${pErr.message}`);
      credentials.push({
        email: person.email,
        password,
        role: person.jobRole,
      });
    }

    const credPath = join(root, "scripts/.estacion-iphone-credentials.local.txt");
    writeFileSync(
      credPath,
      [
        `Tenant: ${TENANT_SLUG}`,
        `Admin: https://${TENANT_SLUG}.productos.bereahouse.com/admin/login`,
        "",
        ...credentials.map(
          (c) => `${c.email}  (${c.role})  clave: ${c.password}`,
        ),
        "",
      ].join("\n"),
      "utf8",
    );
    console.log("Claves nuevas en", credPath);
  }

  const catIdMap = new Map();
  const { data: existingCats } = await berea
    .from("categories")
    .select("id,name")
    .eq("tenant_id", tenantId);
  if (existingCats?.length) {
    const byName = new Map(
      existingCats.map((c) => [String(c.name).trim().toLowerCase(), c.id]),
    );
    for (const c of categories) {
      const id = byName.get(String(c.name ?? "").trim().toLowerCase());
      if (id) catIdMap.set(String(c.id), id);
    }
    console.log("Categorías existentes", existingCats.length);
  } else {
  const catRows = categories.map((c, i) => {
    const id = randomUUID();
    catIdMap.set(String(c.id), id);
    return {
      id,
      tenant_id: tenantId,
      name: String(c.name ?? "Sin categoría").trim() || "Sin categoría",
      sort_order: Number.isFinite(Number(c.display_order))
        ? Number(c.display_order)
        : i,
      icon_key: "tag",
      created_at: c.created_at ?? new Date().toISOString(),
    };
  });
  if (catRows.length) await insertChunks(berea, "categories", catRows);
  console.log("Categorías", catRows.length);
  }

  const productIdMap = new Map();
  const productRows = products.map((p) => {
    const id = randomUUID();
    productIdMap.set(String(p.id), id);
    const sku = String(p.sku ?? "").trim();
    const hasVat = Boolean(p.apply_iva);
    const cost = pesosToCents(p.base_cost);
    const price = pesosToCents(p.base_price);
    return {
      id,
      tenant_id: tenantId,
      name: String(p.name ?? "Producto").trim() || "Producto",
      description: String(p.description ?? ""),
      reference: sku,
      brand: String(p.brand ?? "").trim(),
      price_cents: price,
      cost_cents: cost,
      cost_gross_cents: cost,
      has_vat: hasVat,
      vat_percent: hasVat ? 19 : null,
      category_id: p.category_id ? catIdMap.get(String(p.category_id)) ?? null : null,
      stock_local: stockByProduct.get(String(p.id)) ?? 0,
      stock_warehouse: 0,
      is_published: false,
      currency: "COP",
      created_at: p.created_at ?? new Date().toISOString(),
      updated_at: p.updated_at ?? p.created_at ?? new Date().toISOString(),
    };
  });
  if (productRows.length) await insertChunks(berea, "products", productRows, 40);
  console.log("Productos", productRows.length);

  const customerIdMap = new Map();
  const customerRows = customersNou.map((c) => {
    const id = randomUUID();
    customerIdMap.set(String(c.id), id);
    const email = String(c.email ?? "").trim().toLowerCase();
    return {
      id,
      tenant_id: tenantId,
      name: String(c.name ?? "Cliente").trim() || "Cliente",
      email: email.includes("@") ? email : null,
      phone: String(c.phone ?? "").trim() || null,
      source: "manual",
      created_at: c.created_at ?? new Date().toISOString(),
    };
  });
  if (customerRows.length) await insertChunks(berea, "customers", customerRows);
  console.log("Clientes", customerRows.length);

  const orderIdMap = new Map();
  const orderRows = sales.map((s) => {
    const id = randomUUID();
    orderIdMap.set(String(s.id), id);
    const method = posRef(s.payment_method);
    const invoice =
      s.invoice_number != null && String(s.invoice_number).trim()
        ? String(s.invoice_number).trim()
        : null;
    const cash = pesosToCents(s.amount_cash);
    const transfer = pesosToCents(s.amount_transfer);
    return {
      id,
      tenant_id: tenantId,
      status: saleStatus(s.status),
      customer_id: s.customer_id
        ? customerIdMap.get(String(s.customer_id)) ?? null
        : null,
      customer_name:
        (s.customer_id &&
          customersNou.find((c) => String(c.id) === String(s.customer_id))?.name) ||
        "Cliente Final",
      customer_email: "pos@estacion-iphone.local",
      total_cents: pesosToCents(s.total),
      currency: "COP",
      checkout_payment_method: "wompi",
      wompi_reference: method,
      wompi_transaction_id: invoice,
      pos_mixed_cash_cents: method === "POS:mixed" ? cash : null,
      pos_mixed_transfer_cents: method === "POS:mixed" ? transfer : null,
      shipping_cents: 0,
      created_at: s.created_at ?? new Date().toISOString(),
      updated_at: s.updated_at ?? s.created_at ?? new Date().toISOString(),
    };
  });
  if (orderRows.length) await insertChunks(berea, "orders", orderRows, 60);
  console.log("Ventas", orderRows.length);

  const productNameByOldId = new Map(
    products.map((p) => [String(p.id), String(p.name ?? "Producto")]),
  );
  const itemRows = saleItems
    .map((it) => {
      const orderId = orderIdMap.get(String(it.sale_id));
      if (!orderId) return null;
      const qty = Math.max(1, Math.floor(Number(it.quantity ?? 1)));
      const pct = Number(it.discount_percent ?? 0);
      const amt = pesosToCents(it.discount_amount);
      return {
        tenant_id: tenantId,
        order_id: orderId,
        product_id: it.product_id
          ? productIdMap.get(String(it.product_id)) ?? null
          : null,
        quantity: qty,
        unit_price_cents: pesosToCents(it.unit_price),
        product_name_snapshot:
          (it.product_id && productNameByOldId.get(String(it.product_id))) ||
          "Producto",
        line_discount_percent:
          Number.isFinite(pct) && pct > 0 && pct <= 100 ? Math.floor(pct) : null,
        line_discount_amount_cents: amt,
        stock_deducted_local: 0,
        stock_deducted_warehouse: 0,
      };
    })
    .filter(Boolean);

  if (itemRows.length) await insertChunks(berea, "order_items", itemRows, 80);
  console.log("Ítems de venta", itemRows.length);

  const { count: pubAleya } = await berea
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true)
    .eq(
      "tenant_id",
      (
        await berea.from("tenants").select("id").eq("slug", "aleya").single()
      ).data.id,
    );
  const { count: pubIsaac } = await berea
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("is_published", true);

  console.log(
    `Listo. Publicados Aleya=${pubAleya} · publicados Estación iPhone=${pubIsaac} (debe ser 0).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
