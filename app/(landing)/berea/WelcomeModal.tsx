"use client";

import { useEffect, useRef } from "react";
import { Icon } from "./Icon";

const STORAGE_KEY = "berea-welcome-seen";
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;
const DELAY_MS = 1200;

/** Bienvenida que invita a agendar la demo; tras cerrarla no vuelve a salir en unos días. */
export function WelcomeModal({ demoUrl, storesCount }: { demoUrl: string; storesCount: number }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    let seen = 0;
    try {
      seen = Number(localStorage.getItem(STORAGE_KEY)) || 0;
    } catch {}
    if (Date.now() - seen < SNOOZE_MS) return;

    const timer = window.setTimeout(() => {
      if (!dialog.open) dialog.showModal();
    }, DELAY_MS);
    const remember = () => {
      try {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } catch {}
    };
    dialog.addEventListener("close", remember);
    return () => {
      window.clearTimeout(timer);
      dialog.removeEventListener("close", remember);
    };
  }, []);

  const close = () => ref.current?.close();

  return (
    <dialog
      ref={ref}
      className="welcome"
      aria-labelledby="welcome-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="welcome-card" tabIndex={-1} autoFocus>
        <button className="welcome-close" type="button" aria-label="Cerrar" onClick={close}>
          <Icon id="plus" />
        </button>

        <div className="welcome-top">
          <span className="welcome-badge"><Icon id="pin" /> Sincelejo y alrededores</span>
          <h2 id="welcome-title">¡Bienvenido a Berea!</h2>
          <p>Te mostramos el sistema funcionando en tu local, con tus productos y tus sedes.</p>
        </div>

        <div className="welcome-body">
          <ul className="welcome-list">
            <li><Icon id="check" /> Demo gratis y sin compromiso</li>
            <li><Icon id="check" /> Te lo mostramos en tu local</li>
            <li><Icon id="check" /> Resolvemos tus dudas por WhatsApp</li>
          </ul>

          <p className="welcome-proof">
            <Icon id="store" /> Ya lo usan <b>{storesCount} tiendas</b> de la región
          </p>

          <div className="welcome-actions">
            <a className="btn btn-primary btn-lg" href={demoUrl} target="_blank" rel="noopener noreferrer" onClick={close}>
              <Icon id="whatsapp" /> Agendar mi demo gratis
            </a>
            <button className="btn btn-ghost btn-lg" type="button" onClick={close}>
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
