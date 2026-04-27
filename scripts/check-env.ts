import { getConnectorReadiness, missingRequiredEnv } from "../src/config/env.js";

const missing = missingRequiredEnv();
const readiness = getConnectorReadiness();

if (missing.length > 0) {
  console.error(`Missing required env vars for basic runtime: ${missing.join(", ")}`);
}

for (const [name, details] of Object.entries(readiness)) {
  if (details.configured) {
    console.log(`${name}: configured`);
    continue;
  }

  console.log(`${name}: missing ${details.missing.join(", ")}`);
}

if (missing.length > 0) {
  process.exit(1);
}
