"use client";

import { LogIn } from "lucide-react";
import { useTransition, type ReactNode } from "react";
import { enterCustomerAccount } from "@/app/actions/admin/platform-accounts";
import { useAccountSwitchLoading } from "@/components/admin/AccountSwitchLoading";
import type { OperatorAccountRow } from "@/lib/operator-accounts";

function enterAccount(tenantId: string) {
  const fd = new FormData();
  fd.set("tenant_id", tenantId);
  return enterCustomerAccount(fd);
}

export function OperatorAccountEnterButton({
  row,
  className,
  children,
}: {
  row: Pick<OperatorAccountRow, "id" | "tradeName" | "logoSrc" | "holderName">;
  className?: string;
  children?: ReactNode;
}) {
  const beginSwitch = useAccountSwitchLoading();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      className={className}
      title="Ingresar"
      aria-label={`Ingresar a ${row.tradeName}`}
      onClick={() => {
        beginSwitch({
          mode: "enter",
          name: row.tradeName,
          logoSrc: row.logoSrc,
          holderName: row.holderName,
        });
        startTransition(() => {
          enterAccount(row.id);
        });
      }}
    >
      {children ?? <LogIn className="size-4" strokeWidth={2} aria-hidden />}
    </button>
  );
}
