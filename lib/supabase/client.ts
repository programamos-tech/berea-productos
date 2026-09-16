import { createBrowserClient } from "@supabase/ssr";
import {
  ACTIVE_BRANCH_COOKIE,
  ACTIVE_BRANCH_HEADER,
  isBranchId,
} from "@/lib/branch-context";

export function createSupabaseBrowserClient() {
  const branchId =
    typeof document === "undefined"
      ? null
      : document.cookie
          .split(";")
          .map((part) => part.trim())
          .find((part) => part.startsWith(`${ACTIVE_BRANCH_COOKIE}=`))
          ?.slice(ACTIVE_BRANCH_COOKIE.length + 1);
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: isBranchId(branchId)
          ? { [ACTIVE_BRANCH_HEADER]: branchId }
          : {},
      },
    },
  );
}
