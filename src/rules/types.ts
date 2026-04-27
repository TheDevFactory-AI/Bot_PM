export type WorkItemStatus =
  | "Backlog"
  | "Ready"
  | "In Progress"
  | "Blocked"
  | "In Review"
  | "Done"
  | "Canceled";

export type BlockedState = "Not Blocked" | "Blocked - Dependency" | "Blocked - External";

export type PriorityRecommendation = "P0" | "P1" | "P2" | "P3";

export type PriorityCycleStatus = "Planned" | "Active" | "Closed";

export type GitHubCiState = "Passing" | "Failing" | "Unknown";

export type ReadinessStatus = "Healthy" | "At Risk" | "Blocked";

export type SignalType =
  | "pain_point"
  | "objection"
  | "feature_request"
  | "next_step"
  | "soft_blocker"
  | "readiness_risk"
  | "status_nudge_candidate";

export type ReviewStatus = "New" | "Review" | "Accepted" | "Dismissed" | "Resolved";

export interface PriorityCycleRef {
  id: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  status: PriorityCycleStatus;
}

export interface WorkItemDependency {
  id: string;
  name?: string;
  status?: WorkItemStatus;
  blockedState?: BlockedState | null;
  isBlocking?: boolean;
}

export interface Phase1WorkItem {
  id: string;
  name: string;
  status: WorkItemStatus;
  ownerId?: string | null;
  ownerName?: string | null;
  ownerSlackId?: string | null;
  ownerEmail?: string | null;
  dueDate?: string | null;
  priorityCycle?: PriorityCycleRef | null;
  customerImpact?: number | null;
  revenueImpact?: number | null;
  demoImpact?: number | null;
  criticality?: number | null;
  effort?: number | null;
  blockedState?: BlockedState | null;
  dependencies?: readonly WorkItemDependency[];
  hasExplicitBlockedDependency?: boolean;
  qaPresent?: boolean | null;
  testsPresent?: boolean | null;
  demoScope?: boolean;
  confirmedPriority?: PriorityRecommendation | null;
  priorityRecommendation?: PriorityRecommendation | null;
  priorityScore?: number | null;
  lastMeaningfulUpdateAt?: string | null;
  notionUrl?: string | null;
}

export interface Phase1Signal {
  id: string;
  name: string;
  signalType: SignalType;
  confidence: number;
  reviewStatus?: ReviewStatus | null;
  workItemId?: string | null;
  customerId?: string | null;
}

export interface ReminderHistoryEntry {
  sentAt: string;
  stage: ReminderStage;
  reason: ReminderReason;
}

export type ReminderReason = "stale" | "due_soon";

export type ReminderStage = "nudge_1" | "nudge_2" | "escalation";
