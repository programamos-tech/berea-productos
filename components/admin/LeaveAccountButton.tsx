"use client";

import type { ReactNode } from "react";
import { useTransition } from "react";
import { leaveCustomerAccount } from "@/app/actions/admin/platform-accounts";
import { useAccountSwitchLoading } from "@/components/admin/AccountSwitchLoading";

export function LeaveAccountButton({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  const beginSwitch = useAccountSwitchLoading();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      className={className}
      onClick={() => {
        onClick?.();
        beginSwitch({ mode: "leave" });
        startTransition(() => {
          leaveCustomerAccount();
        });
      }}
    >
      {children}
    </button>
  );
}
