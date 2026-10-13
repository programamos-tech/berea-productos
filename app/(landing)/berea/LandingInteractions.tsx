"use client";

import { useEffect } from "react";

/** Comportamiento de la landing (menú móvil, barra de avance) sobre el HTML estático. */
export function LandingInteractions() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".bl");
    if (!root) return;
    const ac = new AbortController();
    const { signal } = ac;

    const burger = root.querySelector<HTMLButtonElement>(".burger");

    const setNav = (open: boolean) => {
      root.classList.toggle("nav-open", open);
      burger?.setAttribute("aria-expanded", String(open));
      burger?.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    };

    document.addEventListener(
      "click",
      (e) => {
        const t = e.target as Element;

        if (t.closest(".burger")) {
          setNav(!root.classList.contains("nav-open"));
          return;
        }

        if (t.closest(".links a, .nav-actions a") || !t.closest(".nav-wrap")) setNav(false);
      },
      { signal },
    );

    document.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape") setNav(false);
      },
      { signal },
    );

    const line = document.getElementById("scroll-line");
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      if (line) line.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
      root.classList.toggle("scrolled", y > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true, signal });

    return () => ac.abort();
  }, []);

  return null;
}
