/** Iniciales a partir del nombre visible (estilo marca Berea). */
export function adminUserInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "BP";
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const first = parts[0][0] ?? "";
  const last = parts[parts.length - 1][0] ?? "";
  return `${first}${last}`.toUpperCase() || "BP";
}

type Props = {
  displayName: string;
  size?: number;
  className?: string;
};

/**
 * Avatar circular con iniciales sobre coral Berea (sin DiceBear / Notionists).
 */
export function AdminUserAvatar({
  displayName,
  size = 40,
  className = "",
}: Props) {
  const initials = adminUserInitials(displayName);
  const fontSize = Math.round(size * 0.36);

  return (
    <span
      className={`pointer-events-none inline-flex shrink-0 select-none items-center justify-center rounded-full bg-[var(--admin-coral)] font-semibold tracking-wide text-white shadow-[0_0_0_1px_color-mix(in_srgb,var(--admin-coral-deep)_28%,transparent)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.12)] ${className}`}
      style={{ width: size, height: size, fontSize }}
      role="img"
      aria-label={`Avatar de ${displayName}`}
    >
      {initials}
    </span>
  );
}
