import { TenantOnboardingWizard } from "@/components/admin/TenantOnboardingWizard";
import { adminProductBrand } from "@/lib/brand";

export const dynamic = "force-dynamic";

/**
 * Entrada SaaS en productos.bereahouse.com — alta de tienda + dueño.
 * No usa el layout de la tienda Milagros/Aleya.
 */
export default function PlatformEmpezarPage() {
  return (
    <div className="flex min-h-[min(70dvh,40rem)] flex-col gap-5">
      <header className="shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
          {adminProductBrand} · Productos
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Registra tu tienda
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500">
          Creá tu cuenta de dueño y tu espacio en{" "}
          <span className="font-medium text-zinc-700">
            tu-tienda.productos.bereahouse.com
          </span>
          . Empezás con panel vacío: inventario, ventas y caja listos para
          configurar.
        </p>
      </header>
      <TenantOnboardingWizard variant="public" />
    </div>
  );
}
