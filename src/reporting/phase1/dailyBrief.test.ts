import { describe, expect, it } from "vitest";

import { renderSlackDailyBrief } from "../../integrations/slack/index.js";

describe("daily brief rendering", () => {
  it("caps sections and includes overflow marker", () => {
    const text = renderSlackDailyBrief({
      sprintName: "Sprint 1",
      generatedAt: "2026-04-25T12:00:00Z",
      sprintSnapshot: ["5 active items"],
      topPriorities: ["1", "2", "3", "4", "5", "6"],
      explicitBlockers: [],
      dueSoon: [],
      staleItems: [],
      softBlockers: [],
      demoReadiness: ["Healthy"],
    });

    expect(text).toContain("+1 more");
  });
});
