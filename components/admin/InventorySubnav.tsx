import Link from "next/link";
import {
  adminToolbarBtnActiveClass,
  adminToolbarBtnBaseClass,
  adminToolbarBtnIdleClass,
} from "@/lib/admin-ui";

type InventoryTab = "products" | "kits" | "transfers";

type InventorySubnavProps = {
  active: InventoryTab;
  showProducts?: boolean;
  showKits?: boolean;
  showTransfers?: boolean;
};

const TABS: { id: InventoryTab; href: string; label: string }[] = [
  { id: "products", href: "/admin/products", label: "Productos" },
  { id: "transfers", href: "/admin/traslados", label: "Traslados" },
  { id: "kits", href: "/admin/kits", label: "Kits" },
];

export function InventorySubnav({
  active,
  showProducts = true,
  showKits = true,
  showTransfers = false,
}: InventorySubnavProps) {
  const visible = TABS.filter((tab) => {
    if (tab.id === "products") return showProducts;
    if (tab.id === "kits") return showKits;
    return showTransfers;
  });
  if (visible.length < 2) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      role="tablist"
      aria-label="Sección de inventario"
    >
      {visible.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          role="tab"
          aria-selected={active === tab.id}
          className={`${adminToolbarBtnBaseClass} ${
            active === tab.id
              ? adminToolbarBtnActiveClass
              : adminToolbarBtnIdleClass
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
