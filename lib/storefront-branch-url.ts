/** Ruta de la tienda que corresponde a una sucursal. */
export function storefrontPathForBranch(branch: {
  code: string;
  isDefault: boolean;
}): string {
  const code = branch.code.trim().toLowerCase();
  if (branch.isDefault || !code || code === "local") return "/";
  return `/sucursal/${encodeURIComponent(code)}`;
}

/** URL absoluta de esa tienda. Local queda en la raíz; Bodega en `/sucursal/bodega`. */
export function storefrontUrlForBranch(
  origin: string,
  branch: { code: string; isDefault: boolean },
): string {
  const base = origin.trim().replace(/\/$/, "");
  const path = storefrontPathForBranch(branch);
  return path === "/" ? base : `${base}${path}`;
}

/** Host y ruta, sin protocolo, para mostrar en el backoffice. */
export function storefrontUrlLabel(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}
