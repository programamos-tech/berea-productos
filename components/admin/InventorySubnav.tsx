import Link from "next/link";
import {
  adminToolbarBtnActiveClass,
  adminToolbarBtnBaseClass,
  adminToolbarBtnIdleClass,
} from "@/lib/admin-ui";

type InventorySubnavProps = {
  active: "products" | "kits";
  showProducts?: boolean;
  showKits?: boolean;
};

export function InventorySubnav({
  active,
  showProducts = true,
  showKits = true,
}: InventorySubnavProps) {
  if (!showProducts && !showKits) return null;
  if (showProducts && !showKits && active === "products") return null;
  if (!showProducts && showKits && active === "kits") return null;

  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      role="tablist"
      aria-label="Sección de inventario"
    >
      {showProducts ? (
        <Link
          href="/admin/products"
          role="tab"
          aria-selected={active === "products"}
          className={`${adminToolbarBtnBaseClass} ${
            active === "products"
              ? adminToolbarBtnActiveClass
              : adminToolbarBtnIdleClass
          }`}
        >
          Productos
        </Link>
      ) : null}
      {showKits ? (
        <Link
          href="/admin/kits"
          role="tab"
          aria-selected={active === "kits"}
          className={`${adminToolbarBtnBaseClass} ${
            active === "kits"
              ? adminToolbarBtnActiveClass
              : adminToolbarBtnIdleClass
          }`}
        >
          Kits
        </Link>
      ) : null}
    </div>
  );
}
