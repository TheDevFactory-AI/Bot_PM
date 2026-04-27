import { resolveRunMode } from "./config/runtime.js";
import { runCentralAgent } from "./bot/runCentralAgent.js";

await runCentralAgent({
  source: "local",
  mode: resolveRunMode(process.argv.find((argument) => argument.startsWith("--mode="))?.split("=")[1]),
});
