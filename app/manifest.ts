import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getStorefrontChromeForRequest } from "@/lib/tenant-context";
import { publicHostname, resolveTenantFromHost } from "@/lib/tenancy";

const TEAL = "#0197b2";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const host = resolveTenantFromHost(publicHostname(await headers()));
  const isStore =
    host.kind === "tenant" || host.kind === "legacy" || host.kind === "local";
  if (isStore) {
    const chrome = await getStorefrontChromeForRequest();
    return {
      name: chrome.name,
      short_name: chrome.name,
      description: chrome.description,
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: chrome.theme.primary,
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

  return {
    name: "Berea Facturas",
    short_name: "Berea Facturas",
    description: "Berea Facturas · Milagros Guacarí",
    start_url: "/",
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
