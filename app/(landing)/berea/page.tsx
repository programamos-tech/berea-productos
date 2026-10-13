/* eslint-disable @next/next/no-img-element */
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Manrope } from "next/font/google";
import {
  adminSupportWhatsAppDisplay,
  adminSupportWhatsAppUrl,
} from "@/lib/brand";
import { AdminMock } from "./AdminMock";
import { Icon, IconSprite } from "./Icon";
import { CajaScreen, CreditosScreen, ReportesScreen, SedesScreen, TrasladosScreen, VentasScreen } from "./TourScreens";
import { TourTabs, type TourPanel } from "./TourTabs";
import { LandingInteractions } from "./LandingInteractions";
import { ProcessSteps } from "./ProcessSteps";
import { PriceCalculator } from "./PriceCalculator";
import "./landing.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Berea · Sistema para comercios con varias sedes · Ubicados en Sincelejo y la Costa Caribe",
  description:
    "Todas tus sedes, créditos e inventario en un solo sistema. Ubicados en Sincelejo y la Costa Caribe: implementación presencial y soporte por WhatsApp.",
  alternates: { canonical: "https://bereahouse.com/" },
};

export const viewport: Viewport = {
  themeColor: "#0197b2",
};

const LOGO = "/landing/berea-house-logo.png";
const LOGO_WHITE = "/landing/berea-house-logo-white.png";
const LOGIN_URL = "/admin/login";
const CITY_PHOTO = "/landing/sincelejo.jpg";

const WHATSAPP_DEMO_URL = `${adminSupportWhatsAppUrl}?text=${encodeURIComponent(
  "Hola, quiero agendar una demo gratis de Berea.",
)}`;

const WHATSAPP_INTEGRATIONS_URL = `${adminSupportWhatsAppUrl}?text=${encodeURIComponent(
  "Hola, quiero cotizar una automatización o integración con Berea.",
)}`;

const team = [
  {
    name: "Andrew",
    role: "Director de Berea · Desarrollo de software",
    photo: "/landing/andrew.jpg",
    focus: "60% 50%",
    text: "Está al frente de Berea. Diseña la arquitectura del sistema, desarrolla cada módulo y define las mejoras para que funcione de forma segura y estable en cada negocio.",
  },
  {
    name: "Melissa",
    role: "Producto y calidad",
    photo: "/landing/melissa.jpg",
    focus: "47% 50%",
    text: "Convierte lo que nos piden los comerciantes en mejoras y prueba cada cambio antes de que llegue a tu negocio.",
  },
];

const supportHours = [
  { days: "Lunes a viernes", hours: "9:00 a.m. a 5:00 p.m." },
  { days: "Sábados", hours: "9:00 a.m. a 12:00 m." },
];

const clients: { name: string; src: string; solid?: boolean; tall?: boolean }[] = [
  { name: "Milagros · Aleya Shop", src: "/logo-aleya-wordmark.png", solid: true },
  { name: "Toro Technology", src: "/landing/logo-toro-mono.png", tall: true },
  { name: "María Paz Imports", src: "/landing/logo-maria-paz-mono.png" },
  { name: "Audio Mundial", src: "/logo-audio-mundial.png" },
  { name: "Zona T", src: "/landing/logo-zonat.png", tall: true },
  { name: "La Casa Artesanal", src: "/landing/logo-casa-artesanal-mono.png", tall: true },
  { name: "Estación iPhone", src: "/logo-estacion-iphone.png", solid: true },
  { name: "Torocell Store", src: "/landing/logo-torocell-mono.png", tall: true },
];

function WhatsAppLink({ className, children, href = WHATSAPP_DEMO_URL }: { className: string; children: ReactNode; href?: string }) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

const tourPanels: TourPanel[] = [
  { id: "sedes", label: "Sedes", hint: "Cada local con su caja y su mercancía", path: "/sucursales", screen: <SedesScreen /> },
  { id: "ventas", label: "Ventas", hint: "Facturas de contado, mixto y crédito", path: "/ventas", screen: <VentasScreen /> },
  { id: "caja", label: "Caja", hint: "Apertura, cierre y arqueo del día", path: "/caja", screen: <CajaScreen /> },
  { id: "creditos", label: "Créditos", hint: "Quién te debe y cada abono", path: "/creditos", screen: <CreditosScreen /> },
  { id: "traslados", label: "Traslados", hint: "Mercancía de una sede a otra", path: "/traslados", screen: <TrasladosScreen /> },
  { id: "reportes", label: "Reportes", hint: "Cómo va el negocio este mes", path: "", screen: <ReportesScreen /> },
];

const faqs = [
  {
    q: "¿Qué pasa si se va el internet?",
    a: "Berea necesita internet para registrar ventas. Si se cae el wifi, sigues con los datos del celular. Lo registrado no se pierde: queda guardado en línea, no en el computador del local.",
  },
  {
    q: "¿Mis datos son míos?",
    a: "Sí. Las ventas del mes y los gastos se descargan en un archivo que abres en Excel. Si algún día te vas, te entregamos una copia de tu información.",
  },
  {
    q: "¿Quién me ayuda si tengo un problema?",
    a: `Nosotros, desde Sincelejo, por WhatsApp directo al ${adminSupportWhatsAppDisplay}. De lunes a viernes de 9:00 a.m. a 5:00 p.m. y los sábados de 9:00 a.m. a 12:00 m.`,
  },
  {
    q: "¿Me enseñan a usarlo?",
    a: "Sí. La capacitación es presencial y va incluida en la implementación, junto con el acompañamiento el primer día de facturación.",
  },
  {
    q: "¿Sirve si tengo una sola tienda?",
    a: "Sí. Funciona igual con un solo local y la mensualidad es de $120.000. Desde 2 sedes pagas $100.000 al mes por cada una.",
  },
  {
    q: "¿Tengo que instalar algo?",
    a: "No. Se abre desde el navegador del computador, la tablet o el celular que ya tienes.",
  },
];

export default function BereaLandingPage() {
  return (
    <div className={`bl ${manrope.className}`}>
      <a className="skip" href="#contenido">Saltar al contenido</a>
      <div className="scroll-line" aria-hidden="true"><span id="scroll-line" /></div>

      <div className="site-head">
        <header className="nav-wrap">
          <div className="nav">
            <a className="brand" href="#inicio">
              <img src={LOGO} alt="Berea House, software para negocios" width={663} height={312} />
            </a>

            <nav className="links" id="site-nav" aria-label="Principal">
              <a className="text-link" href="#inicio">Inicio</a>
              <a className="text-link" href="#recorrido">Qué incluye</a>
              <a className="text-link" href="#precios">Precios</a>
              <a className="text-link" href="#preguntas">Preguntas</a>
              <a className="text-link links-login" href={LOGIN_URL}>Ingresar</a>
            </nav>

            <div className="nav-actions">
              <a className="btn btn-ghost nav-login" href={LOGIN_URL}>Ingresar</a>
              <WhatsAppLink className="btn btn-primary">Agendar demo</WhatsAppLink>
              <button className="burger" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Abrir menú">
                <span /><span />
              </button>
            </div>
          </div>
        </header>
      </div>

      <main id="contenido">
        <section className="hero" id="inicio">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <p className="local-badge"><Icon id="pin" /> Ubicados en Sincelejo y Costa Caribe</p>
              <h1>Todas tus sedes, créditos e inventario <em>en un solo sistema</em></h1>
              <p className="lead">Cuánto vendió cada local, quién te debe y cuánta mercancía hay en cada sede.</p>
              <div className="hero-actions">
                <WhatsAppLink className="btn btn-primary btn-lg">
                  <Icon id="whatsapp" /> Agenda tu demo gratis
                </WhatsAppLink>
                <a className="btn btn-ghost btn-lg" href="#precios">Ver precios</a>
              </div>
              <p className="fine">Te lo implementamos y capacitamos a tu equipo en tu local.</p>
            </div>

            <div className="device" aria-hidden="true">
              <div className="device-bar">
                <span className="dot dot-r" />
                <span className="dot dot-y" />
                <span className="dot dot-g" />
                <div className="device-url">tunegocio.bereahouse.com/admin</div>
              </div>
              <div className="device-screen">
                <AdminMock variant="desktop" uid="hero-pc" />
                <AdminMock variant="phone" uid="hero-cel" />
              </div>
            </div>
          </div>
        </section>

        <section className="clients" aria-labelledby="clients-title">
          <div className="wrap">
            <p className="clients-title" id="clients-title">Negocios de la región que ya trabajan con nosotros</p>
            <div className="client-marquee">
              {[0, 1].map((copy) => (
                <ul className="client-logos" key={copy} aria-hidden={copy === 1 ? true : undefined}>
                  {[...clients, ...clients].map((c, i) => (
                    <li key={`${c.name}-${i}`} className={`client${c.solid ? " client-solid" : ""}${c.tall ? " client-tall" : ""}`}>
                      <img src={c.src} alt={copy === 0 && i < clients.length ? c.name : ""} />
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </section>

        <section className="devices" id="dispositivos">
          <div className="wrap">
            <div className="section-head section-head-center">
              <h2>Se ve bien en el PC, el iPad y el celular</h2>
              <p className="lead">El mismo sistema se acomoda a cada pantalla. Entras desde el navegador, sin instalar nada.</p>
            </div>

            <div className="dv-stage" aria-hidden="true">
              <div className="dv-laptop">
                <div className="dv-lid">
                  <div className="dv-screen">
                    <AdminMock variant="desktop" uid="dv-pc" />
                  </div>
                </div>
                <div className="dv-base" />
              </div>

              <div className="dv-tablet">
                <div className="dv-screen">
                  <AdminMock variant="tablet" uid="dv-ipad" />
                </div>
              </div>

              <div className="dv-phone">
                <div className="dv-screen">
                  <span className="dv-notch" />
                  <AdminMock variant="phone" uid="dv-cel" />
                </div>
              </div>
            </div>

            <ul className="dv-labels">
              <li><b>iPad o tablet</b><span>Para vender en el mostrador</span></li>
              <li><b>PC</b><span>Para la caja y la oficina</span></li>
              <li><b>Celular</b><span>Para ver tu negocio desde donde estés</span></li>
            </ul>
          </div>
        </section>

        <section className="tour-sec" id="recorrido">
          <div className="wrap">
            <div className="section-head">
              <h2>Así funciona Berea por dentro</h2>
              <p className="lead">Estas son las pantallas del sistema tal como las vas a usar, con datos de ejemplo. Toca cada parte para ver cómo manejas tus sedes, las ventas, la caja, los créditos, los traslados y los reportes.</p>
            </div>
            <TourTabs panels={tourPanels} />
          </div>
        </section>

        <section className="local" id="cercania">
          <div className="city-hero">
            <img
              className="city-hero-img"
              src={CITY_PHOTO}
              alt="Vista aérea de la catedral y el parque Santander, en el centro de Sincelejo"
              width={1600}
              height={1200}
              loading="lazy"
            />
            <div className="wrap city-hero-inner">
              <h2>Somos de Sincelejo y le apostamos a nuestra tierra</h2>
              <p className="city-lead">
                Traemos la última tecnología a los empresarios de aquí, porque creemos en una capital donde cualquiera la pueda usar.
              </p>
              <WhatsAppLink className="btn btn-primary btn-lg">
                <Icon id="whatsapp" /> Habla con nosotros
              </WhatsAppLink>
              <ul className="city-points">
                <li>Conocemos cómo se vende en la región</li>
              </ul>
            </div>
          </div>

          <div className="wrap">
            <div className="team">
              <div className="team-head">
                <h2>Conoce a las personas detrás de Berea</h2>
                <p className="lead">
                  Somos de Sincelejo y desarrollamos Berea desde cero. Lo mejoramos constantemente con lo que nos cuentan los comerciantes y te acompañamos de forma directa en cada etapa.
                </p>
              </div>
              <div className="team-grid">
                {team.map((p) => (
                  <article className="person" key={p.name}>
                    <div className="person-poster">
                      <img src={p.photo} alt={`${p.name}, ${p.role}`} width={900} height={900} loading="lazy" style={{ objectPosition: p.focus }} />
                      <strong className="person-name">{p.name}</strong>
                    </div>
                    <span className="person-role">{p.role}</span>
                    <p>{p.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="process" id="proceso">
          <div className="wrap">
            <div className="section-head">
              <h2>De la primera visita a tu primer día facturando</h2>
              <p className="lead">Así implementamos Berea en tu negocio, paso a paso. Nosotros hacemos el trabajo pesado.</p>
            </div>
            <ProcessSteps />
          </div>
        </section>

        <section className="pricing" id="precios">
          <div className="wrap">
            <div className="section-head">
              <h2>¿Cuánto cuesta Berea para tu negocio?</h2>
              <p className="lead">Cuéntanos cuántas sedes tienes y cuántos productos manejas, y te mostramos un valor estimado al instante.</p>
            </div>

            <PriceCalculator whatsappUrl={adminSupportWhatsAppUrl} />

            <div className="calc-includes">
              <div>
                <h3>La implementación incluye</h3>
                <ul>
                  <li><Icon id="users" /> Capacitación presencial al equipo</li>
                  <li><Icon id="building" /> Creación de cuentas, sedes y usuarios</li>
                  <li><Icon id="file" /> Cargue de tus productos desde Excel</li>
                  <li><Icon id="receipt" /> Acompañamiento el primer día</li>
                </ul>
              </div>
              <div>
                <h3>La mensualidad incluye</h3>
                <ul>
                  <li><Icon id="layers" /> Todos los módulos del sistema</li>
                  <li><Icon id="chart" /> En PC, iPad y celular</li>
                  <li><Icon id="whatsapp" /> Soporte por WhatsApp directo</li>
                  <li><Icon id="refresh" /> Mejoras y actualizaciones</li>
                </ul>
              </div>
            </div>

            <aside className="extra-card">
              <div className="ico"><Icon id="bolt" /></div>
              <div>
                <h3>Automatizaciones e integraciones</h3>
                <p>
                  Conectamos Berea con otras herramientas de tu negocio y automatizamos tareas repetitivas.
                  Se cotizan por separado, según lo que necesites.
                </p>
              </div>
              <WhatsAppLink className="btn btn-ghost" href={WHATSAPP_INTEGRATIONS_URL}>
                Cotizar
              </WhatsAppLink>
            </aside>
          </div>
        </section>

        <section className="faq" id="preguntas">
          <div className="wrap faq-grid">
            <div className="faq-side">
              <p className="eyebrow">Preguntas</p>
              <h2>Lo que más nos preguntan</h2>
              <p className="lead">
                ¿Otra duda? Escríbenos al{" "}
                <a className="inline-link" href={WHATSAPP_DEMO_URL} target="_blank" rel="noopener noreferrer">{adminSupportWhatsAppDisplay}</a>.
              </p>
            </div>
            <div className="faq-list">
              {faqs.map((f, i) => (
                <details key={f.q} open={i === 0}>
                  <summary>{f.q}<span className="plus" aria-hidden="true" /></summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="cta">
          <div className="wrap cta-box">
            <p className="eyebrow eyebrow-light">Demo gratis</p>
            <h2>Te lo mostramos en tu local, con tus productos.</h2>
            <p>Escríbenos por WhatsApp y cuadramos la visita.</p>
            <WhatsAppLink className="btn btn-light btn-lg">
              <Icon id="whatsapp" /> Agenda tu demo gratis
            </WhatsAppLink>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap footer-grid">
          <div>
            <img className="footer-logo" src={LOGO_WHITE} alt="Berea House, software para negocios" width={663} height={312} loading="lazy" />
            <p>Sistema para comerciantes y mayoristas. Ubicados en Sincelejo y la Costa Caribe.</p>
          </div>
          <div>
            <h3>Berea</h3>
            <a href="#recorrido">Qué incluye</a>
            <a href="#proceso">Cómo empezamos</a>
            <a href="#precios">Precios</a>
            <a href="#preguntas">Preguntas</a>
          </div>
          <div>
            <h3>Soporte</h3>
            <p>Soporte por WhatsApp directo, con una persona del equipo.</p>
            <dl className="support-list">
              <div>
                <dt>WhatsApp</dt>
                <dd><a href={WHATSAPP_DEMO_URL} target="_blank" rel="noopener noreferrer">{adminSupportWhatsAppDisplay}</a></dd>
              </div>
              {supportHours.map((h) => (
                <div key={h.days}><dt>{h.days}</dt><dd>{h.hours}</dd></div>
              ))}
              <div><dt>Dónde estamos</dt><dd>Barrio El Socorro</dd></div>
            </dl>
          </div>
          <div>
            <h3>Clientes</h3>
            <a href={LOGIN_URL}>Ingresar a mi cuenta</a>
          </div>
        </div>
        <div className="wrap footer-bottom">
          <span>© {new Date().getFullYear()} Berea · Barrio El Socorro, Sincelejo</span>
        </div>
      </footer>

      <IconSprite />
      <LandingInteractions />
    </div>
  );
}
