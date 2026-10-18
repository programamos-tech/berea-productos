/* eslint-disable @next/next/no-img-element */
import { BereaWord } from "@/components/brand/BereaWord";
import { Icon } from "./Icon";

export type Variant = "desktop" | "tablet" | "phone";

const MARK = "/berea-productos-icon.png";

const navMain = [
  { icon: "home", label: "Reportes", active: true },
  { icon: "cash", label: "Caja" },
  { icon: "receipt", label: "Ventas" },
  { icon: "card", label: "Créditos" },
  { icon: "gastos", label: "Gastos" },
  { icon: "boxes", label: "Inventario", children: ["Productos", "Traslados", "Kits"] },
  { icon: "users", label: "Clientes" },
];

const navConfig = [
  { icon: "gear", label: "Configuración" },
  { icon: "user", label: "Mi cuenta" },
  { icon: "users", label: "Equipo" },
  { icon: "building", label: "Sucursales" },
  { icon: "list", label: "Registros" },
];

const kpis = [
  { icon: "dollar", label: "Total ingresos", short: "Ingresos", value: "$ 18.400.000", hint: "IVA = $ 2.937.815" },
  { icon: "wallet", label: "En caja", short: "Caja", value: "$ 6.250.000" },
  { icon: "swap", label: "En cuentas", short: "Cuentas", value: "$ 12.150.000" },
  { icon: "trend", label: "Ganancia bruta", short: "Bruta", value: "$ 4.960.000", info: true },
  { icon: "down", label: "Gastos", short: "Gastos", value: "$ 1.540.000", hint: "Caja $ 1.540.000", bar: true },
  { icon: "trend", label: "Utilidad", short: "Utilidad", value: "$ 3.420.000", good: true },
  { icon: "boxes", label: "Stock", short: "Stock", value: "$ 8.900.000", hint: "c/IVA $ 10.591.000" },
];

const topClients = [
  { name: "Cliente Final", meta: "212 ventas", total: "$ 9.840.000" },
  { name: "DISTRIBUIDORA ANDINA", meta: "6 ventas", total: "$ 4.200.000" },
  { name: "MINI MERCADO EL PARQUE", meta: "3 ventas", total: "$ 1.150.000" },
  { name: "FERRETERÍA LA 20", meta: "2 ventas", total: "$ 860.000" },
  { name: "Autoservicio Barrio Sur", meta: "1 venta", total: "$ 410.000" },
];

const topProducts = [
  { name: "CARGADOR USB-C 20 W", meta: "62 u.", total: "$ 3.093.800" },
  { name: "AUDÍFONOS JBL TUNE 520", meta: "14 u.", total: "$ 2.658.600" },
  { name: "VIDRIO TEMPLADO IPHONE 15", meta: "88 u.", total: "$ 1.751.200" },
  { name: "MOUSE INALÁMBRICO LOGITECH", meta: "31 u.", total: "$ 1.701.900" },
  { name: "CABLE LIGHTNING 1 M", meta: "45 u.", total: "$ 895.500" },
];

const activity = [
  { kind: "Cierre de caja", title: "Caja cerrada · cuadró · 24 ud · 0 egresos", who: "Laura Martínez", when: "hace 2 h" },
  { kind: "Nueva venta", title: "Venta a Cliente Final · $ 33.900", who: "Laura Martínez", when: "hace 2 h" },
  { kind: "Abono a crédito", title: "Distribuidora Andina · $ 400.000", who: "Carlos Pérez", when: "hace 3 h" },
  { kind: "Nueva venta", title: "Venta a Cliente Final · $ 12.900", who: "Laura Martínez", when: "hace 3 h" },
  { kind: "Traslado", title: "Bodega → Tienda norte · 20 und", who: "Carlos Pérez", when: "hace 4 h" },
  { kind: "Nueva venta", title: "Venta a Ferretería La 20 · $ 115.800", who: "Laura Martínez", when: "hace 4 h" },
  { kind: "Nueva venta", title: "Venta a Cliente Final · $ 47.800", who: "Laura Martínez", when: "hace 5 h" },
  { kind: "Nueva venta", title: "Venta a Cliente Final · $ 35.900", who: "Laura Martínez", when: "hace 5 h" },
];

const months = ["Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct"];
const ingresos = [74, 68, 62, 52, 55, 22, 20, 60, 86];
const egresos = [96, 95, 95, 93, 92, 90, 90, 88, 100];

type Point = [number, number];

function smoothPath(points: Point[]): string {
  const f = (n: number) => n.toFixed(1);
  let d = `M${f(points[0]![0])},${f(points[0]![1])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;
    const c1: Point = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Point = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return d;
}

export function Chart({ id }: { id: string }) {
  const x0 = 30;
  const x1 = 470;
  const step = (x1 - x0) / (months.length - 1);
  const inPts = ingresos.map((y, i): Point => [x0 + i * step, y]);
  const outPts = egresos.map((y, i): Point => [x0 + i * step, y]);
  const line = smoothPath(inPts);
  const area = `${line} L${x1},110 L${x0},110 Z`;
  const last = inPts[inPts.length - 1]!;
  return (
    <svg className="am-chart-svg" viewBox="0 0 480 128" role="presentation">
      <defs>
        <linearGradient id={`am-fill-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#0197b2" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#0197b2" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {["$22 M", "$16,5 M", "$11 M", "$5,5 M", "$0"].map((t, i) => (
        <text key={t} x="0" y={14 + i * 24} className="am-chart-axis">{t}</text>
      ))}
      <path d={area} fill={`url(#am-fill-${id})`} />
      <path d={line} fill="none" stroke="#0197b2" strokeWidth="1.6" />
      <path d={smoothPath(outPts)} fill="none" stroke="#a1a1aa" strokeWidth="1" strokeDasharray="3 3" />
      {inPts.map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="2" fill="#0197b2" />
      ))}
      {outPts.map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="1.4" fill="#71717a" />
      ))}
      <circle cx={last[0]} cy={last[1]} r="4" fill="#0e7490" stroke="#fff" strokeWidth="1.5" />
      {months.map((m, i) => (
        <text key={m} x={x0 + i * step} y="124" textAnchor="middle" className={i === months.length - 1 ? "am-chart-axis am-chart-now" : "am-chart-axis"}>
          {m}
        </text>
      ))}
    </svg>
  );
}

export function Sidebar({ active = "Reportes" }: { active?: string }) {
  return (
    <aside className="am-side">
      <div className="am-side-brand">
        <img src={MARK} alt="" />
        <strong>Tu negocio</strong>
        <small>Gestiona tu tienda de productos</small>
      </div>
      <div className="am-branch">
        <img src={MARK} alt="" />
        <div>
          <small>Sucursal activa</small>
          <b>Tienda centro <Icon id="chevron" /></b>
          <span>tunegocio.bereahouse.com</span>
        </div>
        <Icon id="external" />
      </div>
      <nav className="am-nav">
        <p>Comercial</p>
        <ul>
          {navMain.map((n) => (
            <li key={n.label}>
              <span className={n.label === active ? "am-link is-on" : "am-link"}>
                <Icon id={n.icon} /> {n.label}
              </span>
              {n.children ? (
                <ul className="am-sub">
                  {n.children.map((c) => <li key={c} className={c === active ? "is-on" : undefined}>{c}</li>)}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
        <p>Configuración</p>
        <ul>
          {navConfig.map((n) => (
            <li key={n.label}>
              <span className={n.label === active ? "am-link is-on" : "am-link"}><Icon id={n.icon} /> {n.label}</span>
            </li>
          ))}
        </ul>
      </nav>
      <div className="am-help">
        <div className="am-help-card">
          <span className="am-wa"><Icon id="whatsapp" /></span>
          <div>
            <b>¿Necesitas ayuda?</b>
            <small>WhatsApp · 300 157 5829</small>
          </div>
        </div>
        <small className="am-powered">Powered by</small>
        <span className="am-powered-lockup">
          <BereaWord />
        </span>
      </div>
    </aside>
  );
}

export function TopBar({ variant }: { variant: Variant }) {
  const compact = variant !== "desktop";
  return (
    <header className="am-top">
      <div className="am-top-row">
        {compact ? <img className="am-top-logo" src={MARK} alt="" /> : null}
        <div className="am-search">
          <Icon id="search" />
          <span>{variant === "phone" ? "Buscar…" : "Clientes, facturas, productos, código…"}</span>
        </div>
        <span className="am-plus">+</span>
        {variant === "desktop" ? (
          <div className="am-user">
            <b>Laura Martínez</b>
            <small>laura@tunegocio.com</small>
          </div>
        ) : null}
        <span className="am-avatar">LM</span>
        {variant === "desktop" ? <Icon id="chevron" className="am-muted" /> : null}
      </div>
      {compact ? (
        <div className="am-top-branches">
          <div className="am-segments">
            <span className="is-on">Tienda centro</span>
            <span>Bodega</span>
            <span>Tienda norte</span>
          </div>
          <small>tunegocio.bereahouse.com</small>
        </div>
      ) : null}
    </header>
  );
}

export function ReportHeader({ variant }: { variant: Variant }) {
  return (
    <div className="am-head">
      <div className="am-head-title">
        <span className="am-head-ico"><Icon id="chart" /></span>
        <div>
          <p className="am-head-h">
            Reportes <span className="am-chip"><i /> Tienda centro</span>
          </p>
          <p className="am-head-sub">
            Así va la tienda · a corte de {variant === "phone" ? "hoy" : "lunes 12 de octubre de 2026"}
          </p>
        </div>
      </div>
      <div className="am-head-actions">
        <span className="am-btn am-btn-dark"><Icon id="store" /> Cómo va la tienda</span>
        <span className="am-btn"><Icon id="calendar" /> Por periodo</span>
        <span className="am-btn">Octubre de 2026 <Icon id="chevron" /></span>
        {variant !== "phone" ? <span className="am-btn"><Icon id="download" /> Exportar CSV</span> : null}
        {variant === "desktop" ? <span className="am-btn am-btn-sq"><Icon id="refresh" /></span> : null}
      </div>
    </div>
  );
}

export function Kpis({ variant }: { variant: Variant }) {
  const list = variant === "phone" ? kpis.filter((k) => !k.info) : kpis;
  return (
    <div className="am-kpis">
      {list.map((k) => (
        <div className={k.good ? "am-kpi is-good" : "am-kpi"} key={k.label}>
          <p className="am-kpi-label">
            {variant === "phone" ? (
              <><span className="am-kpi-tile"><Icon id={k.icon} /></span>{k.short}</>
            ) : (
              <><Icon id={k.icon} /> {k.label}{k.info ? <Icon id="info" className="am-muted" /> : null}</>
            )}
          </p>
          <p className="am-kpi-value">{k.value}</p>
          {k.bar && variant !== "phone" ? <span className="am-kpi-bar" /> : null}
          {k.hint && variant !== "phone" ? <p className="am-kpi-hint">{k.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function Tops({ limit }: { limit: number }) {
  const lists = [
    { title: "Clientes top", items: topClients.slice(0, limit) },
    { title: "Productos top", items: topProducts.slice(0, limit) },
  ];
  return (
    <div className="am-tops">
      {lists.map((l) => (
        <div key={l.title}>
          <p className="am-label">{l.title}</p>
          <p className="am-tops-hint">En octubre de 2026 · hasta hoy</p>
          <ol>
            {l.items.map((it, i) => (
              <li key={it.name}>
                <span className={i === 0 ? "am-rank is-first" : "am-rank"}>{i + 1}</span>
                <div>
                  <b>{it.name}</b>
                  <small>{it.meta} · <em>{it.total}</em></small>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

export function Activity({ limit }: { limit: number }) {
  return (
    <div className="am-activity">
      <div className="am-activity-head">
        <p className="am-label">Actividad reciente</p>
        <small>Ver todo</small>
      </div>
      <ul>
        {activity.slice(0, limit).map((a, i) => (
          <li key={i}>
            <i />
            <div>
              <p className="am-activity-top"><span>{a.kind}</span><small>{a.when}</small></p>
              <b>{a.title}</b>
              <small>{a.who}</small>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BottomNav({ variant }: { variant: Variant }) {
  const items = [...navMain, ...navConfig].slice(0, variant === "phone" ? 5 : 9);
  return (
    <nav className="am-bottom">
      {items.map((n) => (
        <span key={n.label} className={"active" in n && n.active ? "is-on" : undefined}>
          <Icon id={n.icon} />
          <small>{n.label}</small>
        </span>
      ))}
    </nav>
  );
}

/** Réplica estática del panel de Reportes de Berea, con datos de ejemplo. */
export function AdminMock({ variant, uid }: { variant: Variant; uid: string }) {
  if (variant === "desktop") {
    return (
      <div className="am am-desktop" aria-hidden="true">
        <Sidebar />
        <div className="am-main">
          <TopBar variant={variant} />
          <div className="am-body">
            <ReportHeader variant={variant} />
            <Kpis variant={variant} />
            <div className="am-split">
              <div className="am-split-left">
                <div className="am-chart">
                  <p className="am-chart-title">Ingresos vs egresos</p>
                  <p className="am-chart-sub">Lo que entra a la caja de ventas vs lo que sale en gastos</p>
                  <Chart id={uid} />
                  <p className="am-legend"><span className="is-in">Ingresos</span><span className="is-out">Egresos</span></p>
                </div>
                <Tops limit={5} />
              </div>
              <Activity limit={8} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`am am-${variant}`} aria-hidden="true">
      {variant === "phone" ? (
        <div className="am-status"><b>9:41</b><span /></div>
      ) : null}
      <TopBar variant={variant} />
      <div className="am-body">
        <ReportHeader variant={variant} />
        <Kpis variant={variant} />
        <div className="am-chart">
          <p className="am-chart-title">Ingresos vs egresos</p>
          {variant === "tablet" ? <p className="am-chart-sub">Lo que entra a la caja de ventas vs lo que sale en gastos</p> : null}
          <Chart id={uid} />
          <p className="am-legend"><span className="is-in">Ingresos</span><span className="is-out">Egresos</span></p>
        </div>
        {variant === "tablet" ? <Tops limit={4} /> : <Activity limit={4} />}
      </div>
      <BottomNav variant={variant} />
    </div>
  );
}
