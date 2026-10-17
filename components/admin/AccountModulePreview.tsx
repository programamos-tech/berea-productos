import {
  adminSupportWhatsAppUrl,
} from "@/lib/brand";
import type { AccountModuleDef, AccountModuleId } from "@/lib/admin-account-modules";

const PREVIEWS: Record<
  AccountModuleId,
  { columns: string[]; rows: string[][] }
> = {
  reportes: {
    columns: ["Periodo", "Ventas", "Gastos", "Resultado"],
    rows: [
      ["Hoy", "$ 1.240.000", "$ 180.000", "$ 1.060.000"],
      ["Esta semana", "$ 6.480.000", "$ 920.000", "$ 5.560.000"],
      ["Este mes", "$ 28.150.000", "$ 4.300.000", "$ 23.850.000"],
    ],
  },
  caja: {
    columns: ["Día", "Apertura", "Ventas", "Estado"],
    rows: [
      ["Hoy", "$ 200.000", "$ 1.240.000", "Abierta"],
      ["Ayer", "$ 150.000", "$ 980.000", "Cerrada"],
      ["12 oct", "$ 180.000", "$ 1.410.000", "Cerrada"],
    ],
  },
  ventas: {
    columns: ["Factura", "Cliente", "Pago", "Total"],
    rows: [
      ["FV-1042", "Distribuidora Andina", "Efectivo", "$ 186.000"],
      ["FV-1041", "Laura Méndez", "Transferencia", "$ 94.500"],
      ["COT-18", "Boutique Luna", "Cotización", "$ 320.000"],
    ],
  },
  creditos: {
    columns: ["Factura", "Cliente", "Pagado", "Pendiente"],
    rows: [
      ["FV-0988", "Distribuidora Andina", "$ 150.000", "$ 420.000"],
      ["FV-0971", "Carmen Ruiz", "$ 80.000", "$ 120.000"],
      ["FV-0964", "Boutique Luna", "$ 0", "$ 310.000"],
    ],
  },
  proveedores: {
    columns: ["Orden", "Proveedor", "Recepción", "Saldo"],
    rows: [
      ["OC-220", "Milagros", "Recibiendo", "$ 8.789.280"],
      ["OC-218", "Insumos del Valle", "Enviada", "$ 1.200.000"],
      ["OC-211", "Empaques Norte", "Recibido", "$ 0"],
    ],
  },
  egresos: {
    columns: ["Fecha", "Concepto", "Método", "Valor"],
    rows: [
      ["Hoy", "Arriendo del local", "Transferencia", "$ 1.800.000"],
      ["Ayer", "Papelería", "Efectivo", "$ 45.000"],
      ["12 oct", "Servicios", "Transferencia", "$ 210.000"],
    ],
  },
  inventario: {
    columns: ["Producto", "Referencia", "Stock", "Precio"],
    rows: [
      ["Crema corporal 250 ml", "MG-250", "18", "$ 42.000"],
      ["Aceite de coco", "MG-AC", "6", "$ 28.500"],
      ["Kit de viaje", "MG-KIT", "11", "$ 65.000"],
    ],
  },
  traslados: {
    columns: ["Traslado", "Desde", "Hacia", "Unidades"],
    rows: [
      ["TR-14", "Centro", "Bodega", "24"],
      ["TR-13", "Bodega", "Norte", "8"],
      ["TR-12", "Norte", "Centro", "3"],
    ],
  },
  kits: {
    columns: ["Kit", "Productos", "Precio", "Estado"],
    rows: [
      ["Rutina de noche", "3", "$ 96.000", "Activo"],
      ["Viaje", "2", "$ 54.000", "Activo"],
      ["Regalo", "4", "$ 120.000", "Borrador"],
    ],
  },
  clientes: {
    columns: ["Cliente", "Documento", "Teléfono", "Saldo"],
    rows: [
      ["Distribuidora Andina", "900.123.456", "300 000 0000", "$ 420.000"],
      ["Carmen Ruiz", "1.023.456.789", "310 000 0000", "$ 120.000"],
      ["Boutique Luna", "901.555.010", "320 000 0000", "$ 0"],
    ],
  },
  equipo: {
    columns: ["Persona", "Rol", "Sucursal", "Acceso"],
    rows: [
      ["Ana Gómez", "Administrador", "Centro", "Ventas y caja"],
      ["Luis Pérez", "Venta", "Norte", "Mostrador"],
      ["Marta Díaz", "Inventario", "Bodega", "Productos"],
    ],
  },
  sucursales: {
    columns: ["Sucursal", "Ciudad", "Caja", "Productos"],
    rows: [
      ["Centro", "Guacarí", "Abierta", "240"],
      ["Norte", "Guacarí", "Cerrada", "180"],
      ["Bodega", "Guacarí", "—", "860"],
    ],
  },
  registros: {
    columns: ["Cuándo", "Quién", "Acción", "Detalle"],
    rows: [
      ["Hoy 11:16", "Ana Gómez", "Abono", "FV-0988 · $ 150.000"],
      ["Hoy 10:02", "Luis Pérez", "Venta", "FV-1042"],
      ["Ayer 18:40", "Marta Díaz", "Stock", "Crema corporal +12"],
    ],
  },
  marketing: {
    columns: ["Pieza", "Dónde", "Estado", "Hasta"],
    rows: [
      ["Bienvenida 10%", "Inicio", "Activo", "31 oct"],
      ["Banner de octubre", "Tienda", "Activo", "31 oct"],
      ["Cupón ENVIO", "Checkout", "Pausado", "—"],
    ],
  },
  tienda: {
    columns: ["Ajuste", "Valor", "Estado", ""],
    rows: [
      ["Envío local", "$ 8.000", "Activo", ""],
      ["Envío nacional", "$ 14.000", "Activo", ""],
      ["WhatsApp de la tienda", "Visible", "Activo", ""],
    ],
  },
};

export function AccountModulePreview({
  module: mod,
  tenantName,
}: {
  module: AccountModuleDef;
  tenantName: string;
}) {
  const preview = PREVIEWS[mod.id];
  const text = `Hola, escribo desde ${tenantName}. Quiero habilitar el módulo de ${mod.label} en Berea.`;
  const href = `${adminSupportWhatsAppUrl}?text=${encodeURIComponent(text)}`;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 dark:border-amber-900/50 dark:bg-amber-950/30">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-800 dark:text-amber-200">
          Módulo por habilitar
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {mod.label}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
          {mod.pitch} Esto es un ejemplo con datos de muestra, para que veas qué podés hacer.
          Cuando Berea lo habilite en tu cuenta, esta pantalla pasa a ser la real.
        </p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1ebe5d]"
        >
          Adquiérelo con Berea por WhatsApp
        </a>
      </section>

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Ejemplo
          </p>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            Datos de muestra
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                {preview.columns.filter(Boolean).map((column) => (
                  <th
                    key={column}
                    className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row) => (
                <tr
                  key={row.join("|")}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/80"
                >
                  {row.filter((_, index) => Boolean(preview.columns[index])).map((cell, index) => (
                    <td
                      key={`${cell}-${index}`}
                      className={`px-4 py-3 ${index === 0 ? "font-medium text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-300"}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
