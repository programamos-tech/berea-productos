import type { MetadataRoute } from "next";

const TEAL = "#0197b2";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Berea Facturas",
    short_name: "Berea Facturas",
    description: "Panel Berea Facturas",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    background_color: TEAL,
    theme_color: TEAL,
    lang: "es",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
