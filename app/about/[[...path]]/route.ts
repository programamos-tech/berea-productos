import { readAboutAsset, aboutHostAllowed } from "@/lib/about-site";
import { publicHostname } from "@/lib/tenancy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ path?: string[] }> };

export async function GET(request: Request, ctx: RouteCtx) {
  const host = publicHostname(new Headers(request.headers), new URL(request.url).hostname);
  if (!aboutHostAllowed(host)) {
    return new Response("Not found", { status: 404 });
  }

  const { path: parts } = await ctx.params;
  const asset = await readAboutAsset(parts);
  if (!asset) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(asset.body), {
    headers: {
      "content-type": asset.contentType,
      "cache-control": asset.cacheControl,
    },
  });
}
