import type { BotRunTriggerSource, BriefType, GateHealthStatus, PriorityBand } from "../../domain/phase1/index.js";

export interface PriorityPatchIntent {
  pageId: string;
  score: number | null;
  recommendation: PriorityBand | null;
  needsReview: boolean;
  missingInputs: string;
}

export interface ReadinessIntent {
  gateId: string;
  name: string;
  priorityCyclePageId: string;
  githubCiState: "Passing" | "Failing" | "Unknown";
  githubCiCheckedAt: string | null;
  confirmedStatus: GateHealthStatus;
  computedStatus: GateHealthStatus;
  lastEvaluatedAt: string;
  workItemPageIds: string[];
  blockedWorkItemCount: number;
  missingQaCount: number;
  missingTestsCount: number;
  demoReady: boolean;
}

export interface StatusNudgeIntent {
  pageId: string;
  workItemId: string;
  workItemName: string;
  ownerPageIds: string[];
  ownerName?: string;
  reason: string;
  cadenceLabel: BriefType;
  status: string;
  dueDate?: string | null;
  priorityCycleName?: string;
  latestBotNote: string;
  notionUrl: string;
  reminderStage: number;
  shouldEscalate: boolean;
}

export interface DailyBriefIntent {
  briefType: "Daily Brief";
  route: "Notion+DM";
  routeTo: string;
  dedupeKey: string;
  scheduledFor: string;
  title: string;
  sprintName: string;
  sprintSnapshot: string[];
  topPriorities: string[];
  explicitBlockers: string[];
  dueSoon: string[];
  staleItems: string[];
  softBlockers: string[];
  demoReadiness: string[];
  relatedWorkItemPageIds: string[];
  relatedSignalPageIds: string[];
  sourceSnapshot: string;
}

export interface EscalationIntent {
  generatedAt: string;
  items: Array<{
    pageId: string;
    workItemName: string;
    ownerName?: string;
    status: string;
    dueDate?: string | null;
    priorityCycleName?: string;
    escalatedReason: string;
    latestBotNote?: string;
    notionUrl?: string;
  }>;
}

export interface BotRunIntent {
  name: string;
  runId: string;
  batchId: string;
  runType: string;
  ruleName: string;
  occurredAt: string;
  confidence: number;
  result: "Drafted" | "Sent" | "Suppressed" | "Review" | "No-op" | "Failed" | "Read";
  sourceRowIds: string;
  targetRowIds: string;
  deliveryTarget?: string;
  resultingChange?: string;
  suppressionReason?: string;
  errorMessage?: string;
  triggerSource: BotRunTriggerSource;
  workItemPageIds?: string[];
  signalPageIds?: string[];
  priorityCyclePageIds?: string[];
  readinessGatePageIds?: string[];
  briefPageIds?: string[];
}
