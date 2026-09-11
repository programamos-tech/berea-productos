import type { MetadataRoute } from "next";

const TEAL = "#0197b2";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Berea House",
    short_name: "Berea House",
    description: "Berea House · software y escuela",
    start_url: "/admin",
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
