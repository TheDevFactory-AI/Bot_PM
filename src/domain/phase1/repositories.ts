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
  SignalReviewStatus,
  SignalType,
  UpdateBotRunInput,
  UpdateBriefInput,
  UpdateReadinessGateInput,
  UpdateSignalInput,
  UpdateWorkItemBotFieldsInput,
  WorkItem,
  WorkItemStatus,
} from "./models.js";

export interface ListQuery {
  cursor?: string;
  pageSize?: number;
}

export interface ListResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CustomerListQuery extends ListQuery {
  active?: boolean;
  stage?: Customer["stage"];
  ownerId?: string;
}

export interface ConversationListQuery extends ListQuery {
  customerId?: string;
  customerPageId?: string;
  extractionStatus?: Conversation["extractionStatus"];
  sourceType?: Conversation["sourceType"];
  needsReview?: boolean;
}

export interface SignalListQuery extends ListQuery {
  signalType?: SignalType;
  reviewStatus?: SignalReviewStatus;
  customerPageId?: string;
  workItemPageId?: string;
  priorityCyclePageId?: string;
  openOnly?: boolean;
  needsReview?: boolean;
}

export interface WorkItemListQuery extends ListQuery {
  priorityCyclePageId?: string;
  ownerId?: string;
  customerPageId?: string;
  demoScopeOnly?: boolean;
  activeOnly?: boolean;
  statuses?: WorkItemStatus[];
  hardBlockedOnly?: boolean;
  statusNudgeEligible?: boolean;
}

export interface PriorityCycleListQuery extends ListQuery {
  cycleStatus?: PriorityCycle["cycleStatus"];
  cycleType?: PriorityCycle["cycleType"];
  activeOnly?: boolean;
}

export interface ReadinessGateListQuery extends ListQuery {
  priorityCyclePageId?: string;
  gateType?: ReadinessGate["gateType"];
  status?: ReadinessGate["computedStatus"];
}

export interface BriefListQuery extends ListQuery {
  briefType?: Brief["briefType"];
  status?: Brief["status"];
  priorityCyclePageId?: string;
  dedupeKey?: string;
  scheduledFrom?: string;
  scheduledTo?: string;
}

export interface BotRunListQuery extends ListQuery {
  batchId?: string;
  runType?: string;
  ruleName?: string;
  result?: BotRun["result"];
  triggerSource?: BotRun["triggerSource"];
}

export interface PeopleDirectoryListQuery extends ListQuery {
  activeOnly?: boolean;
  team?: string;
  missingSlackId?: boolean;
  missingEmail?: boolean;
}

export interface ReadRepository<TRecord, TQuery extends ListQuery = ListQuery> {
  list(query?: TQuery): Promise<ListResult<TRecord>>;
  getByPageId(pageId: string): Promise<TRecord | null>;
}

export interface ExternalIdReadRepository<TRecord, TQuery extends ListQuery = ListQuery>
  extends ReadRepository<TRecord, TQuery> {
  getByExternalId(externalId: string): Promise<TRecord | null>;
}

export interface CustomerReadRepository
  extends ExternalIdReadRepository<Customer, CustomerListQuery> {}

export interface ConversationReadRepository
  extends ExternalIdReadRepository<Conversation, ConversationListQuery> {}

export interface SignalReadRepository extends ExternalIdReadRepository<Signal, SignalListQuery> {}

export interface WorkItemReadRepository extends ExternalIdReadRepository<WorkItem, WorkItemListQuery> {}

export interface PriorityCycleReadRepository
  extends ExternalIdReadRepository<PriorityCycle, PriorityCycleListQuery> {}

export interface ReadinessGateReadRepository
  extends ExternalIdReadRepository<ReadinessGate, ReadinessGateListQuery> {}

export interface BriefReadRepository extends ExternalIdReadRepository<Brief, BriefListQuery> {}

export interface BotRunReadRepository extends ExternalIdReadRepository<BotRun, BotRunListQuery> {}

export interface PeopleDirectoryReadRepository
  extends ReadRepository<PersonDirectoryEntry, PeopleDirectoryListQuery> {
  getBySlackId(slackId: string): Promise<PersonDirectoryEntry | null>;
  getByEmail(email: string): Promise<PersonDirectoryEntry | null>;
}

export interface SignalWriteRepository {
  create(input: CreateSignalInput): Promise<Signal>;
  update(pageId: string, input: UpdateSignalInput): Promise<Signal>;
}

export interface WorkItemWriteRepository {
  updateBotFields(pageId: string, input: UpdateWorkItemBotFieldsInput): Promise<WorkItem>;
}

export interface ReadinessGateWriteRepository {
  create(input: CreateReadinessGateInput): Promise<ReadinessGate>;
  update(pageId: string, input: UpdateReadinessGateInput): Promise<ReadinessGate>;
}

export interface BriefWriteRepository {
  create(input: CreateBriefInput): Promise<Brief>;
  update(pageId: string, input: UpdateBriefInput): Promise<Brief>;
}

export interface BotRunWriteRepository {
  create(input: CreateBotRunInput): Promise<BotRun>;
  update(pageId: string, input: UpdateBotRunInput): Promise<BotRun>;
}

export interface Phase1ReadRepositories {
  customers: CustomerReadRepository;
  conversations: ConversationReadRepository;
  signals: SignalReadRepository;
  workItems: WorkItemReadRepository;
  priorityCycles: PriorityCycleReadRepository;
  readinessGates: ReadinessGateReadRepository;
  briefs: BriefReadRepository;
  botRuns: BotRunReadRepository;
  peopleDirectory: PeopleDirectoryReadRepository;
}

export interface Phase1WriteRepositories {
  signals: SignalWriteRepository;
  workItems: WorkItemWriteRepository;
  readinessGates: ReadinessGateWriteRepository;
  briefs: BriefWriteRepository;
  botRuns: BotRunWriteRepository;
}

export interface Phase1Repositories {
  read: Phase1ReadRepositories;
  write: Phase1WriteRepositories;
}
