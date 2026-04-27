import {
  DEFAULT_TIME_ZONE,
  differenceInBusinessDays,
  toDate,
} from "../../utils/businessDays.js";
import { buildReminderReasonSignature, buildReminderStateFingerprint } from "../../rules/dedupe.js";
import { evaluateStaleness } from "../../rules/stale.js";
import type {
  Phase1WorkItem,
  ReminderHistoryEntry,
  ReminderReason,
  ReminderStage,
} from "../../rules/types.js";

export interface ReminderPlan {
  shouldSend: boolean;
  reason: ReminderReason | null;
  stage: ReminderStage | null;
  briefType: "Status Update Nudge" | "Sprint Completion Reminder" | null;
  destinations: {
    dm: boolean;
    slackChannel: boolean;
    batchedEmail: boolean;
  };
  recipientId: string | null;
  reasonSignature: string | null;
  reminderStateFingerprint: string;
  suppressionKeyRecipientId: string | null;
  notes: string[];
}

export function planReminder(input: {
  workItem: Phase1WorkItem;
  reminderHistory?: readonly ReminderHistoryEntry[];
  now: string | Date;
  timeZone?: string;
}): ReminderPlan {
  const timeZone = input.timeZone ?? DEFAULT_TIME_ZONE;
  const staleness = evaluateStaleness({
    workItem: input.workItem,
    now: input.now,
    timeZone,
  });
  const recentHistory = filterHistorySinceLatestMeaningfulUpdate(
    input.reminderHistory ?? [],
    input.workItem.lastMeaningfulUpdateAt,
    timeZone,
  );
  const reminderStateFingerprint = buildReminderStateFingerprint(input.workItem);
  const dueSoonReasonApplies =
    staleness.isActiveCycle &&
    staleness.hasOwner &&
    staleness.isStatusEligible &&
    staleness.isDueSoon &&
    !staleness.isOverdue;

  if (dueSoonReasonApplies) {
    const plan = planDueSoonReminder(input.workItem, recentHistory, input.now, timeZone);

    if (plan != null) {
      return finalizeReminderPlan(input.workItem, reminderStateFingerprint, plan, staleness.staleAfter);
    }
  }

  if (staleness.isStale) {
    const plan = planStaleReminder(input.workItem, recentHistory, input.now, timeZone);

    if (plan != null) {
      return finalizeReminderPlan(input.workItem, reminderStateFingerprint, plan, staleness.staleAfter);
    }
  }

  return {
    shouldSend: false,
    reason: null,
    stage: null,
    briefType: null,
    destinations: {
      dm: false,
      slackChannel: false,
      batchedEmail: false,
    },
    recipientId: input.workItem.ownerId ?? null,
    reasonSignature: null,
    reminderStateFingerprint,
    suppressionKeyRecipientId: input.workItem.ownerId ?? null,
    notes: [],
  };
}

function planDueSoonReminder(
  workItem: Phase1WorkItem,
  reminderHistory: readonly ReminderHistoryEntry[],
  now: string | Date,
  timeZone: string,
): { reason: ReminderReason; stage: ReminderStage; notes: string[] } | null {
  const relevantHistory = reminderHistory.filter((entry) => entry.reason === "due_soon");
  const latestEntry = relevantHistory[relevantHistory.length - 1];

  if (latestEntry == null) {
    return {
      reason: "due_soon",
      stage: "nudge_1",
      notes: [],
    };
  }

  if (latestEntry.stage === "escalation") {
    return null;
  }

  const elapsedBusinessDays = differenceInBusinessDays(latestEntry.sentAt, now, timeZone);

  if (latestEntry.stage === "nudge_1" && elapsedBusinessDays >= 1) {
    return {
      reason: "due_soon",
      stage: "escalation",
      notes: [],
    };
  }

  return null;
}

function planStaleReminder(
  workItem: Phase1WorkItem,
  reminderHistory: readonly ReminderHistoryEntry[],
  now: string | Date,
  timeZone: string,
): { reason: ReminderReason; stage: ReminderStage; notes: string[] } | null {
  const relevantHistory = reminderHistory.filter((entry) => entry.reason === "stale");
  const latestEntry = relevantHistory[relevantHistory.length - 1];

  if (latestEntry == null) {
    return {
      reason: "stale",
      stage: "nudge_1",
      notes: [],
    };
  }

  if (latestEntry.stage === "escalation") {
    return null;
  }

  const elapsedBusinessDays = differenceInBusinessDays(latestEntry.sentAt, now, timeZone);

  if (latestEntry.stage === "nudge_1" && elapsedBusinessDays >= 2) {
    return {
      reason: "stale",
      stage: "nudge_2",
      notes: [],
    };
  }

  if (latestEntry.stage === "nudge_2" && elapsedBusinessDays >= 2) {
    return {
      reason: "stale",
      stage: "escalation",
      notes: [],
    };
  }

  return null;
}

function finalizeReminderPlan(
  workItem: Phase1WorkItem,
  reminderStateFingerprint: string,
  plan: { reason: ReminderReason; stage: ReminderStage; notes: string[] },
  staleAfter: string | null,
): ReminderPlan {
  const hasOwnerDmRoute = workItem.ownerSlackId != null && workItem.ownerSlackId !== "";
  const isEscalation = plan.stage === "escalation";
  const notes = [...plan.notes];
  const directRecipientId = workItem.ownerSlackId ?? workItem.ownerId ?? null;

  if (!hasOwnerDmRoute) {
    notes.push("missing owner routing");
  }

  return {
    shouldSend: true,
    reason: plan.reason,
    stage: plan.stage,
    briefType: plan.reason === "stale" ? "Status Update Nudge" : "Sprint Completion Reminder",
    destinations: {
      dm: hasOwnerDmRoute && !isEscalation,
      slackChannel: isEscalation || !hasOwnerDmRoute,
      batchedEmail: isEscalation,
    },
    recipientId: directRecipientId,
    reasonSignature: buildReminderReasonSignature({
      reason: plan.reason,
      stage: plan.stage,
      dueDate: workItem.dueDate ?? null,
      staleAfter,
    }),
    reminderStateFingerprint,
    suppressionKeyRecipientId: hasOwnerDmRoute && !isEscalation ? directRecipientId : "escalation_channel",
    notes,
  };
}

function filterHistorySinceLatestMeaningfulUpdate(
  reminderHistory: readonly ReminderHistoryEntry[],
  lastMeaningfulUpdateAt: string | null | undefined,
  _timeZone: string,
): ReminderHistoryEntry[] {
  if (lastMeaningfulUpdateAt == null) {
    return [...reminderHistory].sort((left, right) => left.sentAt.localeCompare(right.sentAt));
  }

  const latestMeaningfulUpdate = toDate(lastMeaningfulUpdateAt).getTime();

  return reminderHistory
    .filter((entry) => toDate(entry.sentAt).getTime() >= latestMeaningfulUpdate)
    .sort((left, right) => left.sentAt.localeCompare(right.sentAt));
}
