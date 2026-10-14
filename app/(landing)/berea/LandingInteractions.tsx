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

    const io = revealOnScroll(root);

    return () => {
      ac.abort();
      io?.disconnect();
    };
  }, []);

  return null;
}

const REVEAL = [
  ".clients-title",
  ".client-marquee",
  "main > section:not(.hero) .section-head",
  ".stat",
  ".demo-frame",
  ".demo-actions",
  ".dv-laptop",
  ".dv-tablet",
  ".dv-phone",
  ".dv-labels li",
  ".tour",
  ".city-hero-inner > *",
  ".team-head",
  ".person",
  ".steps",
  ".quote",
  ".includes > div",
  ".extra-card",
  ".faq-side",
  ".faq-list details",
  ".cta-box",
  ".footer-grid > div",
].join(",");

/**
 * Entrada suave de bloques al hacer scroll, en ambos sentidos: vuelven a animarse al salir y regresar,
 * desde abajo al bajar y desde arriba al subir. Sin el script (o con movimiento reducido) todo queda visible.
 */
function revealOnScroll(root: HTMLElement) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;

  const els = [...root.querySelectorAll<HTMLElement>(REVEAL)];
  const index = new Map<Element, number>();
  for (const el of els) {
    const parent = el.parentElement;
    const n = parent ? (index.get(parent) ?? 0) : 0;
    if (parent) index.set(parent, n + 1);
    el.style.setProperty("--rv-i", String(Math.min(n, 5)));
    el.classList.add("rv");
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const { target, isIntersecting, boundingClientRect } of entries) {
        const el = target as HTMLElement;
        if (isIntersecting) {
          el.classList.add("rv-in");
        } else {
          el.classList.remove("rv-in");
          el.dataset.rvFrom = boundingClientRect.top < 0 ? "top" : "bottom";
        }
      }
    },
    { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
  );
  for (const el of els) io.observe(el);
  return io;
}
