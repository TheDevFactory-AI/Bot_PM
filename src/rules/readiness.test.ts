import { describe, expect, it } from "vitest";

import { evaluateReadiness } from "./readiness.js";

describe("evaluateReadiness", () => {
  it("marks readiness blocked when demo work is blocked", () => {
    const result = evaluateReadiness(
      {
        pageId: "cycle-page",
        cycleId: "cycle-1",
        name: "Sprint 1",
        cycleType: "Sprint",
        startDate: null,
        endDate: null,
        cycleStatus: "Active",
        workItemPageIds: [],
        signalPageIds: [],
        briefPageIds: [],
        readinessGatePageIds: [],
        botRunPageIds: [],
        totalDueInSprint: 0,
        completedByDueDate: 0,
        sprintCompletionRate: 0,
        notionUrl: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        archived: false,
      },
      [
        {
          pageId: "work-item-page",
          workItemId: "WI-1",
          name: "Demo flow",
          status: "Blocked",
          ownerIds: [],
          dueDate: null,
          completedAt: null,
          priorityCyclePageIds: [],
          customerImpact: 5,
          revenueImpact: 5,
          demoImpact: 5,
          criticality: 5,
          effort: 2,
          blockedState: "Blocked - External",
          dependsOnPageIds: [],
          qaPresent: true,
          testsPresent: true,
          confirmedPriority: "P0",
          demoScope: true,
          lastActivitySource: null,
          latestBotNote: "",
          botHistoryUrl: null,
          computedHardBlocked: null,
          priorityScore: 90,
          priorityRecommendation: "P0",
          priorityNeedsReview: false,
          priorityMissingInputs: "",
          statusNudgeEligible: false,
          customerPageIds: [],
          conversationPageIds: [],
          signalPageIds: [],
          briefPageIds: [],
          completedOnTime: null,
          readyEvidencePresent: true,
          notionUrl: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          archived: false,
        },
      ],
      undefined,
      new Date("2026-04-25T12:00:00Z"),
    );

    expect(result.computedStatus).toBe("Blocked");
    expect(result.blockedWorkItemCount).toBe(1);
  });
});
