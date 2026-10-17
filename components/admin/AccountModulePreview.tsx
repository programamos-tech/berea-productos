import { Eye, RefreshCw } from "lucide-react";
import { AdminModuleHeader, type AdminModuleIcon } from "@/components/admin/AdminModuleHeader";
import { CreditosTable } from "@/components/admin/CreditosTable";
import { adminSupportWhatsAppUrl } from "@/lib/brand";
import type { AccountModuleDef, AccountModuleId } from "@/lib/admin-account-modules";
import type { CreditListRow } from "@/lib/admin-order-credits";
import {
  adminFilterInputClass,
  adminFilterLabelClass,
  adminToolbarBtnBaseClass,
  adminToolbarBtnPrimaryClass,
  adminToolbarIconBtnClass,
} from "@/lib/admin-ui";

const ICONS: Record<AccountModuleId, AdminModuleIcon> = {
  reportes: "reportes",
  caja: "caja",
  ventas: "ventas",
  creditos: "creditos",
  proveedores: "proveedores",
  egresos: "gastos",
  inventario: "inventario",
  traslados: "traslados",
  kits: "kits",
  clientes: "clientes",
  equipo: "equipo",
  sucursales: "sucursales",
  registros: "registros",
  marketing: "configuracion",
  tienda: "configuracion",
};

const SUBTITLES: Partial<Record<AccountModuleId, string>> = {
  creditos: "Facturas a crédito y abonos. El saldo baja con cada cobro.",
  proveedores: "Todos los proveedores, aunque todavía no tengan órdenes de compra.",
  egresos: "Gastos del negocio, con método de pago y comprobante.",
  ventas: "Facturas, cotizaciones y el detalle de cada venta.",
  inventario: "Productos, precios y stock de esta sucursal.",
  caja: "Apertura, cierre y el efectivo del día.",
  clientes: "Fichas de clientes, documentos y lo que te deben.",
};

const thClass =
  "pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";

const MOCK_CREDITS: CreditListRow[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    customerId: null,
    customerName: "Distribuidora Andina",
    totalCents: 570000,
    paidCents: 150000,
    pendingCents: 420000,
    createdAt: "2026-10-16T16:16:00.000Z",
    status: "pending",
    uiStatus: "pending",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    customerId: null,
    customerName: "Carmen Ruiz",
    totalCents: 200000,
    paidCents: 80000,
    pendingCents: 120000,
    createdAt: "2026-10-14T14:40:00.000Z",
    status: "pending",
    uiStatus: "pending",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    customerId: null,
    customerName: "Boutique Luna",
    totalCents: 310000,
    paidCents: 0,
    pendingCents: 310000,
    createdAt: "2026-10-12T18:05:00.000Z",
    status: "pending",
    uiStatus: "pending",
  },
];

const LISTS: Partial<
  Record<AccountModuleId, { columns: string[]; rows: string[][]; search: string; estado?: string[] }>
> = {
  reportes: {
    search: "Periodo",
    columns: ["Periodo", "Ventas", "Gastos", "Resultado"],
    rows: [
      ["Hoy", "$ 1.240.000", "$ 180.000", "$ 1.060.000"],
      ["Esta semana", "$ 6.480.000", "$ 920.000", "$ 5.560.000"],
      ["Este mes", "$ 28.150.000", "$ 4.300.000", "$ 23.850.000"],
    ],
  },
  caja: {
    search: "Día",
    estado: ["Abierta", "Cerrada"],
    columns: ["Día", "Apertura", "Ventas", "Estado"],
    rows: [
      ["Hoy", "$ 200.000", "$ 1.240.000", "Abierta"],
      ["Ayer", "$ 150.000", "$ 980.000", "Cerrada"],
      ["12 oct", "$ 180.000", "$ 1.410.000", "Cerrada"],
    ],
  },
  ventas: {
    search: "Cliente, factura…",
    estado: ["Todas", "Finalizadas", "Pendientes"],
    columns: ["Factura", "Cliente", "Pago", "Total"],
    rows: [
      ["10421", "Distribuidora Andina", "Efectivo", "$ 186.000"],
      ["10418", "Laura Méndez", "Transferencia", "$ 94.500"],
      ["10402", "Boutique Luna", "Crédito", "$ 320.000"],
    ],
  },
  proveedores: {
    search: "Nombre, NIT, teléfono…",
    estado: ["Todos", "Con saldo", "Sin órdenes"],
    columns: ["Proveedor", "NIT", "Teléfono", "Órdenes", "Por pagar"],
    rows: [
      ["Milagros", "900.111.222", "300 111 2233", "2", "$ 8.789.280"],
      ["Insumos del Valle", "800.333.444", "310 444 5566", "1", "$ 1.200.000"],
      ["Empaques Norte", "901.555.666", "320 777 8899", "3", "$ 0"],
    ],
  },
  egresos: {
    search: "Concepto, nota…",
    columns: ["Concepto", "Pago", "Fecha", "Monto"],
    rows: [
      ["Arriendo del local", "Transferencia", "17 oct 2026", "$ 1.800.000"],
      ["Papelería", "Efectivo", "16 oct 2026", "$ 45.000"],
      ["Servicios", "Transferencia", "12 oct 2026", "$ 210.000"],
    ],
  },
  inventario: {
    search: "Nombre o referencia…",
    columns: ["Producto", "Referencia", "Stock", "Precio"],
    rows: [
      ["Crema corporal 250 ml", "MG-250", "18", "$ 42.000"],
      ["Aceite de coco", "MG-AC", "6", "$ 28.500"],
      ["Kit de viaje", "MG-KIT", "11", "$ 65.000"],
    ],
  },
  traslados: {
    search: "Sucursal…",
    estado: ["Todos", "En curso", "Recibidos"],
    columns: ["Traslado", "Desde", "Hacia", "Unidades"],
    rows: [
      ["TR-14", "Centro", "Bodega", "24"],
      ["TR-13", "Bodega", "Norte", "8"],
      ["TR-12", "Norte", "Centro", "3"],
    ],
  },
  kits: {
    search: "Nombre del kit…",
    columns: ["Kit", "Productos", "Precio", "Estado"],
    rows: [
      ["Rutina de noche", "3", "$ 96.000", "Activo"],
      ["Viaje", "2", "$ 54.000", "Activo"],
      ["Regalo", "4", "$ 120.000", "Borrador"],
    ],
  },
  clientes: {
    search: "Nombre, cédula, teléfono…",
    columns: ["Cliente", "Documento", "Teléfono", "Saldo"],
    rows: [
      ["Distribuidora Andina", "900.123.456", "300 000 0000", "$ 420.000"],
      ["Carmen Ruiz", "1.023.456.789", "310 000 0000", "$ 120.000"],
      ["Boutique Luna", "901.555.010", "320 000 0000", "$ 0"],
    ],
  },
  equipo: {
    search: "Nombre o correo…",
    columns: ["Persona", "Rol", "Sucursal", "Acceso"],
    rows: [
      ["Ana Gómez", "Administrador", "Centro", "Ventas y caja"],
      ["Luis Pérez", "Venta", "Norte", "Mostrador"],
      ["Marta Díaz", "Inventario", "Bodega", "Productos"],
    ],
  },
  sucursales: {
    search: "Nombre…",
    columns: ["Sucursal", "Ciudad", "Caja", "Productos"],
    rows: [
      ["Centro", "Guacarí", "Abierta", "240"],
      ["Norte", "Guacarí", "Cerrada", "180"],
      ["Bodega", "Guacarí", "—", "860"],
    ],
  },
  registros: {
    search: "Acción o persona…",
    columns: ["Cuándo", "Quién", "Acción", "Detalle"],
    rows: [
      ["Hoy 11:16", "Ana Gómez", "Abono", "10421 · $ 150.000"],
      ["Hoy 10:02", "Luis Pérez", "Venta", "10418"],
      ["Ayer 18:40", "Marta Díaz", "Stock", "Crema corporal +12"],
    ],
  },
  marketing: {
    search: "Campaña…",
    columns: ["Pieza", "Dónde", "Estado", "Hasta"],
    rows: [
      ["Bienvenida 10%", "Inicio", "Activo", "31 oct"],
      ["Banner de octubre", "Tienda", "Activo", "31 oct"],
    ],
  },
  tienda: {
    search: "Ajuste…",
    columns: ["Ajuste", "Valor", "Estado"],
    rows: [
      ["Envío local", "$ 8.000", "Activo"],
      ["Envío nacional", "$ 14.000", "Activo"],
    ],
  },
};

function EnableButton({ tenantName, label }: { tenantName: string; label: string }) {
  const text = `Hola, escribo desde ${tenantName}. Quiero habilitar el módulo de ${label} en Berea.`;
  const href = `${adminSupportWhatsAppUrl}?text=${encodeURIComponent(text)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${adminToolbarBtnBaseClass} ${adminToolbarBtnPrimaryClass}`}
    >
      Habilitar con Berea
    </a>
  );
}

function LockedFilters({
  search,
  estado,
}: {
  search: string;
  estado?: string[];
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-12 lg:items-end lg:gap-3">
      <div className={`relative min-w-0 sm:col-span-2 ${estado ? "lg:col-span-8" : "lg:col-span-12"}`}>
        <label className={adminFilterLabelClass}>Buscar</label>
        <input
          readOnly
          value=""
          placeholder={search}
          className={adminFilterInputClass}
          aria-label="Buscar"
        />
      </div>
      {estado ? (
        <div className="min-w-0 sm:col-span-2 lg:col-span-4">
          <label className={adminFilterLabelClass}>Estado</label>
          <select disabled defaultValue={estado[0]} className={adminFilterInputClass}>
            {estado.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );
}

function LockedTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} className={thClass}>
                {column}
              </th>
            ))}
            <th className={`${thClass} pr-0 text-right`}> </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("|")} className="border-t border-zinc-100 dark:border-zinc-800">
              {row.map((cell, index) => (
                <td
                  key={`${cell}-${index}`}
                  className={`py-2.5 pr-4 ${
                    index === 0
                      ? "font-medium text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-600 dark:text-zinc-300"
                  }`}
                >
                  {cell}
                </td>
              ))}
              <td className="py-2.5 pr-0 text-right">
                <span className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400">
                  <Eye className="size-4" strokeWidth={2} />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AccountModulePreview({
  module: mod,
  tenantName,
  branchName,
}: {
  module: AccountModuleDef;
  tenantName: string;
  branchName?: string | null;
}) {
  const list = LISTS[mod.id];
  return (
    <div className="flex w-full min-w-0 max-w-none flex-col gap-4">
      <AdminModuleHeader
        icon={ICONS[mod.id]}
        title={mod.label}
        branchName={branchName}
        subtitle={SUBTITLES[mod.id] ?? mod.pitch}
        actions={
          <>
            <span className={adminToolbarIconBtnClass} aria-hidden>
              <RefreshCw className="size-4 shrink-0" strokeWidth={2.25} />
            </span>
            <EnableButton tenantName={tenantName} label={mod.label} />
          </>
        }
      />

      {mod.id === "creditos" ? (
        <>
          <LockedFilters search="Cliente, factura…" estado={["Pendientes", "Pagadas", "Anuladas", "Todas"]} />
          <section className="min-h-0 border-t border-zinc-200/70 pt-4 dark:border-zinc-800">
            <CreditosTable rows={MOCK_CREDITS} preview />
          </section>
        </>
      ) : list ? (
        <>
          <LockedFilters search={list.search} estado={list.estado} />
          <section className="min-h-0 border-t border-zinc-200/70 pt-4 dark:border-zinc-800">
            <LockedTable columns={list.columns} rows={list.rows} />
          </section>
        </>
      ) : null}
    </div>
  );
}
