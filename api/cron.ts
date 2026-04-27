import type { VercelRequest, VercelResponse } from "@vercel/node";

import { runCentralAgent } from "../src/bot/runCentralAgent.js";
import { getEnv } from "../src/config/env.js";

function logCronEvent(event: string, details: Record<string, unknown> = {}): void {
  console.log(
    JSON.stringify({
      event,
      invokedAt: new Date().toISOString(),
      ...details,
    }),
  );
}

function isAuthorized(request: VercelRequest): boolean {
  const authHeader = request.headers.authorization;
  const expectedSecret = getEnv("CRON_SECRET");

  return authHeader === `Bearer ${expectedSecret}`;
}

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  logCronEvent("central_agent.cron_invoked", {
    method: request.method,
    userAgent: request.headers["user-agent"] ?? null,
  });

  if (!isAuthorized(request)) {
    logCronEvent("central_agent.cron_unauthorized");
    response.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  try {
    await runCentralAgent({
      source: "vercel-cron",
      mode: "live",
    });
  } catch (error) {
    logCronEvent("central_agent.cron_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    response.status(500).json({ ok: false, error: "Cron run failed" });
    return;
  }

  response.status(200).json({ ok: true });
}
