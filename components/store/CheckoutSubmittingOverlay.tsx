"use client";

import { useFormStatus } from "react-dom";
import {
  STORE_CHECKOUT_SUBMIT_MESSAGES,
  StoreMotivationalOverlay,
} from "@/components/store/StoreMotivationalOverlay";

/**
 * Overlay a pantalla completa mientras corre `startCheckout`.
 * Debe vivir dentro del `<form>` (usa `useFormStatus`).
 */
export function CheckoutSubmittingOverlay({ active = false }: { active?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <StoreMotivationalOverlay
      active={pending || active}
      messages={STORE_CHECKOUT_SUBMIT_MESSAGES}
    />
  );
}
