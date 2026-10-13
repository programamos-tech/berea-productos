"use client";

import { useEffect, useState } from "react";

const PHRASES = [
  "Hoy también puedes empezar.",
  "Lo que construyes, se nota.",
  "Un paso más y ya es avance.",
  "Confía en lo que estás armando.",
  "Tu esfuerzo de hoy cuenta.",
  "Sigue. Ya vas más lejos.",
];

export function LoginPhrases({ className = "" }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((current) => (current + 1) % PHRASES.length);
        setVisible(true);
      }, 280);
    }, 3800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <p
      className={`min-h-6 font-medium transition-opacity duration-300 ${className}`}
      style={{ opacity: visible ? 1 : 0 }}
      aria-live="polite"
    >
      {PHRASES[index]}
    </p>
  );
}
