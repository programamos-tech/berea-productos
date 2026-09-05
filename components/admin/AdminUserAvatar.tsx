import { createAvatar } from "@dicebear/core";
import * as notionists from "@dicebear/notionists";

/** Iniciales a partir del nombre visible (fallback / otros usos). */
export function adminUserInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "BH";
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const first = parts[0][0] ?? "";
  const last = parts[parts.length - 1][0] ?? "";
  return `${first}${last}`.toUpperCase() || "BH";
}

type Props = {
  displayName: string;
  /** Semilla estable (email) → mismo personaje siempre. */
  seed?: string;
  size?: number;
  className?: string;
};

/**
 * Avatar con personaje Notionists sobre teal Berea House (#0197b2).
 */
export function AdminUserAvatar({
  displayName,
  seed,
  size = 40,
  className = "",
}: Props) {
  const safe =
    seed?.trim() ||
    displayName.trim().toLowerCase() ||
    "berea-house";

  const svg = createAvatar(notionists, {
    seed: safe,
    size,
    backgroundColor: ["0197b2"],
    radius: 50,
  }).toString();

  return (
    <span
      className={`pointer-events-none inline-flex shrink-0 select-none overflow-hidden rounded-full shadow-[0_0_0_1px_color-mix(in_srgb,#0197b2_35%,transparent)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.12)] [&_svg]:pointer-events-none [&_svg]:block [&_svg]:size-full [&_svg]:select-none ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
      role="img"
      aria-label={`Avatar de ${displayName}`}
    />
  );
}
