import type { PriorityCycle, ReadinessGate, Signal, WorkItem } from "../../domain/phase1/index.js";
import type { DailyBriefIntent, PriorityPatchIntent, StatusNudgeIntent } from "../../planning/phase1/intents.js";
import { isHardBlocked } from "../../rules/blockers.js";

export function buildDailyBrief(input: {
  now: Date;
  cycle: PriorityCycle;
  workItems: WorkItem[];
  signals: Signal[];
  readiness: ReadinessGate | { computedStatus: string; blockedWorkItemCount: number; missingQaCount: number; missingTestsCount: number };
  priorityPatches: PriorityPatchIntent[];
  statusNudges: StatusNudgeIntent[];
  routeTo: string;
}): DailyBriefIntent {
  const workItemsByPageId = new Map(input.workItems.map((item) => [item.pageId, item]));
  const scored = input.priorityPatches
    .filter((patch) => patch.score !== null)
    .sort((left, right) => (right.score ?? 0) - (left.score ?? 0));
  const blockers = input.workItems.filter((item) => isHardBlocked(item, workItemsByPageId));
  const dueSoon = input.workItems
    .filter((item) => item.dueDate)
    .sort((left, right) => (left.dueDate ?? "").localeCompare(right.dueDate ?? ""));
  const softBlockers = input.signals.filter(
    (signal) =>
      signal.signalType === "soft_blocker" &&
      signal.reviewStatus === "Accepted" &&
      signal.workItemPageIds.some((pageId) => workItemsByPageId.has(pageId)),
  );

  const relatedWorkItemPageIds = new Set<string>();
  const relatedSignalPageIds = new Set<string>();

  const topPriorities = scored.slice(0, 5).map((patch) => {
    relatedWorkItemPageIds.add(patch.pageId);
    const item = workItemsByPageId.get(patch.pageId);
    return `${patch.recommendation ?? "Review"} - ${item?.name ?? patch.pageId}`;
  });

  const explicitBlockers = blockers.slice(0, 10).map((item) => {
    relatedWorkItemPageIds.add(item.pageId);
    return `${item.name} is hard blocked`;
  });

  const dueSoonLines = dueSoon.slice(0, 10).map((item) => {
    relatedWorkItemPageIds.add(item.pageId);
    return `${item.name} due ${item.dueDate}`;
  });

  const staleLines = input.statusNudges.slice(0, 10).map((nudge) => {
    relatedWorkItemPageIds.add(nudge.pageId);
    return `${nudge.workItemName}: ${nudge.reason}`;
  });

  const softBlockerLines = softBlockers.slice(0, 5).map((signal) => {
    relatedSignalPageIds.add(signal.pageId);
    return signal.name;
  });

  return {
    briefType: "Daily Brief",
    route: "Notion+DM",
    routeTo: input.routeTo,
    dedupeKey: `daily-brief:${input.cycle.cycleId}:${input.now.toISOString().slice(0, 10)}`,
    scheduledFor: input.now.toISOString(),
    title: `Daily Brief - ${input.cycle.name}`,
    sprintName: input.cycle.name,
    sprintSnapshot: [
      `${input.workItems.length} active sprint items`,
      `${blockers.length} explicit blockers`,
      `${input.cycle.sprintCompletionRate ?? 0}% sprint completion rate`,
    ],
    topPriorities,
    explicitBlockers,
    dueSoon: dueSoonLines,
    staleItems: staleLines,
    softBlockers: softBlockerLines,
    demoReadiness: [
      `Status: ${input.readiness.computedStatus}`,
      `Blocked items: ${input.readiness.blockedWorkItemCount}`,
      `Missing QA: ${input.readiness.missingQaCount}`,
      `Missing tests: ${input.readiness.missingTestsCount}`,
    ],
    relatedWorkItemPageIds: [...relatedWorkItemPageIds],
    relatedSignalPageIds: [...relatedSignalPageIds],
    sourceSnapshot: JSON.stringify({
      cycleId: input.cycle.cycleId,
      workItemCount: input.workItems.length,
      blockerCount: blockers.length,
      staleCount: input.statusNudges.length,
      softBlockerCount: softBlockers.length,
    }),
  };
}
