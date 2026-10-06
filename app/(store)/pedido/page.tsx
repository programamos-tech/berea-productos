import Link from "next/link";
import { notFound } from "next/navigation";
import { ClearCheckoutFormDraft } from "@/components/store/ClearCheckoutFormDraft";
import { StoreOrderDetailPanel } from "@/components/store/StoreOrderDetailPanel";
import { getTransferBankInstructions } from "@/lib/transfer-bank-instructions";
import { buildStoreOrderTrackingUrl } from "@/lib/store-order-tracking-url";
import { formatStoreDateTime } from "@/lib/store-datetime-format";
import { loadStoreOrderDetailByTransferToken } from "@/lib/store-order-detail-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStorefrontChromeForRequest } from "@/lib/tenant-context";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Detalle del pedido",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PedidoSeguimientoPage({ searchParams }: Props) {
  const sp = await searchParams;
  const orderId = typeof sp.order_id === "string" ? sp.order_id.trim() : "";
  const token = typeof sp.t === "string" ? sp.t.trim() : "";
  if (!orderId || !token) notFound();

  const order = await loadStoreOrderDetailByTransferToken(orderId, token);
  if (!order) notFound();

  const checkoutPm = order.checkoutPaymentMethod ?? "";
  if (checkoutPm !== "transfer") notFound();

  const [sessionSb, chrome] = await Promise.all([
    createSupabaseServerClient(),
    getStorefrontChromeForRequest(),
  ]);
  const {
    data: { user },
  } = await sessionSb.auth.getUser();

  let showAccountLinks = false;
  if (user?.email) {
    const { data: adminProf } = await sessionSb
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    showAccountLinks = !adminProf;
  }

  const trackingUrl = buildStoreOrderTrackingUrl(orderId, token);
  const instructions = getTransferBankInstructions(
    chrome.bank,
    chrome.tenantSlug === "aleya",
  );
  const createdAtLabel = formatStoreDateTime(order.createdAt, {
    dateStyle: "full",
    timeStyle: "short",
  });

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-white">
      <ClearCheckoutFormDraft />
      <div
        className={`store-page-stagger mx-auto max-w-6xl px-4 sm:px-6 ${
          order.proofCount > 0
            ? "pb-8 pt-4 lg:pb-10 lg:pt-5"
            : "pb-12 pt-8 lg:pb-14 lg:pt-10"
        }`}
      >
        <nav
          aria-label="Migas de pan"
          className={`store-page-stagger-item text-[11px] uppercase tracking-[0.12em] text-stone-400 ${
            order.proofCount > 0 ? "mb-3" : "mb-6"
          }`}
        >
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li>
              <Link href="/" className="transition hover:text-stone-800">
                Inicio
              </Link>
            </li>
            <li aria-hidden className="text-stone-300">
              /
            </li>
            <li>
              <Link href="/checkout" className="transition hover:text-stone-800">
                Bolsa
              </Link>
            </li>
            <li aria-hidden className="text-stone-300">
              /
            </li>
            <li className="text-stone-600">Pedido</li>
          </ol>
        </nav>

        {order.proofCount > 0 ? null : (
          <h1 className="store-page-stagger-item text-sm font-semibold uppercase tracking-[0.22em] text-[var(--store-brand)] sm:text-[15px] sm:tracking-[0.26em]">
            Detalle del pedido
          </h1>
        )}

        <div className={`store-page-stagger-item ${order.proofCount > 0 ? "mt-3" : "mt-8"}`}>
          <StoreOrderDetailPanel
            orderId={orderId}
            token={token}
            trackingUrl={trackingUrl}
            status={order.status}
            fulfillmentStatus={order.fulfillmentStatus}
            checkoutPaymentMethod={checkoutPm}
            createdAtLabel={createdAtLabel}
            totalCents={order.totalCents}
            customerName={order.customerName}
            customerEmail={order.customerEmail}
            shippingPhone={order.shippingPhone}
            shippingAddress={order.shippingAddress}
            shippingCity={order.shippingCity}
            shippingNeighborhood={order.shippingNeighborhood}
            shippingReference={order.shippingReference}
            shippingPostalCode={order.shippingPostalCode}
            shippingCents={order.shippingCents}
            orderLines={order.orderLines}
            instructions={instructions}
            isGuest={false}
            showAccountLinks={showAccountLinks}
            proofCount={order.proofCount}
            branchName={order.branchName}
          />
        </div>
      </div>
    </div>
  );
}
