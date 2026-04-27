import type { BotRun, Brief, PriorityCycle, WorkItem } from "../domain/phase1/index.js";
import type { StatusNudgeIntent } from "../planning/phase1/intents.js";
import { addBusinessDays, businessDaysBetween, isWithinBusinessDays } from "../utils/businessTime.js";

export function evaluateStaleWorkItems(input: {
  now: Date;
  timezone: string;
  cycle: PriorityCycle;
  workItems: WorkItem[];
  briefs: Brief[];
  botRuns: BotRun[];
}): StatusNudgeIntent[] {
  const { now, timezone, cycle, workItems, briefs } = input;

  return workItems
    .filter((item) =>
      ["Ready", "In Progress", "Blocked", "In Review"].includes(item.status ?? "") &&
      item.priorityCyclePageIds.includes(cycle.pageId),
    )
    .flatMap((item) => {
      const updatedAt = new Date(item.updatedAt);
      const stale = businessDaysBetween(updatedAt, now, timezone) >= 2;
      const dueSoon =
        item.dueDate !== null &&
        isWithinBusinessDays(new Date(item.dueDate), 2, now, timezone);

      if (!stale && !dueSoon) {
        return [];
      }

      const relatedBriefs = briefs.filter((brief) => brief.relatedWorkItemPageIds.includes(item.pageId));
      const reminderStage = relatedBriefs.length + 1;
      const shouldEscalate = reminderStage >= 3;

      return [
        {
          pageId: item.pageId,
          workItemId: item.workItemId,
          workItemName: item.name,
          ownerPageIds: item.ownerIds,
          status: item.status ?? "Unknown",
          dueDate: item.dueDate,
          priorityCycleName: cycle.name,
          reason: dueSoon ? "Due within 2 business days" : "No meaningful update for 2 business days",
          cadenceLabel: dueSoon && reminderStage >= 2 ? "Sprint Completion Reminder" : "Status Update Nudge",
          latestBotNote:
            dueSoon && reminderStage >= 2
              ? `Still due soon in ${cycle.name} with no meaningful update.`
              : `No meaningful update detected on this sprint item.`,
          notionUrl: item.notionUrl,
          reminderStage,
          shouldEscalate,
        },
      ];
    });
}

export function computeCooldownUntil(now: Date, stage: number, timezone: string): string {
  return addBusinessDays(now, stage >= 2 ? 2 : 1, timezone).toISOString();
}
