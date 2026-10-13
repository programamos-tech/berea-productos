"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { Icon } from "./Icon";

type Step = {
  id: string;
  icon: string;
  tab: string;
  title: string;
  text: string;
  points: { icon: string; text: string }[];
  you: string;
  visual: ReactNode;
};

const AUTOPLAY_MS = 7000;

function VisitVisual() {
  return (
    <div className="pv">
      <div className="pv-card pv-row">
        <div className="pv-cal">
          <small>Mar</small>
          <b>14</b>
        </div>
        <div className="pv-grow">
          <strong>Visita de implementación</strong>
          <span className="pv-muted"><Icon id="pin" /> Tu local · 10:00 a.m.</span>
        </div>
        <span className="pv-pill is-good">Agendada</span>
      </div>
      <div className="pv-card">
        <p className="pv-title">Lo que revisamos contigo</p>
        <ul className="pv-checks">
          <li><Icon id="check" /> Cuántas sedes tienes</li>
          <li><Icon id="check" /> Cómo cobras: contado, crédito y transferencia</li>
          <li><Icon id="check" /> Quién vende y quién maneja la caja</li>
          <li><Icon id="check" /> Tu lista de productos</li>
        </ul>
      </div>
    </div>
  );
}

function AccountsVisual() {
  const sedes = ["Tienda centro", "Bodega", "Tienda norte"];
  return (
    <div className="pv">
      <div className="pv-card">
        <div className="pv-row">
          <span className="pv-logo">TN</span>
          <div className="pv-grow">
            <strong>Tu negocio</strong>
            <span className="pv-muted"><Icon id="globe" /> tunegocio.bereahouse.com</span>
          </div>
        </div>
        <ul className="pv-rows">
          {sedes.map((s) => (
            <li key={s}>
              <span className="pv-ico"><Icon id="store" /></span>
              <div className="pv-grow">
                <b>{s}</b>
                <small>Caja e inventario propios</small>
              </div>
              <span className="pv-pill is-good"><Icon id="check" /> Lista</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function UsersVisual() {
  const users = [
    { initials: "LM", name: "Laura Martínez", role: "Administradora", perms: [true, true, true] },
    { initials: "CP", name: "Carlos Pérez", role: "Cajero", perms: [true, true, false] },
    { initials: "AR", name: "Ana Ruiz", role: "Vendedora", perms: [true, false, false] },
  ];
  const labels = ["Ventas", "Caja", "Reportes"];
  return (
    <div className="pv">
      <div className="pv-card">
        <p className="pv-title">Equipo</p>
        <ul className="pv-rows">
          {users.map((u) => (
            <li key={u.name}>
              <span className="pv-avatar">{u.initials}</span>
              <div className="pv-grow">
                <b>{u.name}</b>
                <small>{u.role}</small>
              </div>
              <div className="pv-perms">
                {labels.map((l, i) => (
                  <span key={l} className={u.perms[i] ? "is-on" : undefined}>{l}</span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ProductsVisual() {
  const rows = [
    { name: "Audífonos JBL Tune 520", price: "$ 189.900", stock: 24 },
    { name: "Cargador USB-C 20 W", price: "$ 49.900", stock: 86 },
    { name: "Mouse inalámbrico Logitech", price: "$ 54.900", stock: 40 },
  ];
  return (
    <div className="pv">
      <div className="pv-card pv-row pv-upload">
        <span className="pv-xls">XLS</span>
        <div className="pv-grow">
          <strong className="pv-file">productos.xlsx</strong>
          <div className="pv-bar"><i /></div>
        </div>
        <span className="pv-pill is-good"><Icon id="check" /> 842 productos</span>
      </div>
      <div className="pv-card">
        <table className="pv-table">
          <thead>
            <tr><th>Producto</th><th>Precio</th><th>Stock</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}><td>{r.name}</td><td>{r.price}</td><td>{r.stock}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FirstSaleVisual() {
  return (
    <div className="pv">
      <div className="pv-card pv-receipt">
        <div className="pv-row">
          <span className="pv-ico"><Icon id="receipt" /></span>
          <div className="pv-grow">
            <strong>Factura 00001</strong>
            <span className="pv-muted">Tienda centro · 8:02 a.m.</span>
          </div>
        </div>
        <ul className="pv-lines">
          <li><span>Audífonos JBL Tune 520 × 1</span><b>$ 189.900</b></li>
          <li><span>Cargador USB-C 20 W × 2</span><b>$ 99.800</b></li>
        </ul>
        <div className="pv-total"><span>Total</span><b>$ 289.700</b></div>
        <div className="pv-stamp"><Icon id="check" /> Venta registrada</div>
      </div>
      <div className="pv-card pv-row pv-note">
        <span className="pv-ico"><Icon id="users" /></span>
        <span>Estamos contigo en el local durante las primeras ventas.</span>
      </div>
    </div>
  );
}

const steps: Step[] = [
  {
    id: "visita",
    icon: "pin",
    tab: "Visita",
    title: "Vamos a tu negocio",
    text: "Conocemos cómo vendes hoy y planeamos juntos el arranque.",
    points: [
      { icon: "store", text: "Vemos tus sedes y tu mercancía" },
      { icon: "cash", text: "Entendemos cómo cobras" },
      { icon: "calendar", text: "Fijamos la fecha de arranque" },
    ],
    you: "Tú nos muestras cómo trabajas.",
    visual: <VisitVisual />,
  },
  {
    id: "cuentas",
    icon: "building",
    tab: "Cuentas",
    title: "Creamos tu negocio y tus sedes",
    text: "Dejamos el sistema listo con tu nombre y cada uno de tus locales.",
    points: [
      { icon: "building", text: "Una cuenta para tu negocio" },
      { icon: "store", text: "Cada sede con su caja e inventario" },
      { icon: "globe", text: "Tu propia dirección web" },
    ],
    you: "Tú nos pasas los datos de cada sede.",
    visual: <AccountsVisual />,
  },
  {
    id: "usuarios",
    icon: "users",
    tab: "Usuarios",
    title: "Creamos los usuarios de tu equipo",
    text: "Cada persona entra con su usuario y solo ve lo que le corresponde.",
    points: [
      { icon: "user", text: "Un usuario por persona" },
      { icon: "gear", text: "Roles: administrador, cajero, vendedor" },
      { icon: "eye", text: "Permisos por módulo" },
    ],
    you: "Tú nos dices quién hace qué.",
    visual: <UsersVisual />,
  },
  {
    id: "productos",
    icon: "boxes",
    tab: "Productos",
    title: "Subimos tus productos",
    text: "Cargamos tu catálogo desde un Excel, con precios y existencias.",
    points: [
      { icon: "file", text: "Desde tu Excel o tu lista actual" },
      { icon: "boxes", text: "Precios y existencias por sede" },
      { icon: "check", text: "Revisamos que todo cuadre" },
    ],
    you: "Te recomendamos hacer inventario antes para arrancar con el stock real.",
    visual: <ProductsVisual />,
  },
  {
    id: "arranque",
    icon: "receipt",
    tab: "Primer día",
    title: "Facturas tu primera venta",
    text: "Te acompañamos en el local mientras haces las primeras ventas.",
    points: [
      { icon: "users", text: "Capacitación presencial para tu equipo" },
      { icon: "receipt", text: "Primeras facturas con nosotros al lado" },
      { icon: "whatsapp", text: "Soporte por WhatsApp desde ese día" },
    ],
    you: "Tú vendes como siempre, ahora con Berea.",
    visual: <FirstSaleVisual />,
  },
];

export function ProcessSteps() {
  const [active, setActive] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!autoplay || !visible) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => setActive((a) => (a + 1) % steps.length), AUTOPLAY_MS);
    return () => window.clearTimeout(t);
  }, [active, autoplay, visible]);

  const go = (i: number) => {
    setAutoplay(false);
    setActive(i);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    let next = -1;
    if (e.key === "ArrowRight") next = (active + 1) % steps.length;
    if (e.key === "ArrowLeft") next = (active - 1 + steps.length) % steps.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = steps.length - 1;
    if (next < 0) return;
    e.preventDefault();
    go(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div
      className="steps"
      ref={rootRef}
      style={{ "--p": active / (steps.length - 1) } as CSSProperties}
      onMouseEnter={() => setAutoplay(false)}
    >
      <div className="steps-rail" role="tablist" aria-label="Pasos de la implementación" onKeyDown={onKeyDown}>
        {steps.map((s, i) => (
          <button
            key={s.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`step-tab-${s.id}`}
            aria-selected={i === active}
            aria-controls={`step-panel-${s.id}`}
            tabIndex={i === active ? 0 : -1}
            className={`step-tab${i < active ? " is-done" : ""}`}
            onClick={() => go(i)}
          >
            <span className="step-ico">
              <Icon id={i < active ? "check" : s.icon} />
            </span>
            <small>Paso {i + 1}</small>
            <b>{s.tab}</b>
          </button>
        ))}
      </div>

      {steps.map((s, i) => (
        <div
          key={s.id}
          className="step-panel"
          id={`step-panel-${s.id}`}
          role="tabpanel"
          aria-labelledby={`step-tab-${s.id}`}
          hidden={i !== active}
        >
          <div className="step-copy">
            <span className="step-count">Paso {i + 1} de {steps.length}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
            <ul className="step-points">
              {s.points.map((pt) => (
                <li key={pt.text}>
                  <span><Icon id={pt.icon} /></span>
                  {pt.text}
                </li>
              ))}
            </ul>
            <p className="step-you"><Icon id="user" /> {s.you}</p>
            <div className="step-nav">
              <button type="button" className="btn btn-ghost" onClick={() => go(i - 1)} disabled={i === 0}>
                Anterior
              </button>
              {i < steps.length - 1 ? (
                <button type="button" className="btn btn-primary" onClick={() => go(i + 1)}>
                  Siguiente paso
                </button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={() => go(0)}>
                  Ver desde el inicio
                </button>
              )}
            </div>
          </div>
          <div className="step-visual">{s.visual}</div>
        </div>
      ))}
    </div>
  );
}
