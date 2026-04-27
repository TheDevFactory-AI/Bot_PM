import type {
  BotRun,
  Brief,
  Conversation,
  Customer,
  PersonDirectoryEntry,
  PriorityCycle,
  ReadinessGate,
  Signal,
  UpdateWorkItemBotFieldsInput,
  WorkItem,
} from "../../domain/phase1/index.js";
import type {
  BotRunListQuery,
  BotRunReadRepository,
  BotRunWriteRepository,
  BriefListQuery,
  BriefReadRepository,
  BriefWriteRepository,
  ConversationListQuery,
  ConversationReadRepository,
  CustomerListQuery,
  CustomerReadRepository,
  ListQuery,
  ListResult,
  PeopleDirectoryListQuery,
  PeopleDirectoryReadRepository,
  Phase1ReadRepositories,
  Phase1WriteRepositories,
  PriorityCycleListQuery,
  PriorityCycleReadRepository,
  ReadinessGateListQuery,
  ReadinessGateReadRepository,
  ReadinessGateWriteRepository,
  SignalListQuery,
  SignalReadRepository,
  SignalWriteRepository,
  WorkItemListQuery,
  WorkItemReadRepository,
  WorkItemWriteRepository,
} from "../../domain/phase1/repositories.js";
import type {
  CreateBotRunInput,
  CreateBriefInput,
  CreateReadinessGateInput,
  CreateSignalInput,
  UpdateBotRunInput,
  UpdateBriefInput,
  UpdateReadinessGateInput,
  UpdateSignalInput,
} from "../../domain/phase1/models.js";
import type { Phase1NotionConfig } from "./config.js";
import { NotionClient, isNotionNotFoundError } from "./client.js";
import {
  botRunCodec,
  briefCodec,
  conversationCodec,
  customerCodec,
  peopleDirectoryCodec,
  priorityCycleCodec,
  readinessGateCodec,
  signalCodec,
  workItemCodec,
  type NotionDatabaseCodec,
  type NotionWritableDatabaseCodec,
} from "./propertyCodec.js";
import type { NotionFilter, NotionPage, NotionSort } from "./types.js";

export function createPhase1NotionRepositories(
  config: Phase1NotionConfig,
): Phase1ReadRepositories & Phase1WriteRepositories {
  const client = NotionClient.fromConfig(config);

  return {
    customers: new CustomersRepository(client, config.databases.customers),
    conversations: new ConversationsRepository(client, config.databases.conversations),
    signals: new SignalsRepository(client, config.databases.signals),
    workItems: new WorkItemsRepository(client, config.databases.workItems),
    priorityCycles: new PriorityCyclesRepository(client, config.databases.priorityCycles),
    readinessGates: new ReadinessGatesRepository(client, config.databases.readinessGates),
    briefs: new BriefsRepository(client, config.databases.briefs),
    botRuns: new BotRunsRepository(client, config.databases.botRuns),
    peopleDirectory: new PeopleDirectoryRepository(client, config.databases.peopleDirectory),
  };
}

abstract class NotionReadRepository<TRecord, TQuery extends ListQuery> {
  constructor(
    protected readonly client: NotionClient,
    protected readonly databaseId: string,
    protected readonly codec: NotionDatabaseCodec<TRecord>,
  ) {}

  async list(query?: TQuery): Promise<ListResult<TRecord>> {
    const response = await this.client.queryDatabase({
      databaseId: this.databaseId,
      filter: this.buildFilter(query),
      sorts: this.buildSorts(query),
      pageSize: query?.pageSize,
      startCursor: query?.cursor,
    });

    return {
      items: response.results.map((page) => this.codec.decode(page)),
      nextCursor: response.next_cursor,
      hasMore: response.has_more,
    };
  }

  async getByPageId(pageId: string): Promise<TRecord | null> {
    try {
      const page = await this.client.retrievePage(pageId);
      return this.codec.decode(page);
    } catch (error) {
      if (isNotionNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  protected buildSorts(_query?: TQuery): NotionSort[] | undefined {
    return undefined;
  }

  protected abstract buildFilter(query?: TQuery): NotionFilter | undefined;
}

abstract class NotionExternalIdReadRepository<TRecord, TQuery extends ListQuery> extends NotionReadRepository<
  TRecord,
  TQuery
> {
  async getByExternalId(externalId: string): Promise<TRecord | null> {
    if (!this.codec.externalIdProperty) {
      throw new Error(`Codec for ${this.codec.table} does not expose an external ID property.`);
    }

    const response = await this.client.queryDatabase({
      databaseId: this.databaseId,
      filter: propertyEqualsText(this.codec.externalIdProperty, externalId),
      pageSize: 1,
    });

    return response.results[0] ? this.codec.decode(response.results[0]) : null;
  }
}

abstract class NotionWritableRepository<TRecord, TCreate, TUpdate, TQuery extends ListQuery>
  extends NotionExternalIdReadRepository<TRecord, TQuery>
{
  declare protected readonly codec: NotionWritableDatabaseCodec<TRecord, TCreate, TUpdate>;

  async create(input: TCreate): Promise<TRecord> {
    const page = await this.client.createPage({
      databaseId: this.databaseId,
      properties: this.codec.encodeCreate(input),
    });
    return this.codec.decode(page);
  }

  async update(pageId: string, input: TUpdate): Promise<TRecord> {
    const page = await this.client.updatePage({
      pageId,
      properties: this.codec.encodeUpdate(input),
    });
    return this.codec.decode(page);
  }
}

class CustomersRepository
  extends NotionExternalIdReadRepository<Customer, CustomerListQuery>
  implements CustomerReadRepository
{
  constructor(client: NotionClient, databaseId: string) {
    super(client, databaseId, customerCodec);
  }

  protected buildFilter(query?: CustomerListQuery): NotionFilter | undefined {
    const filters: NotionFilter[] = [];

    if (query?.active !== undefined) {
      filters.push(propertyEqualsCheckbox("Active", query.active));
    }
    if (query?.stage) {
      filters.push(propertyEqualsSelectLike("Stage", query.stage));
    }
    if (query?.ownerId) {
      filters.push(propertyContainsPeople("Owner", query.ownerId));
    }

    return andFilter(filters);
  }
}

class ConversationsRepository
  extends NotionExternalIdReadRepository<Conversation, ConversationListQuery>
  implements ConversationReadRepository
{
  constructor(client: NotionClient, databaseId: string) {
    super(client, databaseId, conversationCodec);
  }

  protected buildFilter(query?: ConversationListQuery): NotionFilter | undefined {
    const filters: NotionFilter[] = [];

    if (query?.customerId) {
      filters.push(propertyEqualsText("Customer ID", query.customerId));
    }
    if (query?.customerPageId) {
      filters.push(propertyContainsRelation("Customer", query.customerPageId));
    }
    if (query?.extractionStatus) {
      filters.push(propertyEqualsSelect("Review Status", query.extractionStatus));
    }
    if (query?.sourceType) {
      filters.push(propertyEqualsSelect("Source Type", query.sourceType));
    }
    if (query?.needsReview !== undefined) {
      filters.push(propertyEqualsBooleanLike("Needs Review", query.needsReview));
    }

    return andFilter(filters);
  }

  protected override buildSorts(): NotionSort[] {
    return [{ property: "Occurred At", direction: "descending" }];
  }
}

class SignalsRepository
  extends NotionWritableRepository<Signal, CreateSignalInput, UpdateSignalInput, SignalListQuery>
  implements SignalReadRepository, SignalWriteRepository
{
  constructor(client: NotionClient, databaseId: string) {
    super(client, databaseId, signalCodec);
  }

  protected buildFilter(query?: SignalListQuery): NotionFilter | undefined {
    const filters: NotionFilter[] = [];

    if (query?.signalType) {
      filters.push(propertyEqualsSelect("Signal Type", query.signalType));
    }
    if (query?.reviewStatus) {
      filters.push(propertyEqualsSelect("Review Status", query.reviewStatus));
    }
    if (query?.customerPageId) {
      filters.push(propertyContainsRelation("Customer", query.customerPageId));
    }
    if (query?.workItemPageId) {
      filters.push(propertyContainsRelation("Work Item", query.workItemPageId));
    }
    if (query?.priorityCyclePageId) {
      filters.push(propertyContainsRelation("Priority Cycle", query.priorityCyclePageId));
    }
    if (query?.openOnly) {
      filters.push(propertyEqualsBooleanLike("Is Open", true));
    }
    if (query?.needsReview !== undefined) {
      filters.push(propertyEqualsBooleanLike("Needs Review", query.needsReview));
    }

    return andFilter(filters);
  }
}

class WorkItemsRepository
  extends NotionExternalIdReadRepository<WorkItem, WorkItemListQuery>
  implements WorkItemReadRepository, WorkItemWriteRepository
{
  constructor(client: NotionClient, databaseId: string) {
    super(client, databaseId, workItemCodec);
  }

  override async getByExternalId(externalId: string): Promise<WorkItem | null> {
    try {
      return await super.getByExternalId(externalId);
    } catch (error) {
      const pageMatch = await this.getByPageId(externalId).catch(() => null);
      if (pageMatch) {
        return pageMatch;
      }
      throw error;
    }
  }

  async updateBotFields(pageId: string, input: UpdateWorkItemBotFieldsInput): Promise<WorkItem> {
    const page = await this.client.updatePage({
      pageId,
      properties: workItemCodec.encodeUpdate(input),
    });

    return workItemCodec.decode(page);
  }

  protected buildFilter(query?: WorkItemListQuery): NotionFilter | undefined {
    const filters: NotionFilter[] = [];

    if (query?.priorityCyclePageId) {
      filters.push(propertyContainsRelation("Priority Cycle", query.priorityCyclePageId));
    }
    if (query?.ownerId) {
      filters.push(propertyContainsRelation("Owner", query.ownerId));
    }
    if (query?.customerPageId) {
      filters.push(propertyContainsRelation("Customers", query.customerPageId));
    }
    if (query?.demoScopeOnly) {
      filters.push(propertyEqualsCheckbox("Demo Scope", true));
    }
    if (query?.activeOnly) {
      filters.push(
        andFilter(
          LIVE_WORK_ITEM_INACTIVE_STATUSES.map((status) =>
            propertyDoesNotEqualStatus("Status", status),
          ),
        ) as NotionFilter,
      );
    }
    if (query?.statuses && query.statuses.length > 0) {
      const statusFilters = query.statuses.flatMap((status) =>
        liveWorkItemStatusNames(status).map((notionStatus) =>
          propertyEqualsStatus("Status", notionStatus),
        ),
      );
      filters.push((orFilter(statusFilters) ?? noWorkItemStatusMatchFilter()) as NotionFilter);
    }
    if (query?.hardBlockedOnly) {
      filters.push(propertyEqualsBooleanLike("Computed Hard Blocked", true));
    }
    if (query?.statusNudgeEligible !== undefined) {
      filters.push(propertyEqualsBooleanLike("Status Nudge Eligible", query.statusNudgeEligible));
    }

    return andFilter(filters);
  }
}

class PriorityCyclesRepository
  extends NotionExternalIdReadRepository<PriorityCycle, PriorityCycleListQuery>
  implements PriorityCycleReadRepository
{
  constructor(client: NotionClient, databaseId: string) {
    super(client, databaseId, priorityCycleCodec);
  }

  protected buildFilter(query?: PriorityCycleListQuery): NotionFilter | undefined {
    const filters: NotionFilter[] = [];

    if (query?.cycleStatus) {
      filters.push(propertyEqualsSelect("Cycle Status", query.cycleStatus));
    }
    if (query?.cycleType) {
      filters.push(propertyEqualsSelect("Cycle Type", query.cycleType));
    }
    if (query?.activeOnly) {
      filters.push(propertyEqualsSelect("Cycle Status", "Active"));
    }

    return andFilter(filters);
  }

  protected override buildSorts(): NotionSort[] {
    return [{ property: "Start Date", direction: "descending" }];
  }
}

class ReadinessGatesRepository
  extends NotionWritableRepository<
    ReadinessGate,
    CreateReadinessGateInput,
    UpdateReadinessGateInput,
    ReadinessGateListQuery
  >
  implements ReadinessGateReadRepository, ReadinessGateWriteRepository
{
  constructor(client: NotionClient, databaseId: string) {
    super(client, databaseId, readinessGateCodec);
  }

  protected buildFilter(query?: ReadinessGateListQuery): NotionFilter | undefined {
    const filters: NotionFilter[] = [];

    if (query?.priorityCyclePageId) {
      filters.push(propertyContainsRelation("Priority Cycle", query.priorityCyclePageId));
    }
    if (query?.gateType) {
      filters.push(propertyEqualsSelect("Gate Type", query.gateType));
    }
    if (query?.status) {
      filters.push(propertyEqualsSelect("Computed Status", query.status));
    }

    return andFilter(filters);
  }
}

class BriefsRepository
  extends NotionWritableRepository<Brief, CreateBriefInput, UpdateBriefInput, BriefListQuery>
  implements BriefReadRepository, BriefWriteRepository
{
  constructor(client: NotionClient, databaseId: string) {
    super(client, databaseId, briefCodec);
  }

  protected buildFilter(query?: BriefListQuery): NotionFilter | undefined {
    const filters: NotionFilter[] = [];

    if (query?.briefType) {
      filters.push(propertyEqualsSelect("Brief Type", query.briefType));
    }
    if (query?.status) {
      filters.push(propertyEqualsSelect("Status", query.status));
    }
    if (query?.priorityCyclePageId) {
      filters.push(propertyContainsRelation("Priority Cycle", query.priorityCyclePageId));
    }
    if (query?.dedupeKey) {
      filters.push(propertyEqualsText("Dedupe Key", query.dedupeKey));
    }
    if (query?.scheduledFrom) {
      filters.push(propertyDateOnOrAfter("Scheduled For", query.scheduledFrom));
    }
    if (query?.scheduledTo) {
      filters.push(propertyDateOnOrBefore("Scheduled For", query.scheduledTo));
    }

    return andFilter(filters);
  }

  protected override buildSorts(): NotionSort[] {
    return [{ property: "Scheduled For", direction: "ascending" }];
  }
}

class BotRunsRepository
  extends NotionWritableRepository<BotRun, CreateBotRunInput, UpdateBotRunInput, BotRunListQuery>
  implements BotRunReadRepository, BotRunWriteRepository
{
  constructor(client: NotionClient, databaseId: string) {
    super(client, databaseId, botRunCodec);
  }

  protected buildFilter(query?: BotRunListQuery): NotionFilter | undefined {
    const filters: NotionFilter[] = [];

    if (query?.batchId) {
      filters.push(propertyEqualsText("Batch ID", query.batchId));
    }
    if (query?.runType) {
      filters.push(propertyEqualsSelect("Run Type", query.runType));
    }
    if (query?.ruleName) {
      filters.push(propertyEqualsText("Rule Name", query.ruleName));
    }
    if (query?.result) {
      filters.push(propertyEqualsSelect("Result", query.result));
    }
    if (query?.triggerSource) {
      filters.push(propertyEqualsSelect("Trigger Source", query.triggerSource));
    }

    return andFilter(filters);
  }

  protected override buildSorts(): NotionSort[] {
    return [{ property: "Occurred At", direction: "descending" }];
  }
}

class PeopleDirectoryRepository
  extends NotionReadRepository<PersonDirectoryEntry, PeopleDirectoryListQuery>
  implements PeopleDirectoryReadRepository
{
  constructor(client: NotionClient, databaseId: string) {
    super(client, databaseId, peopleDirectoryCodec);
  }

  async getBySlackId(slackId: string): Promise<PersonDirectoryEntry | null> {
    const result = await this.client.queryDatabase({
      databaseId: this.databaseId,
      filter: propertyEqualsText("Slack ID", slackId),
      pageSize: 1,
    });
    return result.results[0] ? peopleDirectoryCodec.decode(result.results[0]) : null;
  }

  async getByEmail(email: string): Promise<PersonDirectoryEntry | null> {
    const result = await this.client.queryDatabase({
      databaseId: this.databaseId,
      filter: propertyEqualsEmail("Email", email),
      pageSize: 1,
    });
    return result.results[0] ? peopleDirectoryCodec.decode(result.results[0]) : null;
  }

  protected buildFilter(query?: PeopleDirectoryListQuery): NotionFilter | undefined {
    const filters: NotionFilter[] = [];

    if (query?.activeOnly) {
      filters.push(propertyEqualsCheckbox("Active", true));
    }
    if (query?.team) {
      filters.push(
        orFilter([
          propertyEqualsSelectLike("Team", query.team),
          propertyEqualsText("Team", query.team),
        ]) as NotionFilter,
      );
    }
    if (query?.missingSlackId) {
      filters.push(propertyIsEmpty("Slack ID"));
    }
    if (query?.missingEmail) {
      filters.push(propertyEmailIsEmpty("Email"));
    }

    return andFilter(filters);
  }
}

function andFilter(filters: NotionFilter[]): NotionFilter | undefined {
  if (filters.length === 0) {
    return undefined;
  }
  if (filters.length === 1) {
    return filters[0];
  }
  return { and: filters };
}

function orFilter(filters: NotionFilter[]): NotionFilter | undefined {
  if (filters.length === 0) {
    return undefined;
  }
  if (filters.length === 1) {
    return filters[0];
  }
  return { or: filters };
}

function propertyEqualsText(property: string, value: string): NotionFilter {
  return {
    property,
    rich_text: {
      equals: value,
    },
  };
}

function propertyEqualsTitle(property: string, value: string): NotionFilter {
  return {
    property,
    title: {
      equals: value,
    },
  };
}

function propertyEqualsEmail(property: string, value: string): NotionFilter {
  return {
    property,
    email: {
      equals: value,
    },
  };
}

function propertyEqualsCheckbox(property: string, value: boolean): NotionFilter {
  return {
    property,
    checkbox: {
      equals: value,
    },
  };
}

function propertyEqualsSelect(property: string, value: string): NotionFilter {
  return {
    property,
    select: {
      equals: value,
    },
  };
}

function propertyEqualsStatus(property: string, value: string): NotionFilter {
  return {
    property,
    status: {
      equals: value,
    },
  };
}

function propertyEqualsSelectLike(property: string, value: string): NotionFilter {
  return {
    or: [
      {
        property,
        select: {
          equals: value,
        },
      },
      {
        property,
        status: {
          equals: value,
        },
      },
    ],
  };
}

function propertyEqualsFormulaString(property: string, value: string): NotionFilter {
  return {
    property,
    formula: {
      string: {
        equals: value,
      },
    },
  };
}

function propertyDoesNotEqualSelectLike(property: string, value: string): NotionFilter {
  return {
    and: [
      {
        property,
        select: {
          does_not_equal: value,
        },
      },
      {
        property,
        status: {
          does_not_equal: value,
        },
      },
    ],
  };
}

function propertyDoesNotEqualStatus(property: string, value: string): NotionFilter {
  return {
    property,
    status: {
      does_not_equal: value,
    },
  };
}

function propertyContainsRelation(property: string, pageId: string): NotionFilter {
  return {
    property,
    relation: {
      contains: pageId,
    },
  };
}

function propertyContainsPeople(property: string, personId: string): NotionFilter {
  return {
    property,
    people: {
      contains: personId,
    },
  };
}

function propertyDateOnOrAfter(property: string, date: string): NotionFilter {
  return {
    property,
    date: {
      on_or_after: date,
    },
  };
}

function propertyDateOnOrBefore(property: string, date: string): NotionFilter {
  return {
    property,
    date: {
      on_or_before: date,
    },
  };
}

function propertyIsEmpty(property: string): NotionFilter {
  return {
    property,
    rich_text: {
      is_empty: true,
    },
  };
}

function propertyEmailIsEmpty(property: string): NotionFilter {
  return {
    property,
    email: {
      is_empty: true,
    },
  };
}

function propertyEqualsBooleanLike(property: string, value: boolean): NotionFilter {
  return {
    or: [
      propertyEqualsCheckbox(property, value),
      {
        property,
        formula: {
          checkbox: {
            equals: value,
          },
        },
      },
    ],
  };
}

const LIVE_WORK_ITEM_INACTIVE_STATUSES = [
  "New",
  "To-do",
  "Resolved",
  "Released",
  "Complete",
  "Won't Fix",
] as const;

const LIVE_WORK_ITEM_STATUS_NAMES = {
  Backlog: ["New", "To-do"],
  Ready: [],
  "In Progress": ["In Progress", "In progress"],
  Blocked: [],
  "In Review": ["Testing"],
  Done: ["Resolved", "Released", "Complete"],
  Canceled: ["Won't Fix"],
} as const satisfies Record<NonNullable<WorkItem["status"]>, readonly string[]>;

function liveWorkItemStatusNames(status: NonNullable<WorkItem["status"]>): readonly string[] {
  return LIVE_WORK_ITEM_STATUS_NAMES[status];
}

function noWorkItemStatusMatchFilter(): NotionFilter {
  return propertyEqualsTitle("Bug Title", "__no_matching_work_item_status__");
}
