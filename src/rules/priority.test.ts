import { describe, expect, it } from "vitest";

import { evaluatePriority } from "./priority.js";

describe("evaluatePriority", () => {
  it("scores a fully populated work item", () => {
    const result = evaluatePriority({
      pageId: "page-1",
      workItemId: "WI-1",
      name: "Critical fix",
      status: "In Progress",
      ownerIds: [],
      dueDate: null,
      completedAt: null,
      priorityCyclePageIds: [],
      customerImpact: 5,
      revenueImpact: 5,
      demoImpact: 5,
      criticality: 5,
      effort: 1,
      blockedState: "Not Blocked",
      dependsOnPageIds: [],
      qaPresent: false,
      testsPresent: false,
      confirmedPriority: null,
      demoScope: false,
      lastActivitySource: null,
      latestBotNote: "",
      botHistoryUrl: null,
      computedHardBlocked: null,
      priorityScore: null,
      priorityRecommendation: null,
      priorityNeedsReview: null,
      priorityMissingInputs: "",
      statusNudgeEligible: null,
      customerPageIds: [],
      conversationPageIds: [],
      signalPageIds: [],
      briefPageIds: [],
      completedOnTime: null,
      readyEvidencePresent: null,
      notionUrl: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archived: false,
    });

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.recommendation).toBe("P0");
    expect(result.needsReview).toBe(false);
  });

  it("routes missing inputs to review", () => {
    const result = evaluatePriority({
      pageId: "page-2",
      workItemId: "WI-2",
      name: "Needs review",
      status: "Ready",
      ownerIds: [],
      dueDate: null,
      completedAt: null,
      priorityCyclePageIds: [],
      customerImpact: null,
      revenueImpact: 4,
      demoImpact: 2,
      criticality: 3,
      effort: 2,
      blockedState: "Not Blocked",
      dependsOnPageIds: [],
      qaPresent: false,
      testsPresent: false,
      confirmedPriority: null,
      demoScope: false,
      lastActivitySource: null,
      latestBotNote: "",
      botHistoryUrl: null,
      computedHardBlocked: null,
      priorityScore: null,
      priorityRecommendation: null,
      priorityNeedsReview: null,
      priorityMissingInputs: "",
      statusNudgeEligible: null,
      customerPageIds: [],
      conversationPageIds: [],
      signalPageIds: [],
      briefPageIds: [],
      completedOnTime: null,
      readyEvidencePresent: null,
      notionUrl: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archived: false,
    });

    expect(result.score).toBeNull();
    expect(result.needsReview).toBe(true);
    expect(result.missingInputs).toContain("Customer Impact");
  });
});
