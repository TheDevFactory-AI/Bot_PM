import { getConnectorReadiness } from "../config/env.js";
import { keyGuardrails, mvpScope, planPhases } from "../planning/mvpPlan.js";

export function buildStartupReport(): string {
  const readiness = getConnectorReadiness();

  const lines = [
    "Central Agent boot summary",
    "",
    "MVP scope:",
    ...mvpScope.map((item) => `- ${item}`),
    "",
    "Planned phases:",
    ...planPhases.map((phase) => `- ${phase.name}: ${phase.outcomes.join("; ")}`),
    "",
    "Connector readiness:",
    ...Object.entries(readiness).map(([name, details]) =>
      details.configured
        ? `- ${name}: configured`
        : `- ${name}: missing ${details.missing.join(", ")}`,
    ),
    "",
    "Guardrails:",
    ...keyGuardrails.map((item) => `- ${item}`),
  ];

  return lines.join("\n");
}
