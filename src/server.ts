import "./lib/error-capture";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { parseInterviewMetricsBody } from "./lib/api/interview.functions";
import { saveInterviewMetrics } from "./lib/insforge.server";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);

    if (url.pathname === "/api/interviews/metrics" && request.method === "POST") {
      try {
        const body = await request.json();
        const metrics = parseInterviewMetricsBody(body);
        const row = await saveInterviewMetrics(metrics);
        return new Response(
          JSON.stringify({
            id: row.id,
            sessionId: row.session_id,
            createdAt: row.created_at,
          }),
          { headers: { "content-type": "application/json" } },
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to save metrics";
        const status = message.includes("Missing INSFORGE") ? 503 : 400;
        return new Response(JSON.stringify({ error: message }), {
          status,
          headers: { "content-type": "application/json" },
        });
      }
    }

    // Luồng TanStack Start mặc định
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};