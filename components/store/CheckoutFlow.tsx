"use client";

import Link from "next/link";
import { useEffect, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { CheckoutSubmitButton } from "@/components/store/CheckoutCitySelect";
import { CheckoutSubmittingOverlay } from "@/components/store/CheckoutSubmittingOverlay";
import { useCheckoutShipping } from "@/components/store/CheckoutShippingProvider";
import { formatCop } from "@/lib/money";
import { SHIPPING_CITY_OTHER } from "@/lib/store-shipping";
import { transferProofRejection } from "@/lib/transfer-proof-file";

export type CheckoutFlowStep = 1 | 2 | 3;

const STEPS: { n: CheckoutFlowStep; label: string }[] = [
  { n: 1, label: "Pedido" },
  { n: 2, label: "Envío" },
  { n: 3, label: "Pago" },
];

type FieldProblem = {
  message: string;
  focus: string;
};

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  initialStep: CheckoutFlowStep;
  primaryClassName: string;
  secondaryClassName: string;
  cart: ReactNode;
  shipping: ReactNode;
  payment: ReactNode;
  coupon: ReactNode;
  summary: ReactNode;
  storefrontBranchCode: string;
  storefrontBranchSig: string;
};

function readField(form: HTMLFormElement, name: string): string {
  const el = form.elements.namedItem(name);
  if (el instanceof RadioNodeList) return String(el.value ?? "").trim();
  if (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  ) {
    return el.value.trim();
  }
  return "";
}

function shippingProblem(form: HTMLFormElement): FieldProblem | null {
  if (!readField(form, "firstName") || !readField(form, "lastName")) {
    return {
      message: "Ingresa nombre y apellido para continuar.",
      focus: "firstName",
    };
  }
  if (!readField(form, "address")) {
    return {
      message: "Escribe la dirección de entrega.",
      focus: "address",
    };
  }
  if (!readField(form, "neighborhood")) {
    return {
      message: "Falta el barrio. Con eso coordinamos la entrega.",
      focus: "neighborhood",
    };
  }
  const municipality = readField(form, "shipping_municipality_id");
  if (!municipality || municipality === SHIPPING_CITY_OTHER) {
    return {
      message: "Selecciona el municipio de envío.",
      focus: "checkout-municipality-trigger",
    };
  }
  if (!readField(form, "mobile")) {
    return {
      message: "Escribe un teléfono o WhatsApp de contacto.",
      focus: "mobile",
    };
  }
  const email = readField(form, "email");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      message: "Escribe un correo válido para el comprobante.",
      focus: "email",
    };
  }
  return null;
}

export function CheckoutFlow({
  action,
  initialStep,
  primaryClassName,
  secondaryClassName,
  cart,
  shipping,
  payment,
  coupon,
  summary,
  storefrontBranchCode,
  storefrontBranchSig,
}: Props) {
  const [step, setStep] = useState<CheckoutFlowStep>(initialStep);
  const [maxReached, setMaxReached] = useState<CheckoutFlowStep>(initialStep);
  const [stepError, setStepError] = useState<string | null>(null);
  const [focusName, setFocusName] = useState<string | null>(null);
  const [isSubmitting, startSubmit] = useTransition();
  const { totalWithShippingCents, isOtherCity } = useCheckoutShipping();

  useEffect(() => {
    if (!focusName) return;
    const el = document.querySelector<HTMLElement>(
      focusName.startsWith("checkout-")
        ? `#${focusName}`
        : `[data-checkout-form] [name="${focusName}"]`,
    );
    el?.focus();
    setFocusName(null);
  }, [focusName, step]);

  function showProblem(problem: FieldProblem) {
    setStep(2);
    setMaxReached((current) => (current < 2 ? 2 : current));
    setStepError(problem.message);
    setFocusName(problem.focus);
  }

  function advance(next: CheckoutFlowStep) {
    setStepError(null);
    setStep(next);
    setMaxReached((current) => (next > current ? next : current));
    document
      .querySelector("[data-checkout-flow]")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goTo(target: CheckoutFlowStep, form: HTMLFormElement | null) {
    if (target === step) return;
    if (target > maxReached) return;
    if (target === 3) {
      if (!form) return;
      const problem = shippingProblem(form);
      if (problem) {
        showProblem(problem);
        return;
      }
    }
    setStepError(null);
    setStep(target);
    document
      .querySelector("[data-checkout-flow]")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function continueToPay(formEl: HTMLFormElement | null) {
    if (!formEl) return;
    const problem = shippingProblem(formEl);
    if (problem) {
      showProblem(problem);
      return;
    }
    if (isOtherCity) return;
    advance(3);
  }

  function goBack() {
    setStepError(null);
    setStep((current) => (current === 3 ? 2 : 1));
    document
      .querySelector("[data-checkout-flow]")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (step === 1) {
      event.preventDefault();
      advance(2);
      return;
    }
    const problem = shippingProblem(event.currentTarget);
    if (problem) {
      event.preventDefault();
      showProblem(problem);
      return;
    }
    if (step === 2 || isOtherCity) {
      event.preventDefault();
      if (!isOtherCity) advance(3);
      return;
    }
    event.preventDefault();
    if (isSubmitting) return;
    const proof = event.currentTarget.querySelector<HTMLInputElement>(
      'input[name="proof"]',
    );
    const file = proof?.files?.[0] ?? null;
    const proofError = transferProofRejection(
      file ? { size: file.size, type: file.type, name: file.name } : null,
    );
    if (proofError || !file) {
      setStep(3);
      setStepError(
        proofError ?? "Selecciona el comprobante de la transferencia.",
      );
      return;
    }
    const formData = new FormData(event.currentTarget);
    formData.set("proof", file);
    setStepError(null);
    startSubmit(() => {
      void action(formData);
    });
  }

  const copy =
    step === 1
      ? {
          kicker: "Paso 1 de 3",
          title: "Revisa tu pedido",
          lead: "Confirma productos y cantidades. La dirección la pedimos en el siguiente paso.",
        }
      : step === 2
        ? {
            kicker: "Paso 2 de 3",
            title: "Datos de envío",
            lead: "Pedido confirmado. Ahora dinos a dónde lo enviamos.",
          }
        : {
            kicker: "Paso 3 de 3",
            title: "Comprobante de pago",
            lead: "Transfiere el total y sube el comprobante. El pedido entra al sistema cuando el archivo queda cargado.",
          };

  return (
    <form
      action={action}
      noValidate
      data-checkout-form
      encType="multipart/form-data"
      onSubmit={onSubmit}
      className="scroll-mt-28"
      data-checkout-flow
    >
      <input type="hidden" name="storefront_branch" value={storefrontBranchCode} />
      <input type="hidden" name="storefront_branch_sig" value={storefrontBranchSig} />
      <CheckoutSubmittingOverlay active={isSubmitting} />
      <nav aria-label="Pasos del pedido">
        <ol className="grid grid-cols-3">
          {STEPS.map((item) => {
            const done = item.n < step;
            const current = item.n === step;
            const open = item.n <= maxReached;
            const circle = current
              ? "bg-[var(--store-accent)] text-white"
              : done
                ? "bg-stone-900 text-white"
                : "border border-stone-300 bg-white text-stone-400";
            const label = current
              ? "text-[var(--store-brand)]"
              : done
                ? "text-stone-800"
                : "text-stone-400";
            const marker = (
              <>
                {item.n > 1 ? (
                  <span
                    className={`absolute top-3.5 right-1/2 left-0 h-px ${
                      item.n <= step ? "bg-stone-900" : "bg-stone-200"
                    }`}
                    aria-hidden
                  />
                ) : null}
                {item.n < 3 ? (
                  <span
                    className={`absolute top-3.5 right-0 left-1/2 h-px ${
                      item.n < step ? "bg-stone-900" : "bg-stone-200"
                    }`}
                    aria-hidden
                  />
                ) : null}
                <span
                  className={`relative z-10 flex size-7 items-center justify-center rounded-full text-[12px] font-semibold ${circle}`}
                >
                  {done ? "✓" : item.n}
                </span>
                <span
                  className={`mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] ${label}`}
                >
                  {item.label}
                </span>
              </>
            );

            return (
              <li key={item.n} className="relative flex flex-col items-center">
                {open && !current ? (
                  <button
                    type="button"
                    className="flex flex-col items-center"
                    onClick={(event) =>
                      goTo(item.n, event.currentTarget.closest("form"))
                    }
                  >
                    {marker}
                  </button>
                ) : (
                  <div
                    className="flex flex-col items-center"
                    aria-current={current ? "step" : undefined}
                  >
                    {marker}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="mt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
          {copy.kicker}
        </p>
        <h1 className="mt-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--store-brand)] sm:text-[15px] sm:tracking-[0.26em]">
          {copy.title}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-500">
          {copy.lead}
        </p>
        {stepError ? (
          <p
            role="alert"
            className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          >
            {stepError}
          </p>
        ) : null}
        {step > 1 ? (
          <button
            type="button"
            onClick={goBack}
            className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500 transition hover:text-stone-900 lg:hidden"
          >
            {step === 3 ? "Volver al envío" : "Volver al pedido"}
          </button>
        ) : null}
      </div>

      <div className="mt-8 grid gap-12 pb-24 lg:grid-cols-[1fr_min(100%,340px)] lg:items-start lg:pb-0 xl:gap-16">
        <div className="min-w-0">
          <div hidden={step !== 1}>{cart}</div>
          <div hidden={step !== 2}>{shipping}</div>
          <div hidden={step !== 3}>{payment}</div>
        </div>

        <aside className="space-y-6 bg-[#f4f4f3] p-6 lg:sticky lg:top-28 lg:p-8">
          <div hidden={step !== 3}>{coupon}</div>
          {summary}
          <div className="hidden space-y-3 lg:block">
            <StepActions
              step={step}
              isOtherCity={isOtherCity}
              primaryClassName={primaryClassName}
              secondaryClassName={secondaryClassName}
              busy={isSubmitting}
              onConfirm={() => advance(2)}
              onContinue={continueToPay}
              onBack={goBack}
            />
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-16px_rgba(0,0,0,0.25)] lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3 pr-16">
          <div className="min-w-0 shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
              Total
            </p>
            <p className="text-sm font-semibold tabular-nums text-stone-900">
              {formatCop(totalWithShippingCents)}
            </p>
          </div>
          <div className="min-w-0 flex-1">
            <StepActions
              step={step}
              isOtherCity={isOtherCity}
              primaryClassName={primaryClassName}
              secondaryClassName={secondaryClassName}
              compact
              busy={isSubmitting}
              onConfirm={() => advance(2)}
              onContinue={continueToPay}
              onBack={goBack}
            />
          </div>
        </div>
      </div>
    </form>
  );
}

function StepActions({
  step,
  isOtherCity,
  primaryClassName,
  secondaryClassName,
  compact = false,
  busy = false,
  onConfirm,
  onContinue,
  onBack,
}: {
  step: CheckoutFlowStep;
  isOtherCity: boolean;
  primaryClassName: string;
  secondaryClassName: string;
  compact?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onContinue: (form: HTMLFormElement | null) => void;
  onBack: () => void;
}) {
  if (step === 3) {
    return (
      <>
        <CheckoutSubmitButton className={primaryClassName} busy={busy} />
        {compact ? null : (
          <button
            type="button"
            onClick={onBack}
            className="w-full py-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500 transition hover:text-stone-900"
          >
            Volver al envío
          </button>
        )}
      </>
    );
  }

  if (step === 2) {
    return (
      <>
        <button
          type="button"
          className={primaryClassName}
          onClick={(event) => onContinue(event.currentTarget.closest("form"))}
        >
          Continuar al pago
        </button>
        {isOtherCity && !compact ? (
          <p className="text-center text-xs leading-relaxed text-stone-500">
            Para municipios no listados, completa el pedido por WhatsApp.
          </p>
        ) : null}
        {compact ? null : (
          <button
            type="button"
            onClick={onBack}
            className="w-full py-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500 transition hover:text-stone-900"
          >
            Volver al pedido
          </button>
        )}
      </>
    );
  }

  return (
    <>
      <button type="button" className={primaryClassName} onClick={onConfirm}>
        Confirmar pedido
      </button>
      {compact ? null : (
        <Link href="/products" className={secondaryClassName}>
          Seguir comprando
        </Link>
      )}
    </>
  );
}
