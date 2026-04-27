import type { RuntimeConfig, RunMode } from "../config/runtime.js";

export type RunSource = "local" | "vercel-cron";

export interface RunCentralAgentOptions {
  source: RunSource;
  mode?: RunMode;
  now?: Date;
}

export interface TickContext {
  batchId: string;
  now: Date;
  source: RunSource;
  mode: RunMode;
  config: RuntimeConfig;
}
