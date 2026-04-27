import { createHash, randomUUID } from "node:crypto";

import { extractConversationArtifacts } from "../ai/openai.js";
import { getPhase1NotionConfig, createPhase1NotionRepositories } from "../integrations/notion/index.js";
import { deliverSlackDailyBrief, deliverSlackEscalation, deliverSlackStatusNudge } from "../integrations/slack/index.js";
import { sendEscalationEmail } from "../integrations/email/index.js";
import { buildDailyBrief } from "../reporting/phase1/dailyBrief.js";
import { isHardBlocked } from "../rules/blockers.js";
import { buildDailyBriefDedupeKey, buildReminderDedupeKey, buildReminderReasonSignature } from "../rules/dedupe.js";
import { evaluatePriority } from "../rules/priority.js";
import { evaluateReadiness } from "../rules/readiness.js";
import { evaluateStaleWorkItems } from "../rules/staleness.js";
import type {
  BotRun,
  Brief,
  Conversation,
  CreateBotRunInput,
  CreateBriefInput,
  CreateReadinessGateInput,
  CreateSignalInput,
  PersonDirectoryEntry,
  PriorityCycle,
  ReadinessGate,
  WorkItem,
} from "../domain/phase1/index.js";
import { getRuntimeConfig } from "../config/runtime.js";
import { isBusinessDay, isWithinLocalTimeWindow } from "./time.js";
import type { TickContext } from "./types.js";

interface Phase1RuntimeSnapshot {
  cycle: PriorityCycle;
  workItems: WorkItem[];
  signals: Awaited<ReturnType<typeof loadSignals>>;
  readinessGate?: ReadinessGate;
  briefs: Brief[];
  botRuns: BotRun[];
  peopleDirectory: PersonDirectoryEntry[];
  conversations: Conversation[];
}

export interface Phase1RunResult {
  batchId: string;
  mode: TickContext["mode"];
  createdSignals: number;
  updatedWorkItems: number;
  createdBriefs: number;
  sentSlackMessages: number;
  sentEscalationEmails: number;
  readinessStatus?: string;
}

export async function runPhase1OpsMvp(context: TickContext): Promise<Phase1RunResult> {
  const repositories = createPhase1NotionRepositories(getPhase1NotionConfig());
  const snapshot = await loadRuntimeSnapshot(repositories);
  const peopleByPageId = new Map(snapshot.peopleDirectory.map((entry) => [entry.pageId, entry]));
  const workItemsByPageId = new Map(snapshot.workItems.map((item) => [item.pageId, item]));

  let createdSignals = 0;
  let updatedWorkItems = 0;
  let createdBriefs = 0;
  let sentSlackMessages = 0;
  let sentEscalationEmails = 0;

  const signalInputs = await buildConversationSignalInputs(snapshot.conversations, context);
  for (const signalInput of signalInputs) {
    const existing = await repositories.signals.getByExternalId(signalInput.signalId);
    if (!existing && context.mode !== "dry-run") {
      await repositories.signals.create(signalInput);
      createdSignals += 1;
    }
  }

  const priorityPatches = snapshot.workItems.map((item) => ({
    item,
    patch: evaluatePriority(item),
    hardBlocked: isHardBlocked(item, workItemsByPageId),
  }));

  for (const { item, patch, hardBlocked } of priorityPatches) {
    if (context.mode === "dry-run") {
      continue;
    }

    await repositories.workItems.updateBotFields(item.pageId, {
      computedHardBlocked: hardBlocked,
      priorityScore: patch.score,
      priorityRecommendation: patch.recommendation,
      priorityNeedsReview: patch.needsReview,
      priorityMissingInputs: patch.missingInputs,
    });
    updatedWorkItems += 1;
  }

  const readinessIntent = evaluateReadiness(
    snapshot.cycle,
    snapshot.workItems,
    snapshot.readinessGate,
    context.now,
  );

  if (context.mode !== "dry-run") {
    if (snapshot.readinessGate) {
      await repositories.readinessGates.update(snapshot.readinessGate.pageId, toReadinessUpdate(readinessIntent));
    } else {
      await repositories.readinessGates.create(toReadinessCreate(readinessIntent));
    }
  }

  const reminders = evaluateStaleWorkItems({
    now: context.now,
    timezone: context.config.timezone,
    cycle: snapshot.cycle,
    workItems: snapshot.workItems.map((item) => ({
      ...item,
      updatedAt: item.lastActivitySource === "Bot" ? item.createdAt : item.updatedAt,
    })),
    briefs: snapshot.briefs.filter((brief) =>
      ["Status Update Nudge", "Sprint Completion Reminder"].includes(brief.briefType ?? ""),
    ),
    botRuns: snapshot.botRuns,
  });

  const dailyBriefIntent =
    shouldSendDailyBrief(snapshot.briefs, snapshot.cycle, context) &&
    isBusinessDay(context.now, context.config.timezone) &&
    isWithinLocalTimeWindow(context.now, context.config.timezone, 8, 30, 30)
      ? buildDailyBrief({
          now: context.now,
          cycle: snapshot.cycle,
          workItems: snapshot.workItems,
          signals: snapshot.signals,
          readiness: snapshot.readinessGate ?? readinessIntent,
          priorityPatches: priorityPatches.map((entry) => entry.patch),
          statusNudges: reminders,
          routeTo: context.config.slack.briefDmUserId,
        })
      : null;

  if (dailyBriefIntent) {
    const brief = context.mode === "dry-run"
      ? null
      : await repositories.briefs.create({
          name: dailyBriefIntent.title,
          briefId: deterministicId("brief", dailyBriefIntent.dedupeKey),
          briefType: "Daily Brief",
          route: "Notion+DM",
          routeTo: dailyBriefIntent.routeTo,
          scheduledFor: dailyBriefIntent.scheduledFor,
          status: context.mode === "persist-only" ? "Queued" : "Sent",
          messageBody: dailyBriefIntent.sourceSnapshot,
          dedupeKey: dailyBriefIntent.dedupeKey,
          sourceSnapshot: dailyBriefIntent.sourceSnapshot,
          priorityCyclePageIds: [snapshot.cycle.pageId],
          readinessGatePageIds: snapshot.readinessGate ? [snapshot.readinessGate.pageId] : [],
          relatedWorkItemPageIds: dailyBriefIntent.relatedWorkItemPageIds,
          relatedSignalPageIds: dailyBriefIntent.relatedSignalPageIds,
        });

    if (brief) {
      createdBriefs += 1;
    }

    if (context.mode === "live") {
      const results = await deliverSlackDailyBrief({
        sprintName: dailyBriefIntent.sprintName,
        generatedAt: context.now,
        timezone: context.config.timezone,
        sprintSnapshot: dailyBriefIntent.sprintSnapshot,
        topPriorities: dailyBriefIntent.topPriorities,
        explicitBlockers: dailyBriefIntent.explicitBlockers,
        dueSoon: dailyBriefIntent.dueSoon,
        staleItems: dailyBriefIntent.staleItems,
        softBlockers: dailyBriefIntent.softBlockers,
        demoReadiness: dailyBriefIntent.demoReadiness,
      });
      sentSlackMessages += results.length;
    }
  }

  const escalationItems: Array<{
    pageId: string;
    workItemName: string;
    ownerName?: string;
    status: string;
    dueDate?: string | null;
    priorityCycleName?: string;
    escalatedReason: string;
    latestBotNote?: string;
    notionUrl?: string;
  }> = [];

  for (const reminder of reminders) {
    const owner = reminder.ownerPageIds.map((pageId) => peopleByPageId.get(pageId)).find(Boolean);
    const recipientSlackId = owner?.slackId ?? null;
    const dedupeKey = buildReminderDedupeKey({
      ruleName: reminder.cadenceLabel,
      targetId: reminder.pageId,
      recipientId: recipientSlackId ?? "escalation_channel",
      reasonSignature: buildReminderReasonSignature({
        reason: reminder.cadenceLabel === "Sprint Completion Reminder" ? "due_soon" : "stale",
        stage: reminder.shouldEscalate
          ? "escalation"
          : reminder.reminderStage >= 2
            ? "nudge_2"
            : "nudge_1",
        dueDate: reminder.dueDate,
      }),
    });

    if (snapshot.briefs.some((brief) => brief.dedupeKey === dedupeKey && brief.status !== "Failed")) {
      continue;
    }

    const brief = context.mode === "dry-run"
      ? null
      : await repositories.briefs.create({
          name: `${reminder.cadenceLabel} - ${reminder.workItemName}`,
          briefId: deterministicId("brief", dedupeKey),
          briefType: reminder.cadenceLabel,
          route: reminder.shouldEscalate ? "Slack+Email" : "DM",
          routeTo: recipientSlackId ?? context.config.slack.escalationChannelId,
          scheduledFor: context.now.toISOString(),
          status: context.mode === "persist-only" ? "Queued" : "Sent",
          messageBody: reminder.latestBotNote,
          dedupeKey,
          cooldownUntil: context.now.toISOString(),
          sourceSnapshot: JSON.stringify({ pageId: reminder.pageId, reason: reminder.reason }),
          priorityCyclePageIds: [snapshot.cycle.pageId],
          relatedWorkItemPageIds: [reminder.pageId],
        });

    if (brief) {
      createdBriefs += 1;
      if (context.mode !== "dry-run") {
        await repositories.workItems.updateBotFields(reminder.pageId, {
          lastActivitySource: "Bot",
          latestBotNote: reminder.latestBotNote,
          botHistoryUrl: brief.notionUrl,
          statusNudgeEligible: true,
        });
        updatedWorkItems += 1;
      }
    }

    if (reminder.shouldEscalate) {
      escalationItems.push({
        pageId: reminder.pageId,
        workItemName: reminder.workItemName,
        ownerName: owner?.name,
        status: reminder.status,
        dueDate: reminder.dueDate,
        priorityCycleName: reminder.priorityCycleName,
        escalatedReason: reminder.reason,
        latestBotNote: reminder.latestBotNote,
        notionUrl: reminder.notionUrl,
      });
    } else if (context.mode === "live" && recipientSlackId) {
      await deliverSlackStatusNudge(recipientSlackId, {
        workItemName: reminder.workItemName,
        ownerName: owner?.name,
        status: reminder.status,
        dueDate: reminder.dueDate ?? undefined,
        priorityCycleName: reminder.priorityCycleName,
        reason: reminder.reason,
        latestBotNote: reminder.latestBotNote,
        notionUrl: reminder.notionUrl,
        cadenceLabel: reminder.cadenceLabel,
      });
      sentSlackMessages += 1;
    }
  }

  if (escalationItems.length > 0) {
    if (context.mode === "live") {
      await deliverSlackEscalation({
        generatedAt: context.now,
        timezone: context.config.timezone,
        items: escalationItems.map((item) => ({
          workItemName: item.workItemName,
          ownerName: item.ownerName,
          status: item.status,
          dueDate: item.dueDate ?? undefined,
          priorityCycleName: item.priorityCycleName,
          escalatedReason: item.escalatedReason,
          latestBotNote: item.latestBotNote,
          notionUrl: item.notionUrl,
        })),
      });
      sentSlackMessages += 1;

      const recipients = snapshot.peopleDirectory
        .filter((entry) => entry.active && entry.email)
        .map((entry) => entry.email);

      if (recipients.length > 0) {
        await sendEscalationEmail(
          {
            generatedAt: context.now,
            timezone: context.config.timezone,
            items: escalationItems.map((item) => ({
              workItemName: item.workItemName,
              ownerName: item.ownerName,
              status: item.status,
              dueDate: item.dueDate ?? undefined,
              priorityCycleName: item.priorityCycleName,
              escalatedReason: item.escalatedReason,
              latestBotNote: item.latestBotNote,
              notionUrl: item.notionUrl,
            })),
          },
          { to: recipients },
        );
        sentEscalationEmails += 1;
      }
    }
  }

  if (context.mode !== "dry-run") {
    const botRuns: CreateBotRunInput[] = [
      {
        name: `batch:${context.batchId}`,
        runId: randomUUID(),
        batchId: context.batchId,
        runType: "phase_1_tick",
        ruleName: "batch_started",
        occurredAt: context.now.toISOString(),
        confidence: 1,
        result: "Read",
        sourceRowIds: snapshot.cycle.pageId,
        targetRowIds: snapshot.cycle.pageId,
        triggerSource: context.source === "vercel-cron" ? "Cron" : "Manual",
        resultingChange: JSON.stringify({
          createdSignals,
          updatedWorkItems,
          createdBriefs,
          sentSlackMessages,
          sentEscalationEmails,
        }),
      },
    ];

    for (const botRun of botRuns) {
      await repositories.botRuns.create(botRun);
    }
  }

  return {
    batchId: context.batchId,
    mode: context.mode,
    createdSignals,
    updatedWorkItems,
    createdBriefs,
    sentSlackMessages,
    sentEscalationEmails,
    readinessStatus: readinessIntent.computedStatus,
  };
}

async function loadRuntimeSnapshot(
  repositories: ReturnType<typeof createPhase1NotionRepositories>,
): Promise<Phase1RuntimeSnapshot> {
  const cycles = (await repositories.priorityCycles.list({ activeOnly: true, pageSize: 10 })).items;
  if (cycles.length !== 1) {
    throw new Error(`Expected exactly one active Priority Cycle, found ${cycles.length}.`);
  }

  const cycle = cycles[0];
  const [workItems, signals, readinessGates, briefs, botRuns, peopleDirectory, conversations] =
    await Promise.all([
      repositories.workItems.list({ priorityCyclePageId: cycle.pageId, pageSize: 200 }),
      loadSignals(repositories, cycle.pageId),
      repositories.readinessGates.list({ priorityCyclePageId: cycle.pageId, pageSize: 20 }),
      repositories.briefs.list({ priorityCyclePageId: cycle.pageId, pageSize: 200 }),
      repositories.botRuns.list({ pageSize: 200 }),
      repositories.peopleDirectory.list({ activeOnly: true, pageSize: 200 }),
      repositories.conversations.list({ pageSize: 100 }),
    ]);

  return {
    cycle,
    workItems: workItems.items,
    signals,
    readinessGate: readinessGates.items[0],
    briefs: briefs.items,
    botRuns: botRuns.items,
    peopleDirectory: peopleDirectory.items,
    conversations: conversations.items,
  };
}

async function loadSignals(
  repositories: ReturnType<typeof createPhase1NotionRepositories>,
  cyclePageId: string,
) {
  const signals = await repositories.signals.list({
    priorityCyclePageId: cyclePageId,
    pageSize: 200,
  });

  return signals.items;
}

async function buildConversationSignalInputs(
  conversations: Conversation[],
  context: TickContext,
): Promise<CreateSignalInput[]> {
  const now = context.now.toISOString();
  const lookbackStart = new Date(context.now);
  lookbackStart.setHours(lookbackStart.getHours() - context.config.conversationSyncLookbackHours);

  const eligibleConversations = conversations.filter(
    (conversation) =>
      conversation.customerId &&
      (conversation.transcriptText || conversation.summary) &&
      new Date(conversation.updatedAt) >= lookbackStart,
  );

  const signalInputs: CreateSignalInput[] = [];
  for (const conversation of eligibleConversations) {
    const extraction = await extractConversationArtifacts(
      context.config.openAi.apiKey,
      context.config.openAi.model,
      {
        conversationId: conversation.conversationId,
        customerId: conversation.customerId,
        title: conversation.name,
        transcript: conversation.transcriptText || conversation.summary,
      },
    );

    for (const signal of extraction.signals) {
      signalInputs.push({
        name: signal.title,
        signalId: deterministicId(
          "signal",
          `${conversation.conversationId}:${signal.type}:${signal.title}:${signal.summary}`,
        ),
        signalType: signal.type,
        sourceTable: "conversations",
        sourceRowId: conversation.conversationId,
        ruleName: "conversation_extraction",
        confidence: signal.confidence,
        reviewStatus: signal.confidence >= 0.85 ? "Accepted" : "Review",
        conversationPageIds: [conversation.pageId],
        customerPageIds: conversation.customerPageIds,
        workItemPageIds: conversation.workItemPageIds,
        dedupeKey: deterministicId("dedupe", `${conversation.pageId}:${signal.type}:${signal.title}`),
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return signalInputs;
}

function shouldSendDailyBrief(briefs: Brief[], cycle: PriorityCycle, context: TickContext): boolean {
  const dedupeKey = buildDailyBriefDedupeKey({
    cycleId: cycle.cycleId,
    routeTo: context.config.slack.briefDmUserId,
    scheduledFor: context.now,
    timeZone: context.config.timezone,
  });

  return !briefs.some((brief) => brief.dedupeKey === dedupeKey && brief.status !== "Failed");
}

function toReadinessCreate(intent: ReturnType<typeof evaluateReadiness>): CreateReadinessGateInput {
  return {
    name: intent.name,
    gateId: intent.gateId,
    gateType: "Demo Readiness",
    priorityCyclePageIds: [intent.priorityCyclePageId],
    githubCiState: intent.githubCiState,
    githubCiCheckedAt: intent.githubCiCheckedAt,
    confirmedStatus: intent.confirmedStatus,
    lastEvaluatedAt: intent.lastEvaluatedAt,
    workItemPageIds: intent.workItemPageIds,
  };
}

function toReadinessUpdate(intent: ReturnType<typeof evaluateReadiness>) {
  return {
    githubCiState: intent.githubCiState,
    githubCiCheckedAt: intent.githubCiCheckedAt,
    confirmedStatus: intent.confirmedStatus,
    lastEvaluatedAt: intent.lastEvaluatedAt,
    workItemPageIds: intent.workItemPageIds,
  };
}

function deterministicId(prefix: string, value: string): string {
  return `${prefix}_${createHash("sha256").update(value).digest("hex").slice(0, 24)}`;
}
