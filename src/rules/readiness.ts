import type { PriorityCycle, ReadinessGate, WorkItem } from "../domain/phase1/index.js";
import type { ReadinessIntent } from "../planning/phase1/intents.js";
import { isHardBlocked } from "./blockers.js";

export function evaluateReadiness(
  cycle: PriorityCycle,
  workItems: WorkItem[],
  existingGate: ReadinessGate | undefined,
  now: Date,
): ReadinessIntent {
  const workItemsById = new Map(workItems.map((item) => [item.pageId, item]));
  const demoItems = workItems.filter((item) => item.demoScope);
  const blockedItems = demoItems.filter((item) => isHardBlocked(item, workItemsById));
  const missingQaItems = demoItems.filter((item) => !item.qaPresent);
  const missingTestsItems = demoItems.filter((item) => !item.testsPresent);
  const githubCiState = existingGate?.githubCiState ?? "Unknown";
  const githubCiCheckedAt = existingGate?.githubCiCheckedAt ?? null;

  let computedStatus: ReadinessIntent["computedStatus"] = "Healthy";
  if (blockedItems.length > 0 || githubCiState === "Failing") {
    computedStatus = "Blocked";
  } else if (missingQaItems.length > 0 || missingTestsItems.length > 0 || githubCiState === "Unknown") {
    computedStatus = "At Risk";
  }

  return {
    gateId: existingGate?.gateId ?? `demo_readiness:${cycle.cycleId}`,
    name: `Demo Readiness - ${cycle.name}`,
    priorityCyclePageId: cycle.pageId,
    githubCiState,
    githubCiCheckedAt,
    confirmedStatus: computedStatus,
    computedStatus,
    lastEvaluatedAt: now.toISOString(),
    workItemPageIds: demoItems.map((item) => item.pageId),
    blockedWorkItemCount: blockedItems.length,
    missingQaCount: missingQaItems.length,
    missingTestsCount: missingTestsItems.length,
    demoReady: computedStatus === "Healthy",
  };
}
