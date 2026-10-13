"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type TourPanel = { id: string; label: string; hint: string; path: string; screen: ReactNode };

export function TourTabs({ panels }: { panels: TourPanel[] }) {
  const [active, setActive] = useState(panels[0]?.id);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const current = panels.findIndex((p) => p.id === active);
    let next = -1;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (current + 1) % panels.length;
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (current - 1 + panels.length) % panels.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = panels.length - 1;
    if (next < 0) return;
    e.preventDefault();
    setActive(panels[next]!.id);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="tour">
      <div className="tour-nav" role="tablist" aria-label="Pantallas del sistema" aria-orientation="vertical" onKeyDown={onKeyDown}>
        {panels.map((p, i) => (
          <button
            key={p.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            className="tour-tab"
            type="button"
            role="tab"
            id={`tab-${p.id}`}
            aria-selected={p.id === active}
            aria-controls={`panel-${p.id}`}
            tabIndex={p.id === active ? 0 : -1}
            onClick={() => setActive(p.id)}
          >
            <b>{p.label}</b>
            <small>{p.hint}</small>
          </button>
        ))}
      </div>

      <div className="tour-stage">
        {panels.map((p) => (
          <div
            key={p.id}
            className="tour-panel"
            id={`panel-${p.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${p.id}`}
            hidden={p.id !== active}
          >
            <div className="device tour-device">
              <div className="device-bar">
                <span className="dot dot-r" />
                <span className="dot dot-y" />
                <span className="dot dot-g" />
                <div className="device-url">tunegocio.bereahouse.com/admin{p.path}</div>
              </div>
              <div className="tour-screen">{p.screen}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
