import { readFile } from "node:fs/promises";

import type {
  BotRun,
  Brief,
  Conversation,
  Customer,
  PersonDirectoryEntry,
  PriorityCycle,
  ReadinessGate,
  Signal,
  WorkItem,
} from "./models.js";
import type {
  BotRunListQuery,
  BotRunReadRepository,
  BriefListQuery,
  BriefReadRepository,
  ConversationListQuery,
  ConversationReadRepository,
  CustomerListQuery,
  CustomerReadRepository,
  ListQuery,
  ListResult,
  PeopleDirectoryListQuery,
  PeopleDirectoryReadRepository,
  Phase1ReadRepositories,
  PriorityCycleListQuery,
  PriorityCycleReadRepository,
  ReadinessGateListQuery,
  ReadinessGateReadRepository,
  SignalListQuery,
  SignalReadRepository,
  WorkItemListQuery,
  WorkItemReadRepository,
} from "./repositories.js";

export interface Phase1Snapshot {
  generatedAt: string;
  customers: Customer[];
  conversations: Conversation[];
  signals: Signal[];
  workItems: WorkItem[];
  priorityCycles: PriorityCycle[];
  readinessGates: ReadinessGate[];
  briefs: Brief[];
  botRuns: BotRun[];
  peopleDirectory: PersonDirectoryEntry[];
}

export async function loadPhase1SnapshotFromFile(path: string): Promise<Phase1Snapshot> {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw) as Phase1Snapshot;
}

export function createPhase1SnapshotReadRepositories(
  snapshot: Phase1Snapshot,
): Phase1ReadRepositories {
  return {
    customers: new SnapshotCustomerRepository(snapshot.customers),
    conversations: new SnapshotConversationRepository(snapshot.conversations),
    signals: new SnapshotSignalRepository(snapshot.signals),
    workItems: new SnapshotWorkItemRepository(snapshot.workItems),
    priorityCycles: new SnapshotPriorityCycleRepository(snapshot.priorityCycles),
    readinessGates: new SnapshotReadinessGateRepository(snapshot.readinessGates),
    briefs: new SnapshotBriefRepository(snapshot.briefs),
    botRuns: new SnapshotBotRunRepository(snapshot.botRuns),
    peopleDirectory: new SnapshotPeopleDirectoryRepository(snapshot.peopleDirectory),
  };
}

abstract class SnapshotReadRepository<TRecord extends { pageId: string }, TQuery extends ListQuery> {
  constructor(protected readonly rows: TRecord[]) {}

  async list(query?: TQuery): Promise<ListResult<TRecord>> {
    const filtered = this.applyQuery(this.rows, query);
    return paginate(filtered, query);
  }

  async getByPageId(pageId: string): Promise<TRecord | null> {
    return this.rows.find((row) => row.pageId === pageId) ?? null;
  }

  protected abstract applyQuery(rows: TRecord[], query?: TQuery): TRecord[];
}

class SnapshotCustomerRepository
  extends SnapshotReadRepository<Customer, CustomerListQuery>
  implements CustomerReadRepository
{
  async getByExternalId(externalId: string): Promise<Customer | null> {
    return this.rows.find((row) => row.customerId === externalId) ?? null;
  }

  protected applyQuery(rows: Customer[], query?: CustomerListQuery): Customer[] {
    return rows.filter((row) => {
      if (query?.active !== undefined && row.active !== query.active) {
        return false;
      }
      if (query?.stage && row.stage !== query.stage) {
        return false;
      }
      if (query?.ownerId && !row.ownerIds.includes(query.ownerId)) {
        return false;
      }
      return true;
    });
  }
}

class SnapshotConversationRepository
  extends SnapshotReadRepository<Conversation, ConversationListQuery>
  implements ConversationReadRepository
{
  async getByExternalId(externalId: string): Promise<Conversation | null> {
    return this.rows.find((row) => row.conversationId === externalId) ?? null;
  }

  protected applyQuery(rows: Conversation[], query?: ConversationListQuery): Conversation[] {
    return rows.filter((row) => {
      if (query?.customerId && row.customerId !== query.customerId) {
        return false;
      }
      if (query?.customerPageId && !row.customerPageIds.includes(query.customerPageId)) {
        return false;
      }
      if (query?.extractionStatus && row.extractionStatus !== query.extractionStatus) {
        return false;
      }
      if (query?.sourceType && row.sourceType !== query.sourceType) {
        return false;
      }
      if (query?.needsReview !== undefined && row.needsReview !== query.needsReview) {
        return false;
      }
      return true;
    });
  }
}

class SnapshotSignalRepository
  extends SnapshotReadRepository<Signal, SignalListQuery>
  implements SignalReadRepository
{
  async getByExternalId(externalId: string): Promise<Signal | null> {
    return this.rows.find((row) => row.signalId === externalId) ?? null;
  }

  protected applyQuery(rows: Signal[], query?: SignalListQuery): Signal[] {
    return rows.filter((row) => {
      if (query?.signalType && row.signalType !== query.signalType) {
        return false;
      }
      if (query?.reviewStatus && row.reviewStatus !== query.reviewStatus) {
        return false;
      }
      if (query?.customerPageId && !row.customerPageIds.includes(query.customerPageId)) {
        return false;
      }
      if (query?.workItemPageId && !row.workItemPageIds.includes(query.workItemPageId)) {
        return false;
      }
      if (query?.priorityCyclePageId && !row.priorityCyclePageIds.includes(query.priorityCyclePageId)) {
        return false;
      }
      if (query?.openOnly && row.isOpen !== true) {
        return false;
      }
      if (query?.needsReview !== undefined && row.needsReview !== query.needsReview) {
        return false;
      }
      return true;
    });
  }
}

class SnapshotWorkItemRepository
  extends SnapshotReadRepository<WorkItem, WorkItemListQuery>
  implements WorkItemReadRepository
{
  async getByExternalId(externalId: string): Promise<WorkItem | null> {
    return this.rows.find((row) => row.workItemId === externalId) ?? null;
  }

  protected applyQuery(rows: WorkItem[], query?: WorkItemListQuery): WorkItem[] {
    return rows.filter((row) => {
      if (query?.priorityCyclePageId && !row.priorityCyclePageIds.includes(query.priorityCyclePageId)) {
        return false;
      }
      if (query?.ownerId && !row.ownerIds.includes(query.ownerId)) {
        return false;
      }
      if (query?.customerPageId && !row.customerPageIds.includes(query.customerPageId)) {
        return false;
      }
      if (query?.demoScopeOnly && !row.demoScope) {
        return false;
      }
      if (query?.activeOnly && ["Backlog", "Done", "Canceled"].includes(row.status ?? "")) {
        return false;
      }
      if (query?.statuses && !query.statuses.includes(row.status ?? "Backlog")) {
        return false;
      }
      if (query?.hardBlockedOnly && row.computedHardBlocked !== true) {
        return false;
      }
      if (
        query?.statusNudgeEligible !== undefined &&
        row.statusNudgeEligible !== query.statusNudgeEligible
      ) {
        return false;
      }
      return true;
    });
  }
}

class SnapshotPriorityCycleRepository
  extends SnapshotReadRepository<PriorityCycle, PriorityCycleListQuery>
  implements PriorityCycleReadRepository
{
  async getByExternalId(externalId: string): Promise<PriorityCycle | null> {
    return this.rows.find((row) => row.cycleId === externalId) ?? null;
  }

  protected applyQuery(rows: PriorityCycle[], query?: PriorityCycleListQuery): PriorityCycle[] {
    return rows.filter((row) => {
      if (query?.cycleStatus && row.cycleStatus !== query.cycleStatus) {
        return false;
      }
      if (query?.cycleType && row.cycleType !== query.cycleType) {
        return false;
      }
      if (query?.activeOnly && row.cycleStatus !== "Active") {
        return false;
      }
      return true;
    });
  }
}

class SnapshotReadinessGateRepository
  extends SnapshotReadRepository<ReadinessGate, ReadinessGateListQuery>
  implements ReadinessGateReadRepository
{
  async getByExternalId(externalId: string): Promise<ReadinessGate | null> {
    return this.rows.find((row) => row.gateId === externalId) ?? null;
  }

  protected applyQuery(rows: ReadinessGate[], query?: ReadinessGateListQuery): ReadinessGate[] {
    return rows.filter((row) => {
      if (query?.priorityCyclePageId && !row.priorityCyclePageIds.includes(query.priorityCyclePageId)) {
        return false;
      }
      if (query?.gateType && row.gateType !== query.gateType) {
        return false;
      }
      if (query?.status && row.computedStatus !== query.status) {
        return false;
      }
      return true;
    });
  }
}

class SnapshotBriefRepository
  extends SnapshotReadRepository<Brief, BriefListQuery>
  implements BriefReadRepository
{
  async getByExternalId(externalId: string): Promise<Brief | null> {
    return this.rows.find((row) => row.briefId === externalId) ?? null;
  }

  protected applyQuery(rows: Brief[], query?: BriefListQuery): Brief[] {
    return rows.filter((row) => {
      if (query?.briefType && row.briefType !== query.briefType) {
        return false;
      }
      if (query?.status && row.status !== query.status) {
        return false;
      }
      if (query?.priorityCyclePageId && !row.priorityCyclePageIds.includes(query.priorityCyclePageId)) {
        return false;
      }
      if (query?.dedupeKey && row.dedupeKey !== query.dedupeKey) {
        return false;
      }
      if (query?.scheduledFrom && row.scheduledFor && row.scheduledFor < query.scheduledFrom) {
        return false;
      }
      if (query?.scheduledTo && row.scheduledFor && row.scheduledFor > query.scheduledTo) {
        return false;
      }
      return true;
    });
  }
}

class SnapshotBotRunRepository
  extends SnapshotReadRepository<BotRun, BotRunListQuery>
  implements BotRunReadRepository
{
  async getByExternalId(externalId: string): Promise<BotRun | null> {
    return this.rows.find((row) => row.runId === externalId) ?? null;
  }

  protected applyQuery(rows: BotRun[], query?: BotRunListQuery): BotRun[] {
    return rows.filter((row) => {
      if (query?.batchId && row.batchId !== query.batchId) {
        return false;
      }
      if (query?.runType && row.runType !== query.runType) {
        return false;
      }
      if (query?.ruleName && row.ruleName !== query.ruleName) {
        return false;
      }
      if (query?.result && row.result !== query.result) {
        return false;
      }
      if (query?.triggerSource && row.triggerSource !== query.triggerSource) {
        return false;
      }
      return true;
    });
  }
}

class SnapshotPeopleDirectoryRepository
  extends SnapshotReadRepository<PersonDirectoryEntry, PeopleDirectoryListQuery>
  implements PeopleDirectoryReadRepository
{
  async getBySlackId(slackId: string): Promise<PersonDirectoryEntry | null> {
    return this.rows.find((row) => row.slackId === slackId) ?? null;
  }

  async getByEmail(email: string): Promise<PersonDirectoryEntry | null> {
    return this.rows.find((row) => row.email === email) ?? null;
  }

  protected applyQuery(
    rows: PersonDirectoryEntry[],
    query?: PeopleDirectoryListQuery,
  ): PersonDirectoryEntry[] {
    return rows.filter((row) => {
      if (query?.activeOnly && !row.active) {
        return false;
      }
      if (query?.team && row.team !== query.team) {
        return false;
      }
      if (query?.missingSlackId && row.slackId.trim().length > 0) {
        return false;
      }
      if (query?.missingEmail && row.email.trim().length > 0) {
        return false;
      }
      return true;
    });
  }
}

function paginate<T>(rows: T[], query?: ListQuery): ListResult<T> {
  const pageSize = query?.pageSize ?? rows.length;
  const startIndex = query?.cursor ? Number.parseInt(query.cursor, 10) || 0 : 0;
  const items = rows.slice(startIndex, startIndex + pageSize);
  const nextIndex = startIndex + items.length;

  return {
    items,
    nextCursor: nextIndex < rows.length ? String(nextIndex) : null,
    hasMore: nextIndex < rows.length,
  };
}
