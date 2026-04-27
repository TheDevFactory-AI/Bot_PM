import type {
  BotRun,
  Brief,
  Conversation,
  CreateBotRunInput,
  CreateBriefInput,
  CreateReadinessGateInput,
  CreateSignalInput,
  Customer,
  PersonDirectoryEntry,
  PriorityCycle,
  ReadinessGate,
  Signal,
  UpdateBotRunInput,
  UpdateBriefInput,
  UpdateReadinessGateInput,
  UpdateSignalInput,
  UpdateWorkItemBotFieldsInput,
  WorkItem,
} from "../../domain/phase1/index.js";
import type {
  BotRunResult,
  BotRunTriggerSource,
  BriefRoute,
  BriefStatus,
  BriefType,
  ConversationExtractionStatus,
  ConversationSourceType,
  CustomerStage,
  GateHealthStatus,
  GitHubCiState,
  Phase1TableName,
  PriorityBand,
  PriorityCycleStatus,
  PriorityCycleType,
  ReadinessGateType,
  SignalReviewStatus,
  SignalType,
  WorkItemActivitySource,
  WorkItemBlockedState,
  WorkItemStatus,
} from "../../domain/phase1/models.js";
import type { NotionPage, NotionPagePropertyValue, NotionPageWriteProperties } from "./types.js";

type PropertyName = string | readonly string[];

export interface NotionDatabaseCodec<TRecord> {
  table: Phase1TableName;
  externalIdProperty?: string;
  decode(page: NotionPage): TRecord;
}

export interface NotionWritableDatabaseCodec<TRecord, TCreate, TUpdate>
  extends NotionDatabaseCodec<TRecord> {
  encodeCreate(input: TCreate): NotionPageWriteProperties;
  encodeUpdate(input: TUpdate): NotionPageWriteProperties;
}

export const customerCodec: NotionDatabaseCodec<Customer> = {
  table: "customers",
  externalIdProperty: "Customer ID",
  decode(page) {
    return {
      ...decodeBase(page),
      name: getRequiredTitle(page, ["Name", "Customer Name"]),
      customerId: getRequiredRichText(page, "Customer ID"),
      stage: parseEnum(getSelectLike(page, "Stage"), CUSTOMER_STAGES),
      ownerIds: getPeopleIds(page, "Owner"),
      active: getCheckbox(page, "Active"),
      conversationPageIds: getRelationIds(page, "Conversations"),
      signalPageIds: getRelationIds(page, "Signals"),
      workItemPageIds: getRelationIds(page, "Work Items"),
      briefPageIds: getRelationIds(page, "Briefs"),
      latestConversationAt: getDateLike(page, "Latest Conversation At"),
      openWorkItems: getNumberLike(page, "Open Work Items"),
      softBlockerCount: getNumberLike(page, "Soft Blocker Count"),
      needsFollowUp: getBooleanLike(page, "Needs Follow-up"),
    };
  },
};

export const conversationCodec: NotionDatabaseCodec<Conversation> = {
  table: "conversations",
  externalIdProperty: "Conversation ID",
  decode(page) {
    return {
      ...decodeBase(page),
      name: getRequiredTitle(page, ["Name", "Conversation"]),
      conversationId: getRequiredRichText(page, "Conversation ID"),
      customerId: getRequiredRichText(page, "Customer ID"),
      customerPageIds: getRelationIds(page, "Customer"),
      occurredAt: getDateLike(page, "Occurred At"),
      sourceType: parseEnum(getSelectLike(page, "Source Type"), CONVERSATION_SOURCE_TYPES),
      transcriptUrl: getUrl(page, "Transcript URL"),
      transcriptText: getRichText(page, ["Transcript / Notes", "Transcript"]),
      summary: getRichText(page, "Summary"),
      extractionConfidence: getNumberLike(page, "Extraction Confidence"),
      extractionStatus: parseEnum(
        getSelectLike(page, ["Extraction Status", "Review Status"]),
        CONVERSATION_EXTRACTION_STATUSES,
      ),
      signalPageIds: getRelationIds(page, "Signals"),
      workItemPageIds: getRelationIds(page, "Work Items"),
      needsReview: getBooleanLike(page, "Needs Review"),
      openSoftBlocker: getBooleanLike(page, "Open Soft Blocker"),
      signalCount: getNumberLike(page, "Signal Count"),
    };
  },
};

export const signalCodec: NotionWritableDatabaseCodec<Signal, CreateSignalInput, UpdateSignalInput> = {
  table: "signals",
  externalIdProperty: "Signal ID",
  decode(page) {
    return {
      ...decodeBase(page),
      name: getRequiredTitle(page, ["Name", "Signal"]),
      signalId: getRequiredRichText(page, "Signal ID"),
      signalType: parseEnum(getSelectLike(page, "Signal Type"), SIGNAL_TYPES),
      sourceTable: getSelectLike(page, "Source Table") ?? getRichText(page, "Source Table"),
      sourceRowId: getRichText(page, "Source Row ID") || null,
      ruleName: getRichText(page, "Rule Name"),
      confidence: getNumberLike(page, "Confidence"),
      reviewStatus: parseEnum(getSelectLike(page, "Review Status"), SIGNAL_REVIEW_STATUSES),
      conversationPageIds: getRelationIds(page, "Conversation"),
      customerPageIds: getRelationIds(page, "Customer"),
      workItemPageIds: getRelationIds(page, "Work Item"),
      priorityCyclePageIds: getRelationIds(page, "Priority Cycle"),
      briefPageIds: getRelationIds(page, "Briefs"),
      botRunPageIds: getRelationIds(page, "Bot Runs"),
      needsReview: getBooleanLike(page, "Needs Review"),
      isSoftBlocker: getBooleanLike(page, "Is Soft Blocker"),
      isOpen: getBooleanLike(page, "Is Open"),
      dedupeKey: getRichText(page, "Dedupe Key") || null,
    };
  },
  encodeCreate(input) {
    return {
      Signal: titleProperty(input.name),
      "Signal ID": richTextProperty(input.signalId),
      "Signal Type": selectProperty(input.signalType),
      "Source Table": selectProperty(input.sourceTable),
      "Source Row ID": richTextProperty(input.sourceRowId),
      "Rule Name": richTextProperty(input.ruleName),
      Confidence: numberProperty(input.confidence),
      "Review Status": selectProperty(input.reviewStatus),
      Conversation: relationProperty(input.conversationPageIds ?? []),
      Customer: relationProperty(input.customerPageIds ?? []),
      "Work Item": relationProperty(input.workItemPageIds ?? []),
      "Priority Cycle": relationProperty(input.priorityCyclePageIds ?? []),
      Briefs: relationProperty(input.briefPageIds ?? []),
      "Bot Runs": relationProperty(input.botRunPageIds ?? []),
      "Dedupe Key": richTextProperty(input.dedupeKey ?? ""),
      ...timestampProperties(input.createdAt, input.updatedAt),
    };
  },
  encodeUpdate(input) {
    return {
      ...optionalTitle("Signal", input, "name"),
      ...optionalSelect("Signal Type", input, "signalType"),
      ...optionalSelect("Source Table", input, "sourceTable"),
      ...optionalRichText("Source Row ID", input, "sourceRowId"),
      ...optionalRichText("Rule Name", input, "ruleName"),
      ...optionalNumber("Confidence", input, "confidence"),
      ...optionalSelect("Review Status", input, "reviewStatus"),
      ...optionalRelations("Conversation", input, "conversationPageIds"),
      ...optionalRelations("Customer", input, "customerPageIds"),
      ...optionalRelations("Work Item", input, "workItemPageIds"),
      ...optionalRelations("Priority Cycle", input, "priorityCyclePageIds"),
      ...optionalRelations("Briefs", input, "briefPageIds"),
      ...optionalRelations("Bot Runs", input, "botRunPageIds"),
      ...optionalRichText("Dedupe Key", input, "dedupeKey"),
      ...optionalUpdatedAt(input),
    };
  },
};

export const workItemCodec: NotionWritableDatabaseCodec<
  WorkItem,
  never,
  UpdateWorkItemBotFieldsInput
> = {
  table: "workItems",
  externalIdProperty: "Work Item ID",
  decode(page) {
    return {
      ...decodeBase(page),
      name: getRequiredTitle(page, ["Name", "Bug Title"]),
      workItemId: getRichText(page, "Work Item ID") || page.id,
      status: normalizeWorkItemStatus(getSelectLike(page, "Status")),
      ownerIds: getRelationIds(page, "Owner"),
      dueDate: getDateLike(page, "Due Date"),
      completedAt: getDateLike(page, "Completed At"),
      priorityCyclePageIds: getRelationIds(page, "Priority Cycle"),
      customerImpact: getNumberLike(page, "Customer Impact"),
      revenueImpact: getNumberLike(page, "Revenue Impact"),
      demoImpact: getNumberLike(page, "Demo Impact"),
      criticality: getNumberLike(page, "Criticality"),
      effort: getNumberLike(page, "Effort"),
      blockedState: parseEnum(getSelectLike(page, "Blocked State"), WORK_ITEM_BLOCKED_STATES),
      dependsOnPageIds: getRelationIds(page, "Depends On"),
      qaPresent: getCheckbox(page, "QA Present"),
      testsPresent: getCheckbox(page, "Tests Present"),
      confirmedPriority: normalizePriorityBand(
        getSelectLike(page, ["Confirmed Priority", "priority", "Priority"]),
      ),
      demoScope: getCheckbox(page, "Demo Scope"),
      lastActivitySource: parseEnum(
        getSelectLike(page, "Last Activity Source"),
        WORK_ITEM_ACTIVITY_SOURCES,
      ),
      latestBotNote: getRichText(page, "Latest Bot Note"),
      botHistoryUrl: getUrl(page, "Bot History URL"),
      computedHardBlocked: getBooleanLike(page, "Computed Hard Blocked"),
      priorityScore: getNumberLike(page, "Priority Score"),
      priorityRecommendation: normalizePriorityBand(getSelectLike(page, "Priority Recommendation")),
      priorityNeedsReview: getBooleanLike(page, "Priority Needs Review"),
      priorityMissingInputs: getRichText(page, "Priority Missing Inputs"),
      statusNudgeEligible: getBooleanLike(page, "Status Nudge Eligible"),
      customerPageIds: getRelationIds(page, "Customers"),
      conversationPageIds: getRelationIds(page, "Conversations"),
      signalPageIds: getRelationIds(page, "Signals"),
      briefPageIds: getRelationIds(page, "Briefs"),
      completedOnTime: getBooleanLike(page, "Completed On Time"),
      readyEvidencePresent: getBooleanLike(page, "Ready Evidence Present"),
    };
  },
  encodeCreate() {
    throw new Error("Work items are human-owned and may not be created by the bot in Phase 1.");
  },
  encodeUpdate(input) {
    return {
      ...optionalSelect("Last Activity Source", input, "lastActivitySource"),
      ...optionalRichText("Latest Bot Note", input, "latestBotNote"),
      ...optionalUrl("Bot History URL", input, "botHistoryUrl"),
      ...optionalCheckbox("Computed Hard Blocked", input, "computedHardBlocked"),
      ...optionalNumber("Priority Score", input, "priorityScore"),
      ...optionalSelect("Priority Recommendation", input, "priorityRecommendation"),
      ...optionalCheckbox("Priority Needs Review", input, "priorityNeedsReview"),
      ...optionalRichText("Priority Missing Inputs", input, "priorityMissingInputs"),
      ...optionalCheckbox("Status Nudge Eligible", input, "statusNudgeEligible"),
      ...optionalUpdatedAt(input),
    };
  },
};

export const priorityCycleCodec: NotionDatabaseCodec<PriorityCycle> = {
  table: "priorityCycles",
  externalIdProperty: "Cycle ID",
  decode(page) {
    return {
      ...decodeBase(page),
      name: getRequiredTitle(page, ["Name", "Cycle"]),
      cycleId: getRequiredRichText(page, "Cycle ID"),
      cycleType: parseEnum(getSelectLike(page, "Cycle Type"), PRIORITY_CYCLE_TYPES),
      startDate: getDateLike(page, "Start Date"),
      endDate: getDateLike(page, "End Date"),
      cycleStatus: parseEnum(getSelectLike(page, "Cycle Status"), PRIORITY_CYCLE_STATUSES),
      workItemPageIds: getRelationIds(page, "Work Items"),
      signalPageIds: getRelationIds(page, "Signals"),
      briefPageIds: getRelationIds(page, "Briefs"),
      readinessGatePageIds: getRelationIds(page, "Readiness Gates"),
      botRunPageIds: getRelationIds(page, "Bot Runs"),
      totalDueInSprint: getNumberLike(page, "Total Due In Sprint"),
      completedByDueDate: getNumberLike(page, "Completed By Due Date"),
      sprintCompletionRate: getNumberLike(page, "Sprint Completion Rate"),
    };
  },
};

export const readinessGateCodec: NotionWritableDatabaseCodec<
  ReadinessGate,
  CreateReadinessGateInput,
  UpdateReadinessGateInput
> = {
  table: "readinessGates",
  externalIdProperty: "Gate ID",
  decode(page) {
    return {
      ...decodeBase(page),
      name: getRequiredTitle(page, ["Name", "Gate"]),
      gateId: getRequiredRichText(page, "Gate ID"),
      gateType: parseEnum(getSelectLike(page, "Gate Type"), READINESS_GATE_TYPES),
      priorityCyclePageIds: getRelationIds(page, "Priority Cycle"),
      githubCiState: parseEnum(getSelectLike(page, "GitHub CI State"), GITHUB_CI_STATES),
      githubCiCheckedAt: getDateLike(page, "GitHub CI Checked At"),
      confirmedStatus: parseEnum(getSelectLike(page, "Confirmed Status"), GATE_HEALTH_STATUSES),
      lastEvaluatedAt: getDateLike(page, "Last Evaluated At"),
      workItemPageIds: getRelationIds(page, "Work Items"),
      signalPageIds: getRelationIds(page, "Signals"),
      briefPageIds: getRelationIds(page, "Briefs"),
      botRunPageIds: getRelationIds(page, "Bot Runs"),
      blockedWorkItemCount: getNumberLike(page, "Blocked Work Item Count"),
      missingQaCount: getNumberLike(page, "Missing QA Count"),
      missingTestsCount: getNumberLike(page, "Missing Tests Count"),
      demoReady: getBooleanLike(page, "Demo Ready"),
      computedStatus: parseEnum(
        getSelectLike(page, "Computed Status") ?? (getRichText(page, "Computed Status") || null),
        GATE_HEALTH_STATUSES,
      ),
    };
  },
  encodeCreate(input) {
    return {
      Gate: titleProperty(input.name),
      "Gate ID": richTextProperty(input.gateId),
      "Gate Type": selectProperty(input.gateType),
      "Priority Cycle": relationProperty(input.priorityCyclePageIds),
      "GitHub CI State": selectProperty(input.githubCiState),
      "GitHub CI Checked At": dateProperty(input.githubCiCheckedAt ?? null),
      "Confirmed Status": selectProperty(input.confirmedStatus),
      "Last Evaluated At": dateProperty(input.lastEvaluatedAt ?? null),
      "Work Items": relationProperty(input.workItemPageIds ?? []),
      Signals: relationProperty(input.signalPageIds ?? []),
      Briefs: relationProperty(input.briefPageIds ?? []),
      "Bot Runs": relationProperty(input.botRunPageIds ?? []),
      ...timestampProperties(input.createdAt, input.updatedAt),
    };
  },
  encodeUpdate(input) {
    return {
      ...optionalTitle("Gate", input, "name"),
      ...optionalSelect("Gate Type", input, "gateType"),
      ...optionalRelations("Priority Cycle", input, "priorityCyclePageIds"),
      ...optionalSelect("GitHub CI State", input, "githubCiState"),
      ...optionalDate("GitHub CI Checked At", input, "githubCiCheckedAt"),
      ...optionalSelect("Confirmed Status", input, "confirmedStatus"),
      ...optionalDate("Last Evaluated At", input, "lastEvaluatedAt"),
      ...optionalRelations("Work Items", input, "workItemPageIds"),
      ...optionalRelations("Signals", input, "signalPageIds"),
      ...optionalRelations("Briefs", input, "briefPageIds"),
      ...optionalRelations("Bot Runs", input, "botRunPageIds"),
      ...optionalUpdatedAt(input),
    };
  },
};

export const briefCodec: NotionWritableDatabaseCodec<Brief, CreateBriefInput, UpdateBriefInput> = {
  table: "briefs",
  externalIdProperty: "Brief ID",
  decode(page) {
    return {
      ...decodeBase(page),
      name: getRequiredTitle(page, ["Name", "Brief"]),
      briefId: getRequiredRichText(page, "Brief ID"),
      briefType: parseEnum(getSelectLike(page, "Brief Type"), BRIEF_TYPES),
      route: parseEnum(getSelectLike(page, "Route"), BRIEF_ROUTES),
      routeTo: getRichText(page, "Route To"),
      scheduledFor: getDateLike(page, "Scheduled For"),
      status: parseEnum(getSelectLike(page, "Status"), BRIEF_STATUSES),
      messageBody: getRichText(page, "Message Body"),
      dedupeKey: getRichText(page, "Dedupe Key"),
      cooldownUntil: getDateLike(page, "Cooldown Until"),
      sourceSnapshot: getRichText(page, "Source Snapshot"),
      botHistoryUrl: getUrl(page, "Bot History URL"),
      priorityCyclePageIds: getRelationIds(page, "Priority Cycle"),
      readinessGatePageIds: getRelationIds(page, "Readiness Gate"),
      relatedWorkItemPageIds: getRelationIds(page, "Related Work Items"),
      relatedSignalPageIds: getRelationIds(page, "Related Signals"),
      botRunPageIds: getRelationIds(page, "Bot Runs"),
    };
  },
  encodeCreate(input) {
    return {
      Brief: titleProperty(input.name),
      "Brief ID": richTextProperty(input.briefId),
      "Brief Type": selectProperty(input.briefType),
      Route: selectProperty(input.route),
      "Route To": richTextProperty(input.routeTo),
      "Scheduled For": dateProperty(input.scheduledFor),
      Status: selectProperty(input.status),
      "Message Body": richTextProperty(input.messageBody),
      "Dedupe Key": richTextProperty(input.dedupeKey),
      "Cooldown Until": dateProperty(input.cooldownUntil ?? null),
      "Source Snapshot": richTextProperty(input.sourceSnapshot ?? ""),
      "Bot History URL": urlProperty(input.botHistoryUrl ?? null),
      "Priority Cycle": relationProperty(input.priorityCyclePageIds ?? []),
      "Readiness Gate": relationProperty(input.readinessGatePageIds ?? []),
      "Related Work Items": relationProperty(input.relatedWorkItemPageIds ?? []),
      "Related Signals": relationProperty(input.relatedSignalPageIds ?? []),
      "Bot Runs": relationProperty(input.botRunPageIds ?? []),
      ...timestampProperties(input.createdAt, input.updatedAt),
    };
  },
  encodeUpdate(input) {
    return {
      ...optionalTitle("Brief", input, "name"),
      ...optionalSelect("Brief Type", input, "briefType"),
      ...optionalSelect("Route", input, "route"),
      ...optionalRichText("Route To", input, "routeTo"),
      ...optionalDate("Scheduled For", input, "scheduledFor"),
      ...optionalSelect("Status", input, "status"),
      ...optionalRichText("Message Body", input, "messageBody"),
      ...optionalRichText("Dedupe Key", input, "dedupeKey"),
      ...optionalDate("Cooldown Until", input, "cooldownUntil"),
      ...optionalRichText("Source Snapshot", input, "sourceSnapshot"),
      ...optionalUrl("Bot History URL", input, "botHistoryUrl"),
      ...optionalRelations("Priority Cycle", input, "priorityCyclePageIds"),
      ...optionalRelations("Readiness Gate", input, "readinessGatePageIds"),
      ...optionalRelations("Related Work Items", input, "relatedWorkItemPageIds"),
      ...optionalRelations("Related Signals", input, "relatedSignalPageIds"),
      ...optionalRelations("Bot Runs", input, "botRunPageIds"),
      ...optionalUpdatedAt(input),
    };
  },
};

export const botRunCodec: NotionWritableDatabaseCodec<BotRun, CreateBotRunInput, UpdateBotRunInput> = {
  table: "botRuns",
  externalIdProperty: "Run ID",
  decode(page) {
    return {
      ...decodeBase(page),
      name: getRequiredTitle(page, ["Name", "Run"]),
      runId: getRequiredRichText(page, "Run ID"),
      batchId: getRichText(page, "Batch ID"),
      runType: getSelectLike(page, "Run Type") ?? "",
      ruleName: getRichText(page, "Rule Name"),
      occurredAt: getDateLike(page, "Occurred At"),
      confidence: getNumberLike(page, "Confidence"),
      result: parseEnum(getSelectLike(page, "Result"), BOT_RUN_RESULTS),
      sourceRowIds: getRichText(page, "Source Row IDs"),
      targetRowIds: getRichText(page, "Target Row IDs"),
      deliveryTarget: getRichText(page, "Delivery Target"),
      resultingChange: getRichText(page, "Resulting Change"),
      suppressionReason: getRichText(page, "Suppression Reason"),
      errorMessage: getRichText(page, "Error Message"),
      triggerSource: parseEnum(getSelectLike(page, "Trigger Source"), BOT_RUN_TRIGGER_SOURCES),
      conversationPageIds: getRelationIds(page, "Conversation"),
      customerPageIds: getRelationIds(page, "Customer"),
      signalPageIds: getRelationIds(page, "Signal"),
      workItemPageIds: getRelationIds(page, "Work Item"),
      priorityCyclePageIds: getRelationIds(page, "Priority Cycle"),
      readinessGatePageIds: getRelationIds(page, "Readiness Gate"),
      briefPageIds: getRelationIds(page, "Brief"),
    };
  },
  encodeCreate(input) {
    return {
      Run: titleProperty(input.name),
      "Run ID": richTextProperty(input.runId),
      "Batch ID": richTextProperty(input.batchId),
      "Run Type": selectProperty(input.runType),
      "Rule Name": richTextProperty(input.ruleName),
      "Occurred At": dateProperty(input.occurredAt),
      Confidence: numberProperty(input.confidence),
      Result: selectProperty(input.result),
      "Source Row IDs": richTextProperty(input.sourceRowIds),
      "Target Row IDs": richTextProperty(input.targetRowIds),
      "Delivery Target": richTextProperty(input.deliveryTarget ?? ""),
      "Resulting Change": richTextProperty(input.resultingChange ?? ""),
      "Suppression Reason": richTextProperty(input.suppressionReason ?? ""),
      "Error Message": richTextProperty(input.errorMessage ?? ""),
      "Trigger Source": selectProperty(input.triggerSource),
      Conversation: relationProperty(input.conversationPageIds ?? []),
      Customer: relationProperty(input.customerPageIds ?? []),
      Signal: relationProperty(input.signalPageIds ?? []),
      "Work Item": relationProperty(input.workItemPageIds ?? []),
      "Priority Cycle": relationProperty(input.priorityCyclePageIds ?? []),
      "Readiness Gate": relationProperty(input.readinessGatePageIds ?? []),
      Brief: relationProperty(input.briefPageIds ?? []),
      ...timestampProperties(input.createdAt, input.updatedAt),
    };
  },
  encodeUpdate(input) {
    return {
      ...optionalTitle("Run", input, "name"),
      ...optionalRichText("Batch ID", input, "batchId"),
      ...optionalSelect("Run Type", input, "runType"),
      ...optionalRichText("Rule Name", input, "ruleName"),
      ...optionalDate("Occurred At", input, "occurredAt"),
      ...optionalNumber("Confidence", input, "confidence"),
      ...optionalSelect("Result", input, "result"),
      ...optionalRichText("Source Row IDs", input, "sourceRowIds"),
      ...optionalRichText("Target Row IDs", input, "targetRowIds"),
      ...optionalRichText("Delivery Target", input, "deliveryTarget"),
      ...optionalRichText("Resulting Change", input, "resultingChange"),
      ...optionalRichText("Suppression Reason", input, "suppressionReason"),
      ...optionalRichText("Error Message", input, "errorMessage"),
      ...optionalSelect("Trigger Source", input, "triggerSource"),
      ...optionalRelations("Conversation", input, "conversationPageIds"),
      ...optionalRelations("Customer", input, "customerPageIds"),
      ...optionalRelations("Signal", input, "signalPageIds"),
      ...optionalRelations("Work Item", input, "workItemPageIds"),
      ...optionalRelations("Priority Cycle", input, "priorityCyclePageIds"),
      ...optionalRelations("Readiness Gate", input, "readinessGatePageIds"),
      ...optionalRelations("Brief", input, "briefPageIds"),
      ...optionalUpdatedAt(input),
    };
  },
};

export const peopleDirectoryCodec: NotionDatabaseCodec<PersonDirectoryEntry> = {
  table: "peopleDirectory",
  decode(page) {
    return {
      ...decodeBase(page),
      name: getRequiredTitle(page, "Name"),
      active: getCheckbox(page, "Active"),
      slackId: getRichText(page, "Slack ID"),
      email: getEmail(page, "Email") ?? "",
      team: getSelectLike(page, ["Team", "Department"]) ?? getRichText(page, ["Team", "Department"]),
    };
  },
};

export const phase1NotionCodecs = {
  customers: customerCodec,
  conversations: conversationCodec,
  signals: signalCodec,
  workItems: workItemCodec,
  priorityCycles: priorityCycleCodec,
  readinessGates: readinessGateCodec,
  briefs: briefCodec,
  botRuns: botRunCodec,
  peopleDirectory: peopleDirectoryCodec,
} as const;

function decodeBase(page: NotionPage) {
  return {
    pageId: page.id,
    notionUrl: page.url,
    createdAt: getDateLike(page, "Created At") ?? page.created_time,
    updatedAt: getDateLike(page, "Updated At") ?? page.last_edited_time,
    archived: page.archived,
  };
}

function getProperty(page: NotionPage, name: PropertyName): NotionPagePropertyValue | null {
  for (const candidate of propertyNames(name)) {
    const property = page.properties[candidate];
    if (property) {
      return property;
    }
  }
  return null;
}

function getRequiredTitle(page: NotionPage, name: PropertyName): string {
  const property = getProperty(page, name);
  if (!property || property.type !== "title") {
    throw new Error(`Expected title property "${formatPropertyName(name)}" on page ${page.id}`);
  }
  return joinRichText(property.title);
}

function getRequiredRichText(page: NotionPage, name: PropertyName): string {
  const text = getRichText(page, name);
  if (!text) {
    throw new Error(`Expected rich text property "${formatPropertyName(name)}" on page ${page.id}`);
  }
  return text;
}

function getRichText(page: NotionPage, name: PropertyName): string {
  const property = getProperty(page, name);
  if (!property) {
    return "";
  }
  if (property.type === "rich_text") {
    return joinRichText(property.rich_text);
  }
  if (property.type === "title") {
    return joinRichText(property.title);
  }
  if (property.type === "formula" && property.formula.type === "string") {
    return property.formula.string ?? "";
  }
  return "";
}

function getSelectLike(page: NotionPage, name: PropertyName): string | null {
  const property = getProperty(page, name);
  if (!property) {
    return null;
  }
  if (property.type === "select") {
    return property.select?.name ?? null;
  }
  if (property.type === "status") {
    return property.status?.name ?? null;
  }
  return null;
}

function getCheckbox(page: NotionPage, name: PropertyName): boolean {
  const property = getProperty(page, name);
  if (!property) {
    return false;
  }
  if (property.type !== "checkbox") {
    return false;
  }
  return property.checkbox;
}

function getBooleanLike(page: NotionPage, name: PropertyName): boolean | null {
  const property = getProperty(page, name);
  if (!property) {
    return null;
  }
  if (property.type === "checkbox") {
    return property.checkbox;
  }
  if (property.type === "formula" && property.formula.type === "boolean") {
    return property.formula.boolean;
  }
  return null;
}

function getNumberLike(page: NotionPage, name: PropertyName): number | null {
  const property = getProperty(page, name);
  if (!property) {
    return null;
  }
  if (property.type === "number") {
    return property.number;
  }
  if (property.type === "formula" && property.formula.type === "number") {
    return property.formula.number;
  }
  return null;
}

function getDateLike(page: NotionPage, name: PropertyName): string | null {
  const property = getProperty(page, name);
  if (!property) {
    return null;
  }
  if (property.type === "date") {
    return property.date?.start ?? null;
  }
  if (property.type === "formula" && property.formula.type === "date") {
    return property.formula.date?.start ?? null;
  }
  if (property.type === "created_time") {
    return property.created_time;
  }
  if (property.type === "last_edited_time") {
    return property.last_edited_time;
  }
  return null;
}

function getUrl(page: NotionPage, name: PropertyName): string | null {
  const property = getProperty(page, name);
  if (!property || property.type !== "url") {
    return null;
  }
  return property.url;
}

function getEmail(page: NotionPage, name: PropertyName): string | null {
  const property = getProperty(page, name);
  if (!property || property.type !== "email") {
    return null;
  }
  return property.email;
}

function getPeopleIds(page: NotionPage, name: PropertyName): string[] {
  const property = getProperty(page, name);
  if (!property || property.type !== "people") {
    return [];
  }
  return property.people.map((person) => person.id);
}

function getRelationIds(page: NotionPage, name: PropertyName): string[] {
  const property = getProperty(page, name);
  if (!property || property.type !== "relation") {
    return [];
  }
  return property.relation.map((item) => item.id);
}

function joinRichText(items: Array<{ plain_text: string }>): string {
  return items.map((item) => item.plain_text).join("");
}

function titleProperty(content: string): NotionPageWriteProperties[string] {
  return {
    title: content ? [textObject(content)] : [],
  };
}

function richTextProperty(content: string): NotionPageWriteProperties[string] {
  return {
    rich_text: content ? [textObject(content)] : [],
  };
}

function numberProperty(value: number | null): NotionPageWriteProperties[string] {
  return {
    number: value,
  };
}

function checkboxProperty(value: boolean): NotionPageWriteProperties[string] {
  return {
    checkbox: value,
  };
}

function selectProperty(value: string | null): NotionPageWriteProperties[string] {
  return {
    select: value ? { name: value } : null,
  };
}

function statusProperty(value: string | null): NotionPageWriteProperties[string] {
  return {
    status: value ? { name: value } : null,
  };
}

function dateProperty(value: string | null): NotionPageWriteProperties[string] {
  return {
    date: value
      ? {
          start: value,
          end: null,
          time_zone: null,
        }
      : null,
  };
}

function relationProperty(ids: string[]): NotionPageWriteProperties[string] {
  return {
    relation: ids.map((id) => ({ id })),
  };
}

function urlProperty(value: string | null): NotionPageWriteProperties[string] {
  return {
    url: value,
  };
}

function timestampProperties(
  createdAt?: string | null,
  updatedAt?: string | null,
): NotionPageWriteProperties {
  const properties: NotionPageWriteProperties = {};
  if (createdAt !== undefined) {
    properties["Created At"] = dateProperty(createdAt ?? null);
  }
  if (updatedAt !== undefined) {
    properties["Updated At"] = dateProperty(updatedAt ?? null);
  }
  return properties;
}

function optionalUpdatedAt<T extends { updatedAt?: string | null }>(
  input: T,
): NotionPageWriteProperties {
  return "updatedAt" in input ? { "Updated At": dateProperty(input.updatedAt ?? null) } : {};
}

function optionalTitle<T extends object, K extends keyof T>(
  propertyName: string,
  input: T,
  key: K,
): NotionPageWriteProperties {
  return hasOwn(input, key) ? { [propertyName]: titleProperty(String(input[key] ?? "")) } : {};
}

function optionalRichText<T extends object, K extends keyof T>(
  propertyName: string,
  input: T,
  key: K,
): NotionPageWriteProperties {
  return hasOwn(input, key) ? { [propertyName]: richTextProperty(String(input[key] ?? "")) } : {};
}

function optionalNumber<T extends object, K extends keyof T>(
  propertyName: string,
  input: T,
  key: K,
): NotionPageWriteProperties {
  return hasOwn(input, key) ? { [propertyName]: numberProperty((input[key] as number | null) ?? null) } : {};
}

function optionalCheckbox<T extends object, K extends keyof T>(
  propertyName: string,
  input: T,
  key: K,
): NotionPageWriteProperties {
  return hasOwn(input, key)
    ? { [propertyName]: checkboxProperty(Boolean(input[key] as boolean | null | undefined)) }
    : {};
}

function optionalSelect<T extends object, K extends keyof T>(
  propertyName: string,
  input: T,
  key: K,
): NotionPageWriteProperties {
  return hasOwn(input, key)
    ? { [propertyName]: selectProperty((input[key] as string | null) ?? null) }
    : {};
}

function optionalStatus<T extends object, K extends keyof T>(
  propertyName: string,
  input: T,
  key: K,
): NotionPageWriteProperties {
  return hasOwn(input, key)
    ? { [propertyName]: statusProperty((input[key] as string | null) ?? null) }
    : {};
}

function optionalDate<T extends object, K extends keyof T>(
  propertyName: string,
  input: T,
  key: K,
): NotionPageWriteProperties {
  return hasOwn(input, key)
    ? { [propertyName]: dateProperty((input[key] as string | null) ?? null) }
    : {};
}

function optionalUrl<T extends object, K extends keyof T>(
  propertyName: string,
  input: T,
  key: K,
): NotionPageWriteProperties {
  return hasOwn(input, key)
    ? { [propertyName]: urlProperty((input[key] as string | null) ?? null) }
    : {};
}

function optionalRelations<T extends object, K extends keyof T>(
  propertyName: string,
  input: T,
  key: K,
): NotionPageWriteProperties {
  return hasOwn(input, key)
    ? { [propertyName]: relationProperty((input[key] as string[] | undefined) ?? []) }
    : {};
}

function hasOwn<T extends object, K extends keyof T>(object: T, key: K): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function propertyNames(name: PropertyName): readonly string[] {
  return typeof name === "string" ? [name] : name;
}

function formatPropertyName(name: PropertyName): string {
  return propertyNames(name).join('" or "');
}

function normalizeWorkItemStatus(value: string | null): WorkItemStatus | null {
  if (value === null) {
    return null;
  }

  const normalized = LIVE_WORK_ITEM_STATUS_MAP[normalizeOptionName(value)] ?? value;
  return parseEnum(normalized, WORK_ITEM_STATUSES);
}

function normalizePriorityBand(value: string | null): PriorityBand | null {
  if (value === null) {
    return null;
  }

  const normalized = LIVE_PRIORITY_BAND_MAP[normalizeOptionName(value)] ?? value;
  return parseEnum(normalized, PRIORITY_BANDS);
}

function normalizeOptionName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function textObject(content: string): Record<string, unknown> {
  return {
    type: "text",
    text: {
      content,
    },
  };
}

function parseEnum<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  if (value === null) {
    return null;
  }

  return (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

const CUSTOMER_STAGES = ["Lead", "Active", "Pilot", "Paused", "Churned"] as const satisfies readonly CustomerStage[];
const CONVERSATION_SOURCE_TYPES = [
  "Demo",
  "Discovery",
  "Support",
  "Voice Memo",
  "Other",
] as const satisfies readonly ConversationSourceType[];
const CONVERSATION_EXTRACTION_STATUSES = [
  "New",
  "Parsed",
  "Review",
  "Accepted",
] as const satisfies readonly ConversationExtractionStatus[];
const SIGNAL_TYPES = [
  "pain_point",
  "objection",
  "feature_request",
  "next_step",
  "soft_blocker",
  "readiness_risk",
  "status_nudge_candidate",
] as const satisfies readonly SignalType[];
const SIGNAL_REVIEW_STATUSES = [
  "New",
  "Review",
  "Accepted",
  "Dismissed",
  "Resolved",
] as const satisfies readonly SignalReviewStatus[];
const WORK_ITEM_STATUSES = [
  "Backlog",
  "Ready",
  "In Progress",
  "Blocked",
  "In Review",
  "Done",
  "Canceled",
] as const satisfies readonly WorkItemStatus[];
const LIVE_WORK_ITEM_STATUS_MAP: Readonly<Record<string, WorkItemStatus>> = {
  new: "Backlog",
  "to-do": "Backlog",
  "in progress": "In Progress",
  testing: "In Review",
  lingeringbugs: "In Progress",
  resolved: "Done",
  released: "Done",
  complete: "Done",
  "won't fix": "Canceled",
  "wont fix": "Canceled",
};
const WORK_ITEM_BLOCKED_STATES = [
  "Not Blocked",
  "Blocked - Dependency",
  "Blocked - External",
] as const satisfies readonly WorkItemBlockedState[];
const PRIORITY_BANDS = ["P0", "P1", "P2", "P3"] as const satisfies readonly PriorityBand[];
const LIVE_PRIORITY_BAND_MAP: Readonly<Record<string, PriorityBand>> = {
  high: "P1",
  medium: "P2",
  low: "P3",
};
const WORK_ITEM_ACTIVITY_SOURCES = ["Human", "Bot"] as const satisfies readonly WorkItemActivitySource[];
const PRIORITY_CYCLE_TYPES = ["Sprint", "Week"] as const satisfies readonly PriorityCycleType[];
const PRIORITY_CYCLE_STATUSES = [
  "Planned",
  "Active",
  "Closed",
] as const satisfies readonly PriorityCycleStatus[];
const READINESS_GATE_TYPES = ["Demo Readiness"] as const satisfies readonly ReadinessGateType[];
const GITHUB_CI_STATES = ["Passing", "Failing", "Unknown"] as const satisfies readonly GitHubCiState[];
const GATE_HEALTH_STATUSES = [
  "Healthy",
  "At Risk",
  "Blocked",
] as const satisfies readonly GateHealthStatus[];
const BRIEF_TYPES = [
  "Daily Brief",
  "Sprint Completion Reminder",
  "Status Update Nudge",
] as const satisfies readonly BriefType[];
const BRIEF_ROUTES = ["Notion", "DM", "Notion+DM", "Slack+Email"] as const satisfies readonly BriefRoute[];
const BRIEF_STATUSES = [
  "Draft",
  "Queued",
  "Sent",
  "Suppressed",
  "Failed",
  "Acknowledged",
] as const satisfies readonly BriefStatus[];
const BOT_RUN_RESULTS = [
  "Read",
  "Drafted",
  "Sent",
  "Suppressed",
  "Review",
  "No-op",
  "Failed",
] as const satisfies readonly BotRunResult[];
const BOT_RUN_TRIGGER_SOURCES = [
  "Cron",
  "Manual",
  "Webhook",
] as const satisfies readonly BotRunTriggerSource[];
