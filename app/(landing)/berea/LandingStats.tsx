"use client";

import { useEffect, useRef } from "react";
import { Icon } from "./Icon";

export type LandingStat = { icon: string; value: number; prefix?: string; label: string; detail: string };

const format = new Intl.NumberFormat("es-CO");
const DURATION = 1600;

/** Cifras de uso con conteo animado al entrar en pantalla; el HTML del servidor ya trae el valor final. */
export function LandingStats({ stats }: { stats: LandingStat[] }) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const nums = [...list.querySelectorAll<HTMLElement>("[data-count]")];
    const write = (k: number) => {
      for (const el of nums) el.textContent = format.format(Math.round(Number(el.dataset.count) * k));
    };
    write(0);

    let frame = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / DURATION);
          write(1 - Math.pow(1 - t, 3));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.35 },
    );
    io.observe(list);

    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      write(1);
    };
  }, []);

  return (
    <ul className="stats-grid" ref={listRef}>
      {stats.map((s) => (
        <li className="stat" key={s.label}>
          <span className="stat-ico"><Icon id={s.icon} /></span>
          <strong className="stat-num">
            {s.prefix && <span className="stat-prefix">{s.prefix}</span>}
            <span data-count={s.value}>{format.format(s.value)}</span>
          </strong>
          <b className="stat-label">{s.label}</b>
          <span className="stat-detail">{s.detail}</span>
        </li>
      ))}
    </ul>
  );
}
