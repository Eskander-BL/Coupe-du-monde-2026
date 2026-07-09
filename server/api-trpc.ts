import "dotenv/config";
import type { IncomingMessage, ServerResponse } from "node:http";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createFetchContext } from "./_core/context";
import { appRouter } from "./routers";

async function nodeRequestToFetchRequest(req: IncomingMessage): Promise<Request> {
  const protocol =
    (req.headers["x-forwarded-proto"] as string | undefined) ?? "http";
  const host = req.headers.host ?? "localhost";
  const url = new URL(req.url ?? "/", `${protocol}://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
      continue;
    }
    headers.set(key, value);
  }

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    if (chunks.length > 0) {
      init.body = Buffer.concat(chunks);
    }
  }

  return new Request(url, init);
}

async function sendFetchResponse(
  res: ServerResponse,
  response: Response,
): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  res.end(Buffer.from(await response.arrayBuffer()));
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  try {
    const request = await nodeRequestToFetchRequest(req);
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: request,
      router: appRouter,
      createContext: ({ req }) => createFetchContext(req),
    });
    await sendFetchResponse(res, response);
  } catch (error) {
    console.error("[tRPC] Handler failed:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ok: false,
        reason: "trpc_handler_failed",
        error: error instanceof Error ? error.message : "unknown_error",
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      }),
    );
  }
}
