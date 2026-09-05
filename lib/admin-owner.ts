/** Fallback de marca si no hay perfil/sesión (p. ej. builds estáticos). */
export const adminOwnerDisplayName =
  process.env.NEXT_PUBLIC_ADMIN_OWNER_NAME ?? "Berea Productos";

/** Correo visible; por defecto el de la plataforma. */
export const adminOwnerEmail = (
  process.env.NEXT_PUBLIC_ADMIN_OWNER_EMAIL ??
  process.env.NEXT_PUBLIC_PLATFORM_EMAIL ??
  ""
).trim();

/**
 * Semilla legacy (DiceBear). El top bar usa `AdminUserAvatar` con iniciales.
 */
export const adminOwnerAvatarSeed =
  process.env.NEXT_PUBLIC_ADMIN_OWNER_AVATAR_SEED?.trim() ||
  adminOwnerEmail.toLowerCase() ||
  adminOwnerDisplayName.toLowerCase();
