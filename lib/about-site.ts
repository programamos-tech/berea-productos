import { readFile } from "node:fs/promises";
import path from "node:path";
import { resolveTenantFromHost } from "@/lib/tenancy";

const SITE_ROOT = path.join(process.cwd(), "sitio");

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

export function aboutHostAllowed(hostHeader: string | null): boolean {
  const kind = resolveTenantFromHost(hostHeader).kind;
  return kind === "platform" || kind === "local";
}

function fileInsideSite(parts: string[]): string | null {
  const rel = parts.join("/");
  if (!rel || rel.includes("\0")) return null;
  const abs = path.resolve(SITE_ROOT, rel);
  const fromRoot = path.relative(SITE_ROOT, abs);
  if (fromRoot.startsWith("..") || path.isAbsolute(fromRoot)) return null;
  const ext = path.extname(abs).toLowerCase();
  if (!CONTENT_TYPES[ext]) return null;
  return abs;
}

export async function readAboutAsset(parts: string[] | undefined): Promise<{
  body: Buffer;
  contentType: string;
  cacheControl: string;
} | null> {
  const file = fileInsideSite(parts?.length ? parts : ["index.html"]);
  if (!file) return null;
  let body: Buffer;
  try {
    body = await readFile(file);
  } catch {
    return null;
  }
  const ext = path.extname(file).toLowerCase();
  if (ext === ".html") {
    const html = body.toString("utf8").replace(
      "<head>",
      '<head>\n  <base href="/about/">',
    );
    body = Buffer.from(html);
  }
  return {
    body,
    contentType: CONTENT_TYPES[ext] ?? "application/octet-stream",
    cacheControl: ext === ".html" ? "no-cache" : "public, max-age=86400",
  };
}
