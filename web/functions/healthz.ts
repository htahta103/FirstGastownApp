import type { PagesFunction } from "./_types";

type Env = {
  TODFLOW_API_ORIGIN?: string;
  TODOFLOW_API_ORIGIN?: string;
};

function normalizeOrigin(origin: string): string {
  return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const apiOrigin = normalizeOrigin(
    context.env.TODFLOW_API_ORIGIN ??
      context.env.TODOFLOW_API_ORIGIN ??
      "https://todoflow-api-staging.htahta103.workers.dev",
  );

  const startedAt = Date.now();
  let apiHealthy: boolean | null = null;

  try {
    const res = await fetch(`${apiOrigin}/healthz`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    apiHealthy = res.ok;
  } catch {
    apiHealthy = false;
  }

  const payload = {
    status: apiHealthy ? "ok" : "degraded",
    apiOrigin,
    apiHealthy,
    durationMs: Date.now() - startedAt,
  };

  return new Response(JSON.stringify(payload), {
    status: apiHealthy ? 200 : 503,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
};

