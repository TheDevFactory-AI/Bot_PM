import { getRuntimeConfig, resolveRunMode } from "../config/runtime.js";
import { runPhase1OpsMvp } from "./runPhase1OpsMvp.js";
import type { RunCentralAgentOptions } from "./types.js";

export async function runCentralAgent(options: RunCentralAgentOptions) {
  const now = options.now ?? new Date();
  const mode = resolveRunMode(options.mode);
  const config = getRuntimeConfig();
  const batchId = `${now.toISOString()}_${options.source}`;

  console.log(
    JSON.stringify({
      event: "central_agent.started",
      source: options.source,
      startedAt: now.toISOString(),
      mode,
      batchId,
    }),
  );

  const result = await runPhase1OpsMvp({
    batchId,
    now,
    source: options.source,
    mode,
    config,
  });

  console.log(
    JSON.stringify({
      event: "central_agent.completed",
      ...result,
    }),
  );

  return result;
}
