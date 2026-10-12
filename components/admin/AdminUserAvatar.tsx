import { createAvatar } from "@dicebear/core";
import * as adventurer from "@dicebear/adventurer";
import Image from "next/image";

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
 * Avatar ilustrado Adventurer (DiceBear) sobre mist teal Berea House.
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

  const svg = createAvatar(adventurer, {
    seed: safe,
    size,
    backgroundColor: ["e6f6fa"],
    radius: 50,
  }).toString();

  return (
    <span
      className={`pointer-events-none inline-flex shrink-0 select-none overflow-hidden rounded-full shadow-[0_0_0_1px_color-mix(in_srgb,#0197b2_28%,transparent)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.12)] [&_svg]:pointer-events-none [&_svg]:block [&_svg]:size-full [&_svg]:select-none ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
      role="img"
      aria-label={`Avatar de ${displayName}`}
    />
  );
}

/** Lobo de Berea, en negro, para la ficha del usuario en la barra. */
export function AdminWolfAvatar({ size = 40 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
      style={{ width: size, height: size }}
      role="img"
      aria-label="Berea"
    >
      <Image
        src="/logo-berea-wolf-mark.png"
        alt=""
        width={68}
        height={68}
        unoptimized
        className="h-[78%] w-auto object-contain brightness-0 dark:invert"
      />
    </span>
  );
}
