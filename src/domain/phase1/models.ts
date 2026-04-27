export type Phase1TableName =
  | "customers"
  | "conversations"
  | "signals"
  | "workItems"
  | "priorityCycles"
  | "readinessGates"
  | "briefs"
  | "botRuns"
  | "peopleDirectory";

export interface Phase1PageRecord {
  pageId: string;
  notionUrl: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface Phase1NamedRecord extends Phase1PageRecord {
  name: string;
}

export type CustomerStage = "Lead" | "Active" | "Pilot" | "Paused" | "Churned";
export type ConversationSourceType = "Demo" | "Discovery" | "Support" | "Voice Memo" | "Other";
export type ConversationExtractionStatus = "New" | "Parsed" | "Review" | "Accepted";
export type SignalType =
  | "pain_point"
  | "objection"
  | "feature_request"
  | "next_step"
  | "soft_blocker"
  | "readiness_risk"
  | "status_nudge_candidate";
export type SignalReviewStatus = "New" | "Review" | "Accepted" | "Dismissed" | "Resolved";
export type WorkItemStatus =
  | "Backlog"
  | "Ready"
  | "In Progress"
  | "Blocked"
  | "In Review"
  | "Done"
  | "Canceled";
export type WorkItemBlockedState = "Not Blocked" | "Blocked - Dependency" | "Blocked - External";
export type PriorityBand = "P0" | "P1" | "P2" | "P3";
export type WorkItemActivitySource = "Human" | "Bot";
export type PriorityCycleType = "Sprint" | "Week";
export type PriorityCycleStatus = "Planned" | "Active" | "Closed";
export type ReadinessGateType = "Demo Readiness";
export type GitHubCiState = "Passing" | "Failing" | "Unknown";
export type GateHealthStatus = "Healthy" | "At Risk" | "Blocked";
export type BriefType = "Daily Brief" | "Sprint Completion Reminder" | "Status Update Nudge";
export type BriefRoute = "Notion" | "DM" | "Notion+DM" | "Slack+Email";
export type BriefStatus = "Draft" | "Queued" | "Sent" | "Suppressed" | "Failed" | "Acknowledged";
export type BotRunResult = "Read" | "Drafted" | "Sent" | "Suppressed" | "Review" | "No-op" | "Failed";
export type BotRunTriggerSource = "Cron" | "Manual" | "Webhook";

export interface Customer extends Phase1NamedRecord {
  customerId: string;
  stage: CustomerStage | null;
  ownerIds: string[];
  active: boolean;
  conversationPageIds: string[];
  signalPageIds: string[];
  workItemPageIds: string[];
  briefPageIds: string[];
  latestConversationAt: string | null;
  openWorkItems: number | null;
  softBlockerCount: number | null;
  needsFollowUp: boolean | null;
}

export interface Conversation extends Phase1NamedRecord {
  conversationId: string;
  customerId: string;
  customerPageIds: string[];
  occurredAt: string | null;
  sourceType: ConversationSourceType | null;
  transcriptUrl: string | null;
  transcriptText: string;
  summary: string;
  extractionConfidence: number | null;
  extractionStatus: ConversationExtractionStatus | null;
  signalPageIds: string[];
  workItemPageIds: string[];
  needsReview: boolean | null;
  openSoftBlocker: boolean | null;
  signalCount: number | null;
}

export interface Signal extends Phase1NamedRecord {
  signalId: string;
  signalType: SignalType | null;
  sourceTable: string | null;
  sourceRowId: string | null;
  ruleName: string;
  confidence: number | null;
  reviewStatus: SignalReviewStatus | null;
  conversationPageIds: string[];
  customerPageIds: string[];
  workItemPageIds: string[];
  priorityCyclePageIds: string[];
  briefPageIds: string[];
  botRunPageIds: string[];
  needsReview: boolean | null;
  isSoftBlocker: boolean | null;
  isOpen: boolean | null;
  dedupeKey: string | null;
}

export interface WorkItem extends Phase1NamedRecord {
  workItemId: string;
  status: WorkItemStatus | null;
  ownerIds: string[];
  dueDate: string | null;
  completedAt: string | null;
  priorityCyclePageIds: string[];
  customerImpact: number | null;
  revenueImpact: number | null;
  demoImpact: number | null;
  criticality: number | null;
  effort: number | null;
  blockedState: WorkItemBlockedState | null;
  dependsOnPageIds: string[];
  qaPresent: boolean;
  testsPresent: boolean;
  confirmedPriority: PriorityBand | null;
  demoScope: boolean;
  lastActivitySource: WorkItemActivitySource | null;
  latestBotNote: string;
  botHistoryUrl: string | null;
  computedHardBlocked: boolean | null;
  priorityScore: number | null;
  priorityRecommendation: PriorityBand | null;
  priorityNeedsReview: boolean | null;
  priorityMissingInputs: string;
  statusNudgeEligible: boolean | null;
  customerPageIds: string[];
  conversationPageIds: string[];
  signalPageIds: string[];
  briefPageIds: string[];
  completedOnTime: boolean | null;
  readyEvidencePresent: boolean | null;
}

export interface PriorityCycle extends Phase1NamedRecord {
  cycleId: string;
  cycleType: PriorityCycleType | null;
  startDate: string | null;
  endDate: string | null;
  cycleStatus: PriorityCycleStatus | null;
  workItemPageIds: string[];
  signalPageIds: string[];
  briefPageIds: string[];
  readinessGatePageIds: string[];
  botRunPageIds: string[];
  totalDueInSprint: number | null;
  completedByDueDate: number | null;
  sprintCompletionRate: number | null;
}

export interface ReadinessGate extends Phase1NamedRecord {
  gateId: string;
  gateType: ReadinessGateType | null;
  priorityCyclePageIds: string[];
  githubCiState: GitHubCiState | null;
  githubCiCheckedAt: string | null;
  confirmedStatus: GateHealthStatus | null;
  lastEvaluatedAt: string | null;
  workItemPageIds: string[];
  signalPageIds: string[];
  briefPageIds: string[];
  botRunPageIds: string[];
  blockedWorkItemCount: number | null;
  missingQaCount: number | null;
  missingTestsCount: number | null;
  demoReady: boolean | null;
  computedStatus: GateHealthStatus | null;
}

export interface Brief extends Phase1NamedRecord {
  briefId: string;
  briefType: BriefType | null;
  route: BriefRoute | null;
  routeTo: string;
  scheduledFor: string | null;
  status: BriefStatus | null;
  messageBody: string;
  dedupeKey: string;
  cooldownUntil: string | null;
  sourceSnapshot: string;
  botHistoryUrl: string | null;
  priorityCyclePageIds: string[];
  readinessGatePageIds: string[];
  relatedWorkItemPageIds: string[];
  relatedSignalPageIds: string[];
  botRunPageIds: string[];
}

export interface BotRun extends Phase1NamedRecord {
  runId: string;
  batchId: string;
  runType: string;
  ruleName: string;
  occurredAt: string | null;
  confidence: number | null;
  result: BotRunResult | null;
  sourceRowIds: string;
  targetRowIds: string;
  deliveryTarget: string;
  resultingChange: string;
  suppressionReason: string;
  errorMessage: string;
  triggerSource: BotRunTriggerSource | null;
  conversationPageIds: string[];
  customerPageIds: string[];
  signalPageIds: string[];
  workItemPageIds: string[];
  priorityCyclePageIds: string[];
  readinessGatePageIds: string[];
  briefPageIds: string[];
}

export interface PersonDirectoryEntry extends Phase1NamedRecord {
  active: boolean;
  slackId: string;
  email: string;
  team: string;
}

export interface CreateSignalInput {
  name: string;
  signalId: string;
  signalType: SignalType;
  sourceTable: string;
  sourceRowId: string;
  ruleName: string;
  confidence: number;
  reviewStatus: SignalReviewStatus;
  conversationPageIds?: string[];
  customerPageIds?: string[];
  workItemPageIds?: string[];
  priorityCyclePageIds?: string[];
  briefPageIds?: string[];
  botRunPageIds?: string[];
  dedupeKey?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface UpdateSignalInput {
  name?: string;
  signalType?: SignalType | null;
  sourceTable?: string | null;
  sourceRowId?: string | null;
  ruleName?: string;
  confidence?: number | null;
  reviewStatus?: SignalReviewStatus | null;
  conversationPageIds?: string[];
  customerPageIds?: string[];
  workItemPageIds?: string[];
  priorityCyclePageIds?: string[];
  briefPageIds?: string[];
  botRunPageIds?: string[];
  dedupeKey?: string | null;
  updatedAt?: string | null;
}

export interface UpdateWorkItemBotFieldsInput {
  lastActivitySource?: WorkItemActivitySource | null;
  latestBotNote?: string | null;
  botHistoryUrl?: string | null;
  computedHardBlocked?: boolean | null;
  priorityScore?: number | null;
  priorityRecommendation?: PriorityBand | null;
  priorityNeedsReview?: boolean | null;
  priorityMissingInputs?: string | null;
  statusNudgeEligible?: boolean | null;
  updatedAt?: string | null;
}

export interface CreateReadinessGateInput {
  name: string;
  gateId: string;
  gateType: ReadinessGateType;
  priorityCyclePageIds: string[];
  githubCiState: GitHubCiState;
  githubCiCheckedAt?: string | null;
  confirmedStatus: GateHealthStatus;
  lastEvaluatedAt?: string | null;
  workItemPageIds?: string[];
  signalPageIds?: string[];
  briefPageIds?: string[];
  botRunPageIds?: string[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface UpdateReadinessGateInput {
  name?: string;
  gateType?: ReadinessGateType | null;
  priorityCyclePageIds?: string[];
  githubCiState?: GitHubCiState | null;
  githubCiCheckedAt?: string | null;
  confirmedStatus?: GateHealthStatus | null;
  lastEvaluatedAt?: string | null;
  workItemPageIds?: string[];
  signalPageIds?: string[];
  briefPageIds?: string[];
  botRunPageIds?: string[];
  updatedAt?: string | null;
}

export interface CreateBriefInput {
  name: string;
  briefId: string;
  briefType: BriefType;
  route: BriefRoute;
  routeTo: string;
  scheduledFor: string;
  status: BriefStatus;
  messageBody: string;
  dedupeKey: string;
  cooldownUntil?: string | null;
  sourceSnapshot?: string | null;
  botHistoryUrl?: string | null;
  priorityCyclePageIds?: string[];
  readinessGatePageIds?: string[];
  relatedWorkItemPageIds?: string[];
  relatedSignalPageIds?: string[];
  botRunPageIds?: string[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface UpdateBriefInput {
  name?: string;
  briefType?: BriefType | null;
  route?: BriefRoute | null;
  routeTo?: string | null;
  scheduledFor?: string | null;
  status?: BriefStatus | null;
  messageBody?: string | null;
  dedupeKey?: string | null;
  cooldownUntil?: string | null;
  sourceSnapshot?: string | null;
  botHistoryUrl?: string | null;
  priorityCyclePageIds?: string[];
  readinessGatePageIds?: string[];
  relatedWorkItemPageIds?: string[];
  relatedSignalPageIds?: string[];
  botRunPageIds?: string[];
  updatedAt?: string | null;
}

export interface CreateBotRunInput {
  name: string;
  runId: string;
  batchId: string;
  runType: string;
  ruleName: string;
  occurredAt: string;
  confidence: number;
  result: BotRunResult;
  sourceRowIds: string;
  targetRowIds: string;
  deliveryTarget?: string | null;
  resultingChange?: string | null;
  suppressionReason?: string | null;
  errorMessage?: string | null;
  triggerSource: BotRunTriggerSource;
  conversationPageIds?: string[];
  customerPageIds?: string[];
  signalPageIds?: string[];
  workItemPageIds?: string[];
  priorityCyclePageIds?: string[];
  readinessGatePageIds?: string[];
  briefPageIds?: string[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface UpdateBotRunInput {
  name?: string;
  batchId?: string;
  runType?: string;
  ruleName?: string;
  occurredAt?: string | null;
  confidence?: number | null;
  result?: BotRunResult | null;
  sourceRowIds?: string | null;
  targetRowIds?: string | null;
  deliveryTarget?: string | null;
  resultingChange?: string | null;
  suppressionReason?: string | null;
  errorMessage?: string | null;
  triggerSource?: BotRunTriggerSource | null;
  conversationPageIds?: string[];
  customerPageIds?: string[];
  signalPageIds?: string[];
  workItemPageIds?: string[];
  priorityCyclePageIds?: string[];
  readinessGatePageIds?: string[];
  briefPageIds?: string[];
  updatedAt?: string | null;
}
