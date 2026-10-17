import { notFound, redirect } from "next/navigation";
import { AccountModulePreview } from "@/components/admin/AccountModulePreview";
import {
  accountModuleById,
  isAccountModuleEnabled,
  isAccountModuleId,
} from "@/lib/admin-account-modules";
import { ADMIN_FORBIDDEN_REDIRECT, requireAdminSession } from "@/lib/require-admin-permission";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ moduleId: string }>;
};

export default async function AccountModulePreviewPage({ params }: Props) {
  const { moduleId } = await params;
  if (!isAccountModuleId(moduleId)) notFound();
  const mod = accountModuleById(moduleId);
  if (!mod || mod.listed === false) notFound();

  const perm = await requireAdminSession();
  if (isAccountModuleEnabled(perm.disabledModules, moduleId)) {
    const canOpen = mod.permissionKeys.some((key) => perm.permissions[key]);
    if (canOpen && mod.href) redirect(mod.href);
    redirect(ADMIN_FORBIDDEN_REDIRECT);
  }

  return (
    <AccountModulePreview
      module={mod}
      tenantName={perm.tenantName}
      branchName={perm.branchContext.active.name}
    />
  );
}
