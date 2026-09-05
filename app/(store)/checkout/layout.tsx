import { CheckoutViewGate } from "@/components/store/CheckoutViewGate";

/**
 * Gate de carga para el segmento checkout (formulario).
 * return/transferencia tienen sus propias rutas hijas bajo este layout —
 * el gate aplica a todo el segmento; las páginas hijas también llevan
 * data-checkout-root si hace falta revelar.
 */
export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CheckoutViewGate>{children}</CheckoutViewGate>;
}
