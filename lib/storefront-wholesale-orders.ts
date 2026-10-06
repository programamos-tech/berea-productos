import { formatCop } from "@/lib/money";
import { formatStoreDateTime } from "@/lib/store-datetime-format";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type StorefrontWholesaleOrder = {
  id: string;
  whenLabel: string;
  totalLabel: string;
  statusLabel: string;
  payLabel: string;
};

export type StorefrontWholesaleOrders = {
  count: number;
  latest: StorefrontWholesaleOrder[];
};

const EMPTY: StorefrontWholesaleOrders = { count: 0, latest: [] };

function digits(value: string | null | undefined): string {
  return String(value ?? "").replace(/\D/g, "");
}

function emailKey(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

function statusLabel(status: string): string {
  switch (status) {
    case "paid":
      return "Pagado";
    case "pending":
      return "Pendiente";
    case "cancelled":
      return "Cancelado";
    case "failed":
      return "Fallido";
    default:
      return status;
  }
}

function payLabel(reference: string | null): string {
  const ref = reference ?? "";
  if (ref.startsWith("POS:cash")) return "Efectivo";
  if (ref.startsWith("POS:transfer")) return "Transferencia";
  if (ref.startsWith("POS:mixed")) return "Mixto";
  if (ref.startsWith("POS:credit")) return "Crédito";
  if (ref.startsWith("POS:")) return "Mostrador";
  if (ref.length > 0) return "En línea";
  return "";
}

/**
 * Pedidos del mayorista que entró con código. Incluye el historial del mismo
 * cliente en otra sucursal (mismo documento o correo), porque la copia a Bodega
 * no arrastró las facturas.
 */
export async function loadStorefrontWholesaleOrders(
  customerId: string,
): Promise<StorefrontWholesaleOrders> {
  const supabase = createSupabaseServiceClient();
  const { data: me, error: meErr } = await supabase
    .from("customers")
    .select("id,tenant_id,document_id,email")
    .eq("id", customerId)
    .maybeSingle();

  if (meErr || !me?.id || !me.tenant_id) return EMPTY;

  const tenantId = String(me.tenant_id);
  const doc = digits(me.document_id as string | null);
  const email = emailKey(me.email as string | null);
  const ids = new Set<string>([String(me.id)]);

  if (doc || email) {
    const { data: peers } = await supabase
      .from("customers")
      .select("id,document_id,email")
      .eq("tenant_id", tenantId)
      .eq("customer_kind", "wholesale");

    for (const peer of peers ?? []) {
      const peerId = String((peer as { id: string }).id);
      const sameDoc = doc.length > 0 && digits((peer as { document_id?: string | null }).document_id) === doc;
      const sameEmail =
        email.length > 0 && emailKey((peer as { email?: string | null }).email) === email;
      if (sameDoc || sameEmail) ids.add(peerId);
    }
  }

  const idList = [...ids];
  const listQuery = supabase
    .from("orders")
    .select("id,total_cents,created_at,status,wompi_reference")
    .in("customer_id", idList)
    .neq("status", "quotation")
    .order("created_at", { ascending: false })
    .limit(8);

  const countQuery = supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .in("customer_id", idList)
    .neq("status", "quotation");

  const [{ data: rows }, { count }] = await Promise.all([listQuery, countQuery]);

  const latest: StorefrontWholesaleOrder[] = (rows ?? []).map((row) => {
    const status = String((row as { status?: string }).status ?? "");
    const reference =
      (row as { wompi_reference?: string | null }).wompi_reference != null
        ? String((row as { wompi_reference?: string | null }).wompi_reference)
        : null;
    return {
      id: String((row as { id: string }).id),
      whenLabel: formatStoreDateTime(
        (row as { created_at?: string | null }).created_at ?? null,
        { dateStyle: "medium" },
      ),
      totalLabel: formatCop(Number((row as { total_cents?: number }).total_cents ?? 0)),
      statusLabel: statusLabel(status),
      payLabel: payLabel(reference),
    };
  });

  return { count: count ?? latest.length, latest };
}
