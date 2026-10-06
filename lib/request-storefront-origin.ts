import { headers } from "next/headers";
import { getPublicSiteUrl } from "@/lib/public-site-url";
import { publicHostname } from "@/lib/tenancy";

/** Origen de la tienda según el host de esta petición. */
export async function requestStorefrontOrigin(): Promise<string> {
  const headerList = await headers();
  const host = publicHostname(headerList);
  if (!host || host === "localhost" || host.endsWith(".local")) {
    return getPublicSiteUrl();
  }
  const forwarded = headerList.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto = forwarded === "http" || forwarded === "https" ? forwarded : "https";
  return `${proto}://${host}`;
}
