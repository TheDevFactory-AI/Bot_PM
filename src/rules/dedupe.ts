import { DEFAULT_TIME_ZONE, toLocalDateString } from "../utils/businessDays.js";
import type { Phase1WorkItem, ReminderReason, ReminderStage } from "./types.js";

export function buildReminderReasonSignature(input: {
  reason: ReminderReason;
  stage: ReminderStage;
  dueDate?: string | null;
  staleAfter?: string | null;
}): string {
  return [
    `reason=${input.reason}`,
    `stage=${input.stage}`,
    `due=${input.dueDate ?? ""}`,
    `stale_after=${input.staleAfter ?? ""}`,
  ].join("|");
}

export function buildReminderDedupeKey(input: {
  ruleName: string;
  targetId: string;
  recipientId: string;
  reasonSignature: string;
}): string {
  return [input.ruleName, input.targetId, input.recipientId, input.reasonSignature].join("::");
}

export function buildReminderStateFingerprint(
  workItem: Pick<
    Phase1WorkItem,
    "status" | "dueDate" | "ownerId" | "blockedState" | "priorityRecommendation" | "priorityCycle"
  >,
): string {
  return [
    `status=${workItem.status}`,
    `due=${workItem.dueDate ?? ""}`,
    `owner=${workItem.ownerId ?? ""}`,
    `blocked=${workItem.blockedState ?? ""}`,
    `priority=${workItem.priorityRecommendation ?? ""}`,
    `cycle=${workItem.priorityCycle?.id ?? ""}`,
  ].join("|");
}

export function buildDailyBriefDedupeKey(input: {
  cycleId: string;
  routeTo: string;
  scheduledFor: string | Date;
  timeZone?: string;
}): string {
  const timeZone = input.timeZone ?? DEFAULT_TIME_ZONE;
  const localDay = toLocalDateString(input.scheduledFor, timeZone);

  return ["daily_brief", input.cycleId, input.routeTo, localDay].join("::");
}
