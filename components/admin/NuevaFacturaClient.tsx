"use client";

import { NewInvoiceForm, NewInvoiceHeader } from "@/components/admin/NewInvoiceForm";
import type { QuotationEditDraft } from "@/lib/load-quotation-edit-draft";

export function NuevaFacturaClient({
  initialError,
  initialCustomerId,
  editQuotation,
  canUseCredit = true,
  canUseKits = true,
  allowHigherPrice = false,
}: {
  initialError?: string;
  initialCustomerId?: string;
  editQuotation?: QuotationEditDraft;
  canUseCredit?: boolean;
  canUseKits?: boolean;
  allowHigherPrice?: boolean;
}) {
  return (
    <>
      <NewInvoiceHeader editQuotation={editQuotation} />
      <NewInvoiceForm
        initialError={initialError}
        initialCustomerId={initialCustomerId}
        editQuotation={editQuotation}
        canUseCredit={canUseCredit}
        canUseKits={canUseKits}
        allowHigherPrice={allowHigherPrice}
      />
    </>
  );
}
