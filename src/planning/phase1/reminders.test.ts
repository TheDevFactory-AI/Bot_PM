import { describe, expect, it } from "vitest";

import { planReminder } from "./reminders.js";

describe("planReminder", () => {
  it("starts with the first stale nudge", () => {
    const result = planReminder({
      workItem: {
        id: "WI-1",
        name: "Aging item",
        status: "In Progress",
        ownerId: "person-1",
        ownerSlackId: "U123",
        dueDate: "2026-05-01",
        priorityCycle: {
          id: "cycle-1",
          name: "Sprint 1",
          status: "Active",
        },
        blockedState: "Not Blocked",
        priorityRecommendation: "P1",
        lastMeaningfulUpdateAt: "2026-04-22T12:00:00Z",
      },
      reminderHistory: [],
      now: "2026-04-25T12:00:00Z",
    });

    expect(result.shouldSend).toBe(true);
    expect(result.stage).toBe("nudge_1");
    expect(result.destinations.dm).toBe(true);
  });
});
