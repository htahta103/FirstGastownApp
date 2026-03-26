/**
 * Proxies /api/* to the staging/production API origin so Cloudflare Pages can serve
 * the SPA while same-origin fetch("/api/...") hits the Go backend.
 *
 * Bind TODFLOW_API_ORIGIN in the Pages project (e.g. https://staging.example.com — no path, no trailing slash).
 */
interface Env {
  TODFLOW_API_ORIGIN?: string;
  TODOFLOW_API_ORIGIN?: string;
}

function jsonErr(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function normalizeOrigin(raw: string | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim().replace(/\/$/, "");
  if (!t) return null;
  try {
    const u = new URL(t);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const base = normalizeOrigin(env.TODFLOW_API_ORIGIN ?? env.TODOFLOW_API_ORIGIN);
  if (!base) {
    return jsonErr(
      "TodoFlow API proxy is not configured: set TODFLOW_API_ORIGIN (or TODOFLOW_API_ORIGIN) on the Pages project.",
      503,
    );
  }

  const src = new URL(request.url);
  const destUrl = `${base}${src.pathname}${src.search}`;

  const forward = new Request(destUrl, request);
  const res = await fetch(forward);
  return res;
}
