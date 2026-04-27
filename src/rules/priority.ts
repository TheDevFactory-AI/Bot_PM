import type { WorkItem } from "../domain/phase1/index.js";
import type { PriorityPatchIntent } from "../planning/phase1/intents.js";

const REQUIRED_FIELDS = [
  "Customer Impact",
  "Revenue Impact",
  "Demo Impact",
  "Criticality",
  "Effort",
] as const;

export function evaluatePriority(workItem: WorkItem): PriorityPatchIntent {
  const missing: string[] = [];
  if (workItem.customerImpact === null) missing.push(REQUIRED_FIELDS[0]);
  if (workItem.revenueImpact === null) missing.push(REQUIRED_FIELDS[1]);
  if (workItem.demoImpact === null) missing.push(REQUIRED_FIELDS[2]);
  if (workItem.criticality === null) missing.push(REQUIRED_FIELDS[3]);
  if (workItem.effort === null) missing.push(REQUIRED_FIELDS[4]);

  if (missing.length > 0) {
    return {
      pageId: workItem.pageId,
      score: null,
      recommendation: null,
      needsReview: true,
      missingInputs: missing.join(", "),
    };
  }

  const score = Math.round(
    100 *
      (0.35 * (workItem.customerImpact ?? 0) / 5 +
        0.25 * (workItem.revenueImpact ?? 0) / 5 +
        0.2 * (workItem.demoImpact ?? 0) / 5 +
        0.15 * (workItem.criticality ?? 0) / 5 +
        0.05 * (5 - (workItem.effort ?? 0)) / 5),
  );

  return {
    pageId: workItem.pageId,
    score,
    recommendation: toPriorityBand(score),
    needsReview: false,
    missingInputs: "",
  };
}

function toPriorityBand(score: number) {
  if (score >= 80) return "P0" as const;
  if (score >= 65) return "P1" as const;
  if (score >= 45) return "P2" as const;
  return "P3" as const;
}
