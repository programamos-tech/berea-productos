import type { ReactNode } from "react";
import { Activity, Chart, Kpis, ReportHeader, Sidebar, TopBar, Tops } from "./AdminMock";
import { Icon } from "./Icon";

function Screen({ active, children }: { active: string; children: ReactNode }) {
  return (
    <div className="am am-tour" aria-hidden="true">
      <Sidebar active={active} />
      <div className="am-main">
        <TopBar variant="desktop" />
        <div className="am-body">{children}</div>
      </div>
    </div>
  );
}

function PageHead({ icon, title, sub, children }: { icon: string; title: string; sub: string; children?: ReactNode }) {
  return (
    <div className="am-head">
      <div className="am-head-title">
        <span className="am-head-ico"><Icon id={icon} /></span>
        <div>
          <p className="am-head-h">
            {title} <span className="am-chip"><i /> Tienda centro</span>
          </p>
          <p className="am-head-sub">{sub}</p>
        </div>
      </div>
      {children ? <div className="am-head-actions">{children}</div> : null}
    </div>
  );
}

function Field({ label, value, search, wide }: { label?: string; value: string; search?: boolean; wide?: boolean }) {
  return (
    <div className={wide ? "am-field is-wide" : "am-field"}>
      {label ? <small>{label}</small> : null}
      <span className={search ? "am-input is-search" : "am-input"}>
        {search ? <Icon id="search" /> : null}
        <em className={search ? "am-ph" : undefined}>{value}</em>
        {search ? null : <Icon id="chevron" />}
      </span>
    </div>
  );
}

function EyeBtn() {
  return <span className="am-eye"><Icon id="eye" /></span>;
}

const branches = [
  { name: "Tienda centro", code: "SUC-01", url: "centro.tunegocio.com", total: "$ 12.400.000", sales: 214, current: true, tags: ["Activa", "Predeterminada"] },
  { name: "Bodega", code: "BOD-01", url: "bodega.tunegocio.com", total: "$ 8.900.000", sales: 96, tags: ["Activa"] },
  { name: "Tienda norte", code: "SUC-02", url: "norte.tunegocio.com", total: "$ 4.100.000", sales: 88, tags: ["Activa"] },
];

export function SedesScreen() {
  return (
    <Screen active="Sucursales">
      <PageHead icon="store" title="Sucursales" sub="Puntos de operación, inventario y caja">
        <span className="am-btn am-btn-dark"><Icon id="plus" /> Nueva sucursal</span>
      </PageHead>
      <div className="am-branch-grid">
        {branches.map((b) => (
          <article key={b.name} className={b.current ? "am-bcard is-current" : "am-bcard"}>
            <div className="am-bcard-top">
              <span className="am-bcard-logo">{b.name[0]}</span>
              <div className="am-bcard-tags">
                {b.tags.map((t) => <span key={t} className={t === "Activa" ? "is-on" : undefined}>{t}</span>)}
              </div>
            </div>
            <p className="am-bcard-name">{b.name}</p>
            <p className="am-bcard-code">{b.code}</p>
            <p className="am-bcard-url">{b.url}</p>
            <p className="am-label am-bcard-label">Total vendido</p>
            <p className="am-bcard-total">{b.total}</p>
            <p className="am-bcard-code">{b.sales} ventas pagadas</p>
            <span className="am-bcard-btn">Editar sucursal</span>
          </article>
        ))}
      </div>
    </Screen>
  );
}

const sales = [
  { ref: "04822", when: "3:58 p. m. · 12 oct", client: "Cliente Final", pay: "Efectivo", icon: "cash", tone: "", state: "Finalizada", total: "$ 70.800" },
  { ref: "04821", when: "3:45 p. m. · 12 oct", client: "Distribuidora Andina", pay: "Crédito", icon: "coins", tone: "is-credit", state: "Finalizada", total: "$ 2.850.000" },
  { ref: "04820", when: "3:31 p. m. · 12 oct", client: "Cliente Final", pay: "Mixto", icon: "layers", tone: "", state: "Finalizada", total: "$ 33.900" },
  { ref: "04819", when: "2:52 p. m. · 12 oct", client: "Ferretería La 20", pay: "Cotización", icon: "file", tone: "is-quote", state: "Cotización", total: "$ 1.240.000" },
  { ref: "04818", when: "2:10 p. m. · 12 oct", client: "Cliente Final", pay: "Transferencia", icon: "swap", tone: "", state: "Finalizada", total: "$ 115.800" },
  { ref: "04817", when: "1:44 p. m. · 12 oct", client: "Mini mercado El Parque", pay: "Efectivo", icon: "cash", tone: "", state: "Anulada", total: "$ 47.800" },
  { ref: "04816", when: "1:02 p. m. · 12 oct", client: "Cliente Final", pay: "Efectivo", icon: "cash", tone: "", state: "Finalizada", total: "$ 35.900" },
];

const stateTone: Record<string, string> = {
  Finalizada: "am-t-good",
  Cotización: "am-t-quote",
  Anulada: "am-t-bad",
  Pendiente: "am-t-warn",
};

export function VentasScreen() {
  return (
    <Screen active="Ventas">
      <PageHead icon="receipt" title="Ventas" sub="Facturas de mostrador y pedidos en línea">
        <span className="am-btn am-btn-sq"><Icon id="refresh" /></span>
        <span className="am-btn am-btn-dark"><Icon id="plus" /> Nueva factura</span>
      </PageHead>
      <div className="am-filters am-filters-ventas">
        <Field label="Buscar" value="Factura, cliente…" search wide />
        <Field label="Estado" value="Todas" />
        <Field label="Forma de pago" value="Todas" />
        <Field label="Desde" value="01/10/2026" />
        <Field label="Hasta" value="12/10/2026" />
      </div>
      <table className="am-table">
        <thead>
          <tr><th>Factura</th><th className="opt">Fecha</th><th>Cliente</th><th className="opt">Pago</th><th>Estado</th><th className="r">Total</th><th className="opt" /></tr>
        </thead>
        <tbody>
          {sales.map((s) => (
            <tr key={s.ref}>
              <td><span className="am-ref"><Icon id={s.icon} /> {s.ref}</span></td>
              <td className="am-muted-cell opt">{s.when}</td>
              <td>{s.client}</td>
              <td className="opt"><span className={`am-pay ${s.tone}`}><Icon id={s.icon} /> {s.pay}</span></td>
              <td><span className={`am-state ${stateTone[s.state]}`}>{s.state}</span></td>
              <td className="r am-strong">{s.total}</td>
              <td className="r opt"><EyeBtn /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="am-pager">
        <span>Mostrando <b>1–7</b> de <b>342</b></span>
        <div><span>Anterior</span><span className="is-on">1</span><span>2</span><span>3</span><span>Siguiente</span></div>
      </div>
    </Screen>
  );
}

const cashDays = [
  { day: "12 oct", open: true, who: "—", transfer: "$ 380.000", expected: "$ 1.240.000", counted: "—", diff: "", units: "41", note: "Turno de la mañana" },
  { day: "11 oct", who: "Laura Martínez", transfer: "$ 420.000", expected: "$ 1.850.000", counted: "$ 1.850.000", diff: "OK", units: "64", note: "Todo cuadró" },
  { day: "10 oct", who: "Carlos Pérez", transfer: "$ 310.000", expected: "$ 1.420.000", counted: "$ 1.415.000", diff: "−5.000", units: "51", note: "Faltó sencillo" },
  { day: "9 oct", who: "Laura Martínez", transfer: "$ 520.000", expected: "$ 2.040.000", counted: "$ 2.052.000", diff: "+12.000", units: "72", note: "" },
  { day: "8 oct", who: "Laura Martínez", transfer: "$ 290.000", expected: "$ 1.310.000", counted: "$ 1.310.000", diff: "OK", units: "47", note: "" },
  { day: "7 oct", who: "Carlos Pérez", transfer: "$ 450.000", expected: "$ 1.760.000", counted: "$ 1.760.000", diff: "OK", units: "58", note: "Cierre con arqueo" },
];

export function CajaScreen() {
  return (
    <Screen active="Caja">
      <PageHead icon="wallet" title="Caja" sub="Apertura, cierre y arqueo del efectivo del día">
        <span className="am-btn is-dim">Abrir caja</span>
        <span className="am-btn am-btn-dark">Cerrar caja</span>
      </PageHead>
      <div className="am-filters am-filters-caja">
        <Field label="Buscar" value="Día (AAAA-MM-DD) o nota…" search wide />
        <Field label="Estado" value="Todos" />
        <Field label="Desde" value="01/10/2026" />
        <Field label="Hasta" value="12/10/2026" />
      </div>
      <table className="am-table">
        <thead>
          <tr><th>Día</th><th>Estado</th><th className="opt">Cerró</th><th className="r opt">Transfer.</th><th className="r">Esperado</th><th className="r">Contado</th><th className="r">Dif.</th><th className="r opt">Ud</th><th className="opt">Nota</th><th className="opt" /></tr>
        </thead>
        <tbody>
          {cashDays.map((c) => (
            <tr key={c.day}>
              <td>{c.day}</td>
              <td><span className={c.open ? "am-state am-t-warn" : "am-state am-t-muted"}>{c.open ? "Abierta" : "Cerrada"}</span></td>
              <td className={c.who === "—" ? "am-faint opt" : "opt"}>{c.who}</td>
              <td className="r opt">{c.transfer}</td>
              <td className="r">{c.expected}</td>
              <td className={c.counted === "—" ? "r am-faint" : "r"}>{c.counted}</td>
              <td className={`r ${c.diff.startsWith("−") ? "am-t-bad" : "am-t-good"}`}>{c.diff || <span className="am-faint">—</span>}</td>
              <td className="r opt">{c.units}</td>
              <td className="am-note opt">{c.note}</td>
              <td className="r opt">{c.open ? <span className="am-faint">—</span> : <EyeBtn />}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Screen>
  );
}

const credits = [
  { ref: "04821", client: "Distribuidora Andina", when: "3:45 p. m. · 12 oct", total: "$ 2.850.000", paid: "$ 400.000", due: "$ 2.450.000", state: "Pendiente" },
  { ref: "04796", client: "Mini mercado El Parque", when: "11:20 a. m. · 10 oct", total: "$ 680.000", paid: "$ 0", due: "$ 680.000", state: "Pendiente" },
  { ref: "04788", client: "Ferretería La 20", when: "4:05 p. m. · 9 oct", total: "$ 1.240.000", paid: "$ 1.000.000", due: "$ 240.000", state: "Pendiente" },
  { ref: "04752", client: "Autoservicio Barrio Sur", when: "9:40 a. m. · 6 oct", total: "$ 210.000", paid: "$ 210.000", due: "$ 0", state: "Pagada" },
  { ref: "04731", client: "Tienda Doña Carmen", when: "5:12 p. m. · 4 oct", total: "$ 95.000", paid: "$ 95.000", due: "$ 0", state: "Pagada" },
  { ref: "04702", client: "Cliente Final", when: "2:30 p. m. · 1 oct", total: "$ 150.000", paid: "$ 0", due: "$ 150.000", state: "Anulada" },
];

const creditTone: Record<string, string> = { Pendiente: "is-warn", Pagada: "is-good", Anulada: "is-bad" };

export function CreditosScreen() {
  return (
    <Screen active="Créditos">
      <PageHead icon="coins" title="Créditos" sub="Facturas a crédito y abonos. El saldo baja con cada cobro.">
        <span className="am-btn am-btn-sq"><Icon id="refresh" /></span>
      </PageHead>
      <div className="am-filters am-filters-creditos">
        <Field label="Buscar" value="Cliente, factura…" search wide />
        <Field label="Estado" value="Todas" />
      </div>
      <table className="am-table">
        <thead>
          <tr><th>Factura</th><th>Cliente</th><th className="opt">Fecha</th><th className="r opt">Total</th><th className="r opt">Pagado</th><th className="r">Pendiente</th><th>Estado</th><th className="opt" /></tr>
        </thead>
        <tbody>
          {credits.map((c) => (
            <tr key={c.ref}>
              <td><span className="am-ref">{c.ref}</span></td>
              <td>{c.client}</td>
              <td className="am-muted-cell opt">{c.when}</td>
              <td className="r opt">{c.total}</td>
              <td className="r am-muted-cell opt">{c.paid}</td>
              <td className={`r am-strong am-due ${creditTone[c.state]}`}>{c.due}</td>
              <td><span className={`am-badge ${creditTone[c.state]}`}>{c.state}</span></td>
              <td className="r opt"><EyeBtn /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Screen>
  );
}

const transfers = [
  { code: "TRF-4821", route: "Bodega → Tienda norte", qty: 20, state: "En camino", when: "12 oct · 3:45 p. m." },
  { code: "TRF-4810", route: "Bodega → Tienda centro", qty: 48, state: "Recibido", when: "12 oct · 10:12 a. m." },
  { code: "TRF-4790", route: "Tienda centro → Tienda norte", qty: 6, state: "Recibido", when: "11 oct · 5:20 p. m." },
  { code: "TRF-4766", route: "Bodega → Tienda centro", qty: 120, state: "En camino", when: "10 oct · 8:05 a. m." },
  { code: "TRF-4741", route: "Tienda norte → Bodega", qty: 3, state: "Anulado", when: "9 oct · 4:40 p. m." },
  { code: "TRF-4720", route: "Bodega → Tienda norte", qty: 64, state: "Recibido", when: "8 oct · 9:15 a. m." },
];

const transferTone: Record<string, string> = { "En camino": "is-warn", Recibido: "is-good", Anulado: "is-muted" };

export function TrasladosScreen() {
  return (
    <Screen active="Traslados">
      <PageHead icon="swap" title="Traslados de inventario" sub="Gestiona los traslados de productos entre sucursales">
        <span className="am-btn"><Icon id="refresh" /> Actualizar</span>
        <span className="am-btn am-btn-dark"><Icon id="plus" /> Nuevo traslado</span>
      </PageHead>
      <div className="am-filters am-filters-traslados">
        <Field value="Buscar por código o sucursal..." search wide />
        <Field value="Todos los estados" />
      </div>
      <div className="am-table-card">
        <table className="am-table">
          <thead>
            <tr><th className="opt">Traslado</th><th>Ruta</th><th className="r">Cantidad</th><th>Estado</th><th className="opt">Fecha</th><th className="r opt">Acciones</th></tr>
          </thead>
          <tbody>
            {transfers.map((t) => (
              <tr key={t.code}>
                <td className="am-code opt">{t.code}</td>
                <td className="am-strong">{t.route}</td>
                <td className="r">{t.qty}</td>
                <td><span className={`am-tstatus ${transferTone[t.state]}`}><i /> {t.state}</span></td>
                <td className="am-muted-cell opt">{t.when}</td>
                <td className="r opt">
                  <span className="am-acts">
                    <EyeBtn />
                    {t.state === "En camino" ? <><span className="am-eye"><Icon id="check" /></span><span className="am-eye"><Icon id="ban" /></span></> : null}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Screen>
  );
}

export function ReportesScreen() {
  return (
    <Screen active="Reportes">
      <ReportHeader variant="desktop" />
      <Kpis variant="desktop" />
      <div className="am-split">
        <div className="am-split-left">
          <div className="am-chart">
            <p className="am-chart-title">Ingresos vs egresos</p>
            <p className="am-chart-sub">Lo que entra a la caja de ventas vs lo que sale en gastos</p>
            <Chart id="tour" />
            <p className="am-legend"><span className="is-in">Ingresos</span><span className="is-out">Egresos</span></p>
          </div>
          <Tops limit={3} />
        </div>
        <Activity limit={6} />
      </div>
    </Screen>
  );
}
