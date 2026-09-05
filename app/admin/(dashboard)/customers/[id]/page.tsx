import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerDetailHeaderActions } from "@/components/admin/CustomerDetailHeaderActions";
import { fetchAdminCustomerDetail } from "@/lib/supabase/admin-customer-detail";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCop } from "@/lib/money";
import { formatStoreDateTime } from "@/lib/store-datetime-format";
import {
  averageTicketByCalendarDayFromPaidOrders,
  averageTicketByMonthFromPaidOrders,
  ticketTrendMonthOverMonthPercent,
} from "@/lib/customer-ticket-trend";
import { CustomerTicketTrendChart } from "@/components/admin/CustomerTicketTrendChart";
import { ventaFormaPagoBadge, ventaNumeroReferencia } from "@/lib/ventas-sales";
import { isDomicilioOrder } from "@/lib/customer-order-classification";

export const dynamic = "force-dynamic";

const viewportClass =
  "flex h-[calc(100dvh-3.5rem-1.5rem)] flex-col gap-3 overflow-x-hidden overflow-y-auto sm:h-[calc(100dvh-4rem-2rem)] md:h-[calc(100dvh-4rem-3rem)] lg:overflow-hidden";

const labelClass =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";

const thClass =
  "pb-2 pr-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";

const metaSep = "text-zinc-300 dark:text-zinc-600";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

function whatsappHref(phone: string): string | null {
  const d = phone.replace(/\D/g, "");
  if (d.length < 8) return null;
  const withCc = d.startsWith("57") ? d : `57${d}`;
  return `https://wa.me/${withCc}`;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.883 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export default async function AdminCustomerDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const sp = await searchParams;

  const supabase = await createSupabaseServerClient();
  const { detail, error } = await fetchAdminCustomerDetail(supabase, id);

  if (error && error.message?.toLowerCase().includes("customers")) {
    return (
      <p className="text-sm text-amber-700 dark:text-amber-300">
        No se pudo cargar el cliente. Revisa migraciones y permisos.
      </p>
    );
  }

  if (!detail) notFound();

  const {
    customer,
    addresses,
    ordersPaid,
    customerOrders,
    topProducts,
    matchedOrdersByEmailFallback,
  } = detail;

  const orderStatusLabel: Record<string, string> = {
    pending: "Pendiente",
    paid: "Pagado",
    failed: "Fallido",
    cancelled: "Cancelado",
  };

  const isWholesale = customer.customer_kind === "wholesale";
  const ventas = ordersPaid.length;
  const totalCents = ordersPaid.reduce(
    (s, o) => s + Number(o.total_cents ?? 0),
    0,
  );
  const ticketCents = ventas > 0 ? Math.round(totalCents / ventas) : null;
  const ticketTrendMonthly = averageTicketByMonthFromPaidOrders(ordersPaid);
  const trendPct = ticketTrendMonthOverMonthPercent(ticketTrendMonthly);
  const ticketTrendPoints = averageTicketByCalendarDayFromPaidOrders(
    ordersPaid,
    150,
  );
  const domiCount = ordersPaid.filter((o) => isDomicilioOrder(o)).length;
  const tiendaCount = Math.max(0, ventas - domiCount);
  const puntosRef = ventas > 0 ? Math.round(totalCents / 10000) : 0;

  const lastPaidAt = ordersPaid[0]?.created_at;
  const lastPurchaseLabel =
    typeof lastPaidAt === "string"
      ? formatStoreDateTime(lastPaidAt, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

  const msSincePurchase =
    typeof lastPaidAt === "string"
      ? Date.now() - new Date(lastPaidAt).getTime()
      : null;
  const daysSincePurchase =
    msSincePurchase != null
      ? Math.max(0, Math.floor(msSincePurchase / (24 * 60 * 60 * 1000)))
      : null;
  const daysSincePurchaseMain =
    daysSincePurchase == null
      ? "—"
      : daysSincePurchase === 0
        ? "Hoy"
        : String(daysSincePurchase);
  const daysSincePurchaseUnit =
    daysSincePurchase == null || daysSincePurchase === 0
      ? null
      : daysSincePurchase === 1
        ? "día"
        : "días";
  const activoReciente =
    ventas > 0 &&
    msSincePurchase != null &&
    msSincePurchase < 90 * 24 * 60 * 60 * 1000;

  const addressBlocks =
    addresses.length > 0
      ? addresses
      : customer.shipping_address?.trim()
        ? [
            {
              id: "primary-shipping",
              label: "Principal",
              address_line: customer.shipping_address.trim(),
              reference: "",
              sort_order: 0,
            },
          ]
        : [];

  const cityPostal = [customer.shipping_city, customer.shipping_postal_code]
    .filter((x) => String(x ?? "").trim())
    .join(
      customer.shipping_city && customer.shipping_postal_code ? " · " : "",
    );

  const addressLine =
    [
      addressBlocks[0]
        ? [addressBlocks[0].address_line, addressBlocks[0].reference]
            .filter(Boolean)
            .join(" · ")
        : null,
      cityPostal || null,
    ]
      .filter(Boolean)
      .join(" · ") || null;

  const phoneDigits = customer.phone?.replace(/\D/g, "") ?? "";
  const wa =
    customer.phone?.trim() && customer.phone !== "—"
      ? whatsappHref(customer.phone)
      : null;

  const tipoLabel = isWholesale ? "Mayorista" : "Minorista";
  const tipoClass = isWholesale
    ? "text-amber-800 dark:text-amber-300"
    : "text-sky-800 dark:text-sky-300";

  const actividadLabel =
    ventas <= 0 ? "Sin compras" : activoReciente ? "Activo" : "Inactivo";
  const actividadClass =
    actividadLabel === "Activo"
      ? "text-emerald-700 dark:text-emerald-400"
      : actividadLabel === "Inactivo"
        ? "text-zinc-500"
        : "text-zinc-500";

  const birthLabel =
    customer.birth_date != null && String(customer.birth_date).trim() !== ""
      ? new Date(`${String(customer.birth_date).trim()}T12:00:00`).toLocaleDateString(
          "es-CO",
          { day: "numeric", month: "short" },
        )
      : null;

  const crumb =
    customer.name.trim().length > 36
      ? `${customer.name.trim().slice(0, 35)}…`
      : customer.name.trim();

  const recentOrders = customerOrders.slice(0, 40);
  const topRows = topProducts.slice(0, 6);

  return (
    <div className={viewportClass}>
      {sp.error === "delete" ? (
        <p className="shrink-0 text-sm text-red-600 dark:text-red-400">
          No se pudo eliminar el cliente. Intenta de nuevo.
        </p>
      ) : null}

      <header className="flex shrink-0 flex-wrap items-start justify-between gap-2 gap-y-2">
        <div className="min-w-0">
          <p className="text-[11px] text-zinc-500">
            <Link
              href="/admin/customers"
              className="hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Clientes
            </Link>
            <span className="mx-1.5 text-zinc-400">/</span>
            <span className="text-zinc-600 dark:text-zinc-400" title={customer.name}>
              {crumb}
            </span>
          </p>
          <h1 className="mt-0.5 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-xl">
            {customer.name}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
            <span className={tipoClass}>{tipoLabel}</span>
            {isWholesale && customer.wholesale_discount_percent > 0 ? (
              <span className={tipoClass}>
                {customer.wholesale_discount_percent}%
              </span>
            ) : null}
            <span className={metaSep} aria-hidden>
              ·
            </span>
            <span className={actividadClass}>{actividadLabel}</span>
            <span className={metaSep} aria-hidden>
              ·
            </span>
            <span className="tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
              {puntosRef.toLocaleString("es-CO")}{" "}
              <span className="font-medium text-zinc-600 dark:text-zinc-300">
                pts
              </span>
            </span>
            {trendPct != null ? (
              <>
                <span className={metaSep} aria-hidden>
                  ·
                </span>
                <span
                  className={
                    trendPct >= 0
                      ? "tabular-nums text-emerald-700 dark:text-emerald-400"
                      : "tabular-nums text-rose-700 dark:text-rose-400"
                  }
                >
                  {trendPct >= 0 ? "+" : ""}
                  {trendPct}% ticket
                </span>
              </>
            ) : null}
            {matchedOrdersByEmailFallback ? (
              <>
                <span className={metaSep} aria-hidden>
                  ·
                </span>
                <span className="text-amber-700 dark:text-amber-300">
                  Pedidos por email
                </span>
              </>
            ) : null}
          </p>
        </div>
        <CustomerDetailHeaderActions
          customerId={id}
          customerName={customer.name}
        />
      </header>

      <div className="flex shrink-0 flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-zinc-200/70 pb-2.5 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
        <span className="inline-flex min-w-0 items-baseline gap-1.5">
          <span className="shrink-0 text-zinc-400">
            {isWholesale ? "NIT" : "Doc."}
          </span>
          <span className="truncate tabular-nums text-zinc-900 dark:text-zinc-100">
            {customer.document_id?.trim() || "—"}
          </span>
        </span>
        <span className={metaSep} aria-hidden>
          ·
        </span>
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <span className="shrink-0 text-zinc-400">Tel.</span>
          {customer.phone?.trim() && customer.phone !== "—" ? (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <a
                href={`tel:${phoneDigits}`}
                className="truncate text-zinc-900 hover:underline dark:text-zinc-100"
              >
                {customer.phone.trim()}
              </a>
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noreferrer"
                  title="WhatsApp"
                  aria-label="Abrir WhatsApp"
                  className="inline-flex shrink-0 text-[#25D366] transition hover:opacity-80"
                >
                  <WhatsAppIcon className="size-3.5" />
                </a>
              ) : null}
            </span>
          ) : (
            <span className="text-zinc-900 dark:text-zinc-100">—</span>
          )}
        </span>
        <span className={metaSep} aria-hidden>
          ·
        </span>
        <span className="inline-flex min-w-0 items-baseline gap-1.5">
          <span className="shrink-0 text-zinc-400">Email</span>
          {customer.email?.trim() ? (
            <a
              href={`mailto:${customer.email.trim()}`}
              className="max-w-[16rem] truncate text-zinc-900 hover:underline dark:text-zinc-100 sm:max-w-[20rem]"
            >
              {customer.email.trim()}
            </a>
          ) : (
            <span className="text-zinc-900 dark:text-zinc-100">—</span>
          )}
        </span>
        <span className={metaSep} aria-hidden>
          ·
        </span>
        <span className="inline-flex min-w-0 max-w-full items-baseline gap-1.5 sm:max-w-[28rem]">
          <span className="shrink-0 text-zinc-400">Dir.</span>
          <span
            className="truncate text-zinc-900 dark:text-zinc-100"
            title={addressLine ?? undefined}
          >
            {addressLine || "—"}
          </span>
        </span>
        <span className={metaSep} aria-hidden>
          ·
        </span>
        {birthLabel ? (
          <>
            <span className="inline-flex items-baseline gap-1.5">
              <span className="shrink-0 text-zinc-400">Cumple</span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {birthLabel}
              </span>
            </span>
            <span className={metaSep} aria-hidden>
              ·
            </span>
          </>
        ) : null}
        <span className="inline-flex items-baseline gap-1.5">
          <span className="shrink-0 text-zinc-400">Desde</span>
          <span className="text-zinc-900 dark:text-zinc-100">
            {formatStoreDateTime(customer.created_at, {
              month: "short",
              year: "numeric",
            })}
          </span>
        </span>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3 xl:grid-cols-6">
        <div className="min-w-0">
          <p className={labelClass}>Compras</p>
          <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
            {ventas}
          </p>
        </div>
        <div className="min-w-0">
          <p className={labelClass}>Gastado</p>
          <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
            {ventas > 0 ? formatCop(totalCents) : "—"}
          </p>
        </div>
        <div className="min-w-0">
          <p className={labelClass}>Ticket prom.</p>
          <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
            {ticketCents != null ? formatCop(ticketCents) : "—"}
          </p>
        </div>
        <div className="min-w-0">
          <p className={labelClass}>Última compra</p>
          <p className="mt-1 flex items-baseline gap-1 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            <span className="tabular-nums">{daysSincePurchaseMain}</span>
            {daysSincePurchaseUnit ? (
              <span className="text-sm font-medium text-zinc-500">
                {daysSincePurchaseUnit}
              </span>
            ) : null}
          </p>
          {lastPurchaseLabel !== "—" ? (
            <p className="mt-0.5 text-[11px] tabular-nums text-zinc-500">
              {lastPurchaseLabel}
            </p>
          ) : null}
        </div>
        <div className="min-w-0">
          <p className={labelClass}>Tienda</p>
          <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
            {tiendaCount}
          </p>
        </div>
        <div className="min-w-0">
          <p className={labelClass}>Domicilio</p>
          <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
            {domiCount}
          </p>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 border-t border-zinc-200/70 pt-3 dark:border-zinc-800 lg:grid-cols-12 lg:gap-6">
        <div className="flex min-h-0 flex-col gap-2 lg:col-span-7">
          <section className="shrink-0">
            <h2 className={labelClass}>Ticket por día</h2>
            <div className="mt-1">
              {ticketTrendPoints.length > 0 ? (
                <CustomerTicketTrendChart
                  points={ticketTrendPoints}
                  seriesKind="day"
                  compact
                  secondaryCaption={null}
                  fillGradientId={`customerTicket-${id}`}
                />
              ) : (
                <p className="text-sm text-zinc-500">
                  Sin días con ventas pagadas para graficar.
                </p>
              )}
            </div>
          </section>

          <section className="flex min-h-0 flex-1 flex-col border-t border-zinc-200/70 pt-2 dark:border-zinc-800">
            <h2 className={labelClass}>Top productos</h2>
            <div className="mt-1.5 min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {topRows.length === 0 ? (
                <p className="text-sm text-zinc-500">Sin ventas pagadas aún.</p>
              ) : (
                <table className="min-w-full text-left text-[13px] leading-snug sm:text-sm">
                  <thead className="sticky top-0 z-[1] bg-white dark:bg-zinc-950">
                    <tr className="border-b border-zinc-200/70 dark:border-zinc-800">
                      <th className={thClass}>#</th>
                      <th className={thClass}>Producto</th>
                      <th className={`${thClass} text-right`}>Ud</th>
                      <th className={`${thClass} pr-0 text-right`}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRows.map((row, i) => (
                      <tr
                        key={`${row.name}-${i}`}
                        className="border-b border-zinc-100/80 last:border-0 dark:border-zinc-800/80"
                      >
                        <td className="py-1.5 pr-3 tabular-nums text-zinc-400">
                          {i + 1}
                        </td>
                        <td className="max-w-[14rem] truncate py-1.5 pr-3 text-zinc-800 dark:text-zinc-200">
                          {row.name}
                        </td>
                        <td className="py-1.5 pr-3 text-right tabular-nums text-zinc-600 dark:text-zinc-300">
                          {row.quantity}
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-zinc-900 dark:text-zinc-100">
                          {formatCop(row.totalCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>

        <section className="flex min-h-0 flex-col border-zinc-200/70 dark:border-zinc-800 lg:col-span-5 lg:border-l lg:pl-6">
          <h2 className={labelClass}>Pedidos</h2>
          <div className="mt-1.5 min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-zinc-500">Sin pedidos vinculados.</p>
            ) : (
              <table className="min-w-full text-left text-[13px] leading-snug sm:text-sm">
                <thead className="sticky top-0 z-[1] bg-white dark:bg-zinc-950">
                  <tr className="border-b border-zinc-200/70 dark:border-zinc-800">
                    <th className={thClass}>Factura</th>
                    <th className={thClass}>Fecha</th>
                    <th className={thClass}>Estado</th>
                    <th className={`${thClass} pr-0 text-right`}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => {
                    const ref = ventaNumeroReferencia(o.id);
                    const created =
                      typeof o.created_at === "string"
                        ? formatStoreDateTime(o.created_at, {
                            day: "numeric",
                            month: "short",
                          })
                        : "—";
                    const st = orderStatusLabel[o.status] ?? o.status;
                    const pago = ventaFormaPagoBadge(o.wompi_reference, {
                      checkoutPaymentMethod: o.checkout_payment_method,
                    });
                    return (
                      <tr
                        key={o.id}
                        className="border-b border-zinc-100/80 last:border-0 dark:border-zinc-800/80"
                      >
                        <td className="py-1.5 pr-3 align-middle">
                          <Link
                            href={`/admin/orders/${o.id}`}
                            className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                          >
                            #{ref}
                          </Link>
                          <span className="mt-0.5 block text-[11px] text-zinc-400">
                            {pago.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap py-1.5 pr-3 align-middle text-zinc-600 dark:text-zinc-300">
                          {created}
                        </td>
                        <td className="py-1.5 pr-3 align-middle text-zinc-600 dark:text-zinc-300">
                          {st}
                        </td>
                        <td className="py-1.5 text-right align-middle tabular-nums text-zinc-900 dark:text-zinc-100">
                          {formatCop(Number(o.total_cents ?? 0))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
