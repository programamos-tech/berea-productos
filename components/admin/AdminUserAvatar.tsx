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
 * Avatar de iniciales neutro (zinc) — el coral queda para CTAs, no chrome.
 */
export function AdminUserAvatar({
  displayName,
  size = 40,
  className = "",
}: Props) {
  const initials = adminUserInitials(displayName);
  const fontSize = Math.round(size * 0.34);

  return (
    <span
      className={`pointer-events-none inline-flex shrink-0 select-none items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 font-semibold tracking-[0.04em] text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 ${className}`}
      style={{ width: size, height: size, fontSize }}
      role="img"
      aria-label={`Avatar de ${displayName}`}
    >
      {initials}
    </span>
  );
}
