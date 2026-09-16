export const ACTIVE_BRANCH_COOKIE = "berea_active_branch" as const;
export const ACTIVE_BRANCH_HEADER = "x-berea-branch-id" as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isBranchId(raw: string | null | undefined): raw is string {
  return Boolean(raw && UUID_RE.test(raw.trim()));
}

export type BranchRef = {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  logoPath: string | null;
  isDefault: boolean;
  isActive: boolean;
};

export type BranchContext = {
  active: BranchRef;
  available: BranchRef[];
};
