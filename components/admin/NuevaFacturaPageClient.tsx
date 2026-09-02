"use client";

import nextDynamic from "next/dynamic";
import { NuevaFacturaLoading } from "@/components/admin/NuevaFacturaLoading";
import type { QuotationEditDraft } from "@/lib/load-quotation-edit-draft";

const NuevaFacturaClient = nextDynamic(
  () =>
    import("@/components/admin/NuevaFacturaClient").then(
      (mod) => mod.NuevaFacturaClient,
    ),
  {
    loading: () => <NuevaFacturaLoading />,
    // El formulario POS es pesado (~1600 líneas); cargarlo solo en cliente evita
    // timeouts intermitentes del payload RSC en redes lentas o cold starts.
    ssr: false,
  },
);

export function NuevaFacturaPageClient({
  initialError,
  initialCustomerId,
  editQuotation,
}: {
  initialError?: string;
  initialCustomerId?: string;
  editQuotation?: QuotationEditDraft;
}) {
  return (
    <NuevaFacturaClient
      initialError={initialError}
      initialCustomerId={initialCustomerId}
      editQuotation={editQuotation}
    />
  );
}
