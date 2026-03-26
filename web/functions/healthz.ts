interface Env {
  TODFLOW_API_ORIGIN?: string;
  TODOFLOW_API_ORIGIN?: string;
}

export async function onRequest(context: { env: Env }): Promise<Response> {
  const { env } = context;
  const apiOrigin = (env.TODFLOW_API_ORIGIN ?? env.TODOFLOW_API_ORIGIN)?.trim() || null;

  return new Response(
    JSON.stringify({
      ok: true,
      service: "todoflow-pages",
      apiProxyConfigured: Boolean(apiOrigin),
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    },
  );
}

