import type { PagesFunction } from "../_types";

type Env = {
  TODFLOW_API_ORIGIN?: string;
  TODOFLOW_API_ORIGIN?: string;
};

function jsonErr(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function normalizeOrigin(raw: string): string | null {
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

const DEFAULT_API_ORIGIN = "https://todoflow-api-staging.htahta103.workers.dev";

export const onRequest: PagesFunction<Env> = async (context) => {
  const envOrigin = context.env.TODFLOW_API_ORIGIN ?? context.env.TODOFLOW_API_ORIGIN;
  const apiOrigin = envOrigin ? normalizeOrigin(envOrigin) : DEFAULT_API_ORIGIN;
  if (!apiOrigin) {
    return jsonErr("Invalid API origin. Set TODFLOW_API_ORIGIN (or TODOFLOW_API_ORIGIN).", 503);
  }

  const url = new URL(context.request.url);
  const upstreamUrl = new URL(apiOrigin);
  upstreamUrl.pathname = url.pathname;
  upstreamUrl.search = url.search;

  const headers = new Headers(context.request.headers);
  headers.delete("host");

  const method = context.request.method.toUpperCase();
  const upstreamReq = new Request(upstreamUrl.toString(), {
    method,
    headers,
    body: method === "GET" || method === "HEAD" ? undefined : context.request.body,
    redirect: "manual",
  });

  return fetch(upstreamReq);
};
