"use client";

import { useEffect, useRef } from "react";

/** Video del recorrido: se reproduce en silencio mientras está en pantalla. */
export function LandingVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.5 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className="demo-video"
      src={src}
      poster={poster}
      width={1920}
      height={1080}
      muted
      loop
      playsInline
      controls
      preload="none"
      aria-label={label}
    />
  );
}
