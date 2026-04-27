import type { VercelRequest, VercelResponse } from "@vercel/node";

import { runCentralAgent } from "../src/bot/runCentralAgent.js";
import { getEnv } from "../src/config/env.js";

function isAuthorized(request: VercelRequest): boolean {
  const authHeader = request.headers.authorization;
  const expectedSecret = getEnv("CRON_SECRET");

  return authHeader === `Bearer ${expectedSecret}`;
}

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  if (!isAuthorized(request)) {
    response.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  await runCentralAgent({
    source: "vercel-cron",
    mode: "live",
  });

  response.status(200).json({ ok: true });
}
