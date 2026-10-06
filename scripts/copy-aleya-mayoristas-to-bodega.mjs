#!/usr/bin/env node
/**
 * Copia clientes mayoristas (customer_kind = wholesale) de Aleya Local → Bodega.
 *
 * Solo perfil + direcciones. NO copia pedidos, facturas, pagos ni historial de crédito.
 * Omite tres exclusiones por nombre / razón social (match flexible).
 * Idempotente: si ya existe matching en Bodega (doc / email / nombre), skip.
 *
 *   node scripts/copy-aleya-mayoristas-to-bodega.mjs           # dry-run
 *   node scripts/copy-aleya-mayoristas-to-bodega.mjs --apply
 *
 * Requiere NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (.env.local o env).
 * No usar localhost: esta es una op de producción.
 */

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const TENANT_SLUG = "aleya";
const SOURCE_BRANCH_CODE = "local";
const TARGET_BRANCH_CODE = "bodega";
const APPLY = process.argv.includes("--apply");

/** Match flexible: nombre o negocio (normalizado NFD, casefold, sin puntuación extra). */
const EXCLUSIONS = [
  {
    label: "Andrea Vaquero / Amada Cosmetic",
    needles: ["andrea vaquero", "amada cosmetic", "amada cosmetics"],
  },
  {
    label: "Juliet Melisa Velázquez",
    needles: [
      "juliet melisa velazquez",
      "juliet melissa velazquez",
      "julieta melisa velazquez",
      "juliet melisa",
    ],
  },
  {
    label: "Laura Paternina de Belle Store",
    needles: [
      "laura paternina",
      "belle store",
      "de belle store",
      "laura paternina de belle",
    ],
  },
];

const CUSTOMER_COLS =
  "id,tenant_id,branch_id,name,email,phone,document_id,document_type,requires_electronic_invoice,shipping_address,shipping_city,shipping_postal_code,shipping_neighborhood,shipping_reference,notes,source,birth_date,customer_kind,wholesale_discount_percent,created_at,auth_user_id";

const ADDRESS_COLS =
  "id,tenant_id,branch_id,customer_id,label,address_line,reference,sort_order";

function loadEnvLocal() {
  const p = join(root, ".env.local");
  if (!existsSync(p)) return;
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
    if (!process.env[key] && !/\[SENSITIVE\]/i.test(val)) process.env[key] = val;
  }
}

function normText(v) {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normEmail(v) {
  const t = String(v ?? "").trim().toLowerCase();
  return t.length > 0 ? t : null;
}

function normDoc(v) {
  const d = String(v ?? "").replace(/\D/g, "");
  return d.length >= 6 ? d : null;
}

function matchesExclusion(customer) {
  const hay = normText(
    [customer.name, customer.notes, customer.email].filter(Boolean).join(" "),
  );
  for (const ex of EXCLUSIONS) {
    for (const needle of ex.needles) {
      if (hay.includes(normText(needle))) {
        return ex.label;
      }
    }
  }
  return null;
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
    if (error) throw new Error(`${table} insert @${i}: ${error.message}`);
  }
}

function bodegaMatchKey(c) {
  const doc = normDoc(c.document_id);
  if (doc) return `doc:${doc}`;
  const email = normEmail(c.email);
  if (email) return `email:${email}`;
  const name = normText(c.name);
  if (name) return `name:${name}`;
  return null;
}

function findExistingOnBodega(source, bodegaByKey, bodegaList) {
  const key = bodegaMatchKey(source);
  if (key && bodegaByKey.has(key)) {
    return { reason: key.split(":")[0], row: bodegaByKey.get(key) };
  }
  // Nombre flexible: needle bidireccional si no hay doc/email fuerte
  const srcName = normText(source.name);
  if (!srcName) return null;
  for (const b of bodegaList) {
    const bn = normText(b.name);
    if (!bn) continue;
    if (bn === srcName || bn.includes(srcName) || srcName.includes(bn)) {
      return { reason: "name", row: b };
    }
  }
  return null;
}

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "BLOCKED: faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (.env.local o export).",
    );
    process.exit(2);
  }
  if (/127\.0\.0\.1|localhost/i.test(url)) {
    console.error("BLOCKED: URL apunta a localhost; se requiere producción.");
    process.exit(2);
  }

  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: tenant, error: tErr } = await sb
    .from("tenants")
    .select("id,slug,name")
    .eq("slug", TENANT_SLUG)
    .single();
  if (tErr || !tenant?.id) {
    throw new Error(`Tenant ${TENANT_SLUG} no encontrado: ${tErr?.message ?? "missing"}`);
  }

  const { data: branches, error: bErr } = await sb
    .from("branches")
    .select("id,name,code,is_default,is_active")
    .eq("tenant_id", tenant.id);
  if (bErr) throw new Error(`branches: ${bErr.message}`);

  const sourceBranch = (branches ?? []).find((b) => b.code === SOURCE_BRANCH_CODE);
  const targetBranch = (branches ?? []).find((b) => b.code === TARGET_BRANCH_CODE);
  if (!sourceBranch?.id) {
    throw new Error(`Sucursal origen code=${SOURCE_BRANCH_CODE} no encontrada`);
  }
  if (!targetBranch?.id) {
    throw new Error(`Sucursal destino code=${TARGET_BRANCH_CODE} no encontrada`);
  }

  console.log("=== Aleya mayoristas → Bodega ===");
  console.log(`mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);
  console.log(`tenant: ${tenant.slug} (${tenant.id}) ${tenant.name ?? ""}`);
  console.log(
    `source: ${sourceBranch.name} / ${sourceBranch.code} (${sourceBranch.id})`,
  );
  console.log(
    `target: ${targetBranch.name} / ${targetBranch.code} (${targetBranch.id})`,
  );

  const sourceWholesale = await fetchAll(sb, "customers", CUSTOMER_COLS, (q) =>
    q
      .eq("tenant_id", tenant.id)
      .eq("branch_id", sourceBranch.id)
      .eq("customer_kind", "wholesale")
      .order("created_at", { ascending: true }),
  );

  const bodegaWholesale = await fetchAll(sb, "customers", CUSTOMER_COLS, (q) =>
    q
      .eq("tenant_id", tenant.id)
      .eq("branch_id", targetBranch.id)
      .eq("customer_kind", "wholesale")
      .order("created_at", { ascending: true }),
  );

  const bodegaAll = await fetchAll(
    sb,
    "customers",
    "id,name,email,document_id,customer_kind",
    (q) =>
      q
        .eq("tenant_id", tenant.id)
        .eq("branch_id", targetBranch.id)
        .order("created_at", { ascending: true }),
  );

  const bodegaByKey = new Map();
  for (const c of bodegaAll) {
    const doc = normDoc(c.document_id);
    if (doc) bodegaByKey.set(`doc:${doc}`, c);
    const email = normEmail(c.email);
    if (email) bodegaByKey.set(`email:${email}`, c);
    const name = normText(c.name);
    if (name) bodegaByKey.set(`name:${name}`, c);
  }

  const sourceIds = sourceWholesale.map((c) => c.id);
  const addresses =
    sourceIds.length === 0
      ? []
      : await fetchAll(sb, "customer_addresses", ADDRESS_COLS, (q) =>
          q
            .eq("tenant_id", tenant.id)
            .eq("branch_id", sourceBranch.id)
            .in("customer_id", sourceIds),
        );

  const addressesByCustomer = new Map();
  for (const a of addresses) {
    if (!addressesByCustomer.has(a.customer_id)) {
      addressesByCustomer.set(a.customer_id, []);
    }
    addressesByCustomer.get(a.customer_id).push(a);
  }

  /** @type {{ customer: any, exclusion: string }[]} */
  const excluded = [];
  /** @type {{ customer: any, reason: string, existing: any }[]} */
  const skipped = [];
  /** @type {{ customer: any, newId: string, addressCount: number }[]} */
  const toCopy = [];

  for (const c of sourceWholesale) {
    const ex = matchesExclusion(c);
    if (ex) {
      excluded.push({ customer: c, exclusion: ex });
      continue;
    }
    const existing = findExistingOnBodega(c, bodegaByKey, bodegaAll);
    if (existing) {
      skipped.push({
        customer: c,
        reason: existing.reason,
        existing: existing.row,
      });
      continue;
    }
    const newId = randomUUID();
    toCopy.push({
      customer: c,
      newId,
      addressCount: (addressesByCustomer.get(c.id) ?? []).length,
    });
  }

  console.log("\n--- Counts (before) ---");
  console.log(`source Local wholesale: ${sourceWholesale.length}`);
  console.log(`target Bodega wholesale (before): ${bodegaWholesale.length}`);
  console.log(`target Bodega all customers (before): ${bodegaAll.length}`);
  console.log(`excluded (named): ${excluded.length}`);
  console.log(`skipped (already on Bodega): ${skipped.length}`);
  console.log(`to copy: ${toCopy.length}`);

  if (excluded.length) {
    console.log("\n--- Exclusions (verified, will NOT insert) ---");
    for (const { customer: c, exclusion } of excluded) {
      console.log(
        `  EXCLUDE [${exclusion}] id=${c.id} name="${c.name}" doc=${c.document_id ?? "-"} email=${c.email ?? "-"}`,
      );
    }
  }

  if (skipped.length) {
    console.log("\n--- Skipped (idempotent match on Bodega) ---");
    for (const { customer: c, reason, existing } of skipped.slice(0, 40)) {
      console.log(
        `  SKIP (${reason}) src=${c.id} "${c.name}" → bodega=${existing.id} "${existing.name}"`,
      );
    }
    if (skipped.length > 40) console.log(`  … +${skipped.length - 40} more`);
  }

  console.log("\n--- Copy plan (customers only; no orders/invoices) ---");
  for (const row of toCopy.slice(0, 60)) {
    console.log(
      `  COPY ${row.customer.id} → ${row.newId} "${row.customer.name}" discount=${row.customer.wholesale_discount_percent}% addrs=${row.addressCount}`,
    );
  }
  if (toCopy.length > 60) console.log(`  … +${toCopy.length - 60} more`);

  if (!APPLY) {
    console.log(
      "\nDry-run only. Re-run with --apply to insert customers + customer_addresses.",
    );
    return;
  }

  const customerInserts = toCopy.map(({ customer: c, newId }) => ({
    id: newId,
    tenant_id: tenant.id,
    branch_id: targetBranch.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    document_id: c.document_id,
    document_type: c.document_type ?? "nit",
    requires_electronic_invoice: Boolean(c.requires_electronic_invoice),
    shipping_address: c.shipping_address,
    shipping_city: c.shipping_city,
    shipping_postal_code: c.shipping_postal_code,
    shipping_neighborhood: c.shipping_neighborhood ?? null,
    shipping_reference: c.shipping_reference ?? null,
    notes: c.notes,
    source: c.source ?? "manual",
    birth_date: c.birth_date,
    customer_kind: "wholesale",
    wholesale_discount_percent: Math.max(
      0,
      Math.min(100, Math.floor(Number(c.wholesale_discount_percent ?? 0))),
    ),
    // Do NOT copy auth_user_id: unique per tenant; storefront login stays on Local.
  }));

  const addressInserts = [];
  for (const { customer: c, newId } of toCopy) {
    const addrs = addressesByCustomer.get(c.id) ?? [];
    for (const a of addrs) {
      addressInserts.push({
        id: randomUUID(),
        tenant_id: tenant.id,
        branch_id: targetBranch.id,
        customer_id: newId,
        label: a.label ?? "Casa",
        address_line: a.address_line ?? "",
        reference: a.reference ?? "",
        sort_order: a.sort_order ?? 0,
      });
    }
  }

  if (customerInserts.length) {
    await insertChunks(sb, "customers", customerInserts);
  }
  if (addressInserts.length) {
    await insertChunks(sb, "customer_addresses", addressInserts);
  }

  const bodegaWholesaleAfter = await fetchAll(sb, "customers", "id", (q) =>
    q
      .eq("tenant_id", tenant.id)
      .eq("branch_id", targetBranch.id)
      .eq("customer_kind", "wholesale"),
  );

  console.log("\n--- Counts (after) ---");
  console.log(`copied customers: ${customerInserts.length}`);
  console.log(`copied addresses: ${addressInserts.length}`);
  console.log(`excluded: ${excluded.length}`);
  console.log(`skipped: ${skipped.length}`);
  console.log(`target Bodega wholesale (after): ${bodegaWholesaleAfter.length}`);
  console.log(
    "Confirmed: only customers + customer_addresses written; no orders/invoices/payments.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
