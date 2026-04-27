import {
  DEFAULT_TIME_ZONE,
  addBusinessDays,
  differenceInBusinessDays,
  toLocalDateString,
} from "../utils/businessDays.js";
import type { Phase1WorkItem, WorkItemStatus } from "./types.js";

export const STALE_ELIGIBLE_STATUSES: readonly WorkItemStatus[] = [
  "Ready",
  "In Progress",
  "Blocked",
  "In Review",
];

export interface StalenessEvaluation {
  isActiveCycle: boolean;
  hasOwner: boolean;
  isStatusEligible: boolean;
  isStale: boolean;
  staleAfter: string | null;
  businessDaysSinceMeaningfulUpdate: number | null;
  isDueSoon: boolean;
  isOverdue: boolean;
  businessDaysUntilDue: number | null;
}

export function evaluateStaleness(input: {
  workItem: Pick<
    Phase1WorkItem,
    "status" | "ownerId" | "priorityCycle" | "dueDate" | "lastMeaningfulUpdateAt"
  >;
  now: string | Date;
  timeZone?: string;
}): StalenessEvaluation {
  const timeZone = input.timeZone ?? DEFAULT_TIME_ZONE;
  const { workItem } = input;
  const isActiveCycle = workItem.priorityCycle?.status === "Active";
  const hasOwner = workItem.ownerId != null && workItem.ownerId !== "";
  const isStatusEligible = STALE_ELIGIBLE_STATUSES.includes(workItem.status);
  const businessDaysSinceMeaningfulUpdate =
    workItem.lastMeaningfulUpdateAt == null
      ? null
      : differenceInBusinessDays(workItem.lastMeaningfulUpdateAt, input.now, timeZone);
  const staleAfter =
    workItem.lastMeaningfulUpdateAt == null
      ? null
      : addBusinessDays(workItem.lastMeaningfulUpdateAt, 2, timeZone);
  const businessDaysUntilDue =
    workItem.dueDate == null ? null : differenceInBusinessDays(input.now, workItem.dueDate, timeZone);
  const isOverdue =
    workItem.dueDate == null
      ? false
      : toLocalDateString(workItem.dueDate, timeZone) < toLocalDateString(input.now, timeZone);
  const isDueSoon =
    businessDaysUntilDue != null && businessDaysUntilDue >= 0 && businessDaysUntilDue <= 1;

  return {
    isActiveCycle,
    hasOwner,
    isStatusEligible,
    isStale:
      isActiveCycle &&
      hasOwner &&
      isStatusEligible &&
      businessDaysSinceMeaningfulUpdate != null &&
      businessDaysSinceMeaningfulUpdate >= 2,
    staleAfter,
    businessDaysSinceMeaningfulUpdate,
    isDueSoon,
    isOverdue,
    businessDaysUntilDue,
  };
}
