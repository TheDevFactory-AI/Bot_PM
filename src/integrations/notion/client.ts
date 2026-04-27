import type { Phase1NotionConfig } from "./config.js";
import type {
  NotionDatabase,
  NotionDatabaseQueryRequest,
  NotionDatabaseQueryResponse,
  NotionDatabaseUpdateRequest,
  NotionErrorBody,
  NotionFilter,
  NotionPage,
  NotionPageCreateRequest,
  NotionDatabasePropertyWriteSchemas,
  NotionPageWriteProperties,
  NotionPageUpdateRequest,
  NotionSort,
} from "./types.js";

export interface NotionClientOptions {
  token: string;
  apiBaseUrl?: string;
  apiVersion?: string;
  fetchImplementation?: typeof fetch;
}

export class NotionApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "NotionApiError";
  }
}

export class NotionClient {
  private readonly token: string;
  private readonly apiBaseUrl: string;
  private readonly apiVersion: string;
  private readonly fetchImplementation: typeof fetch;

  constructor(options: NotionClientOptions) {
    this.token = options.token;
    this.apiBaseUrl = options.apiBaseUrl ?? "https://api.notion.com/v1";
    this.apiVersion = options.apiVersion ?? "2022-06-28";
    this.fetchImplementation = options.fetchImplementation ?? fetch;
  }

  static fromConfig(config: Phase1NotionConfig): NotionClient {
    return new NotionClient({
      token: config.token,
      apiBaseUrl: config.apiBaseUrl,
      apiVersion: config.apiVersion,
    });
  }

  async queryDatabase(input: {
    databaseId: string;
    filter?: NotionFilter;
    sorts?: NotionSort[];
    pageSize?: number;
    startCursor?: string;
  }): Promise<NotionDatabaseQueryResponse> {
    const body: NotionDatabaseQueryRequest = {};

    if (input.filter) {
      body.filter = input.filter;
    }
    if (input.sorts) {
      body.sorts = input.sorts;
    }
    if (input.pageSize) {
      body.page_size = input.pageSize;
    }
    if (input.startCursor) {
      body.start_cursor = input.startCursor;
    }

    return this.request<NotionDatabaseQueryResponse>(`/databases/${input.databaseId}/query`, {
      method: "POST",
      body,
    });
  }

  async retrievePage(pageId: string): Promise<NotionPage> {
    return this.request<NotionPage>(`/pages/${pageId}`, {
      method: "GET",
    });
  }

  async retrieveDatabase(databaseId: string): Promise<NotionDatabase> {
    return this.request<NotionDatabase>(`/databases/${databaseId}`, {
      method: "GET",
    });
  }

  async updateDatabase(input: {
    databaseId: string;
    properties: NotionDatabasePropertyWriteSchemas;
  }): Promise<NotionDatabase> {
    const body: NotionDatabaseUpdateRequest = {
      properties: input.properties,
    };

    return this.request<NotionDatabase>(`/databases/${input.databaseId}`, {
      method: "PATCH",
      body,
    });
  }

  async createPage(input: {
    databaseId: string;
    properties: NotionPageWriteProperties;
  }): Promise<NotionPage> {
    const body: NotionPageCreateRequest = {
      parent: {
        database_id: input.databaseId,
      },
      properties: input.properties,
    };

    return this.request<NotionPage>("/pages", {
      method: "POST",
      body,
    });
  }

  async updatePage(input: {
    pageId: string;
    properties?: NotionPageWriteProperties;
    archived?: boolean;
  }): Promise<NotionPage> {
    const body: NotionPageUpdateRequest = {};

    if (input.properties) {
      body.properties = input.properties;
    }
    if (input.archived !== undefined) {
      body.archived = input.archived;
    }

    return this.request<NotionPage>(`/pages/${input.pageId}`, {
      method: "PATCH",
      body,
    });
  }

  async *iterateDatabase(input: {
    databaseId: string;
    filter?: NotionFilter;
    sorts?: NotionSort[];
    pageSize?: number;
  }): AsyncGenerator<NotionPage, void, void> {
    let cursor: string | undefined;

    do {
      const page = await this.queryDatabase({
        ...input,
        startCursor: cursor,
      });

      for (const result of page.results) {
        yield result;
      }

      cursor = page.next_cursor ?? undefined;
    } while (cursor);
  }

  private async request<T>(
    path: string,
    init: {
      method: "GET" | "POST" | "PATCH";
      body?: unknown;
    },
  ): Promise<T> {
    const response = await this.fetchImplementation(`${this.apiBaseUrl}${path}`, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        "Notion-Version": this.apiVersion,
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
    });

    if (!response.ok) {
      throw await this.toApiError(response);
    }

    return (await response.json()) as T;
  }

  private async toApiError(response: Response): Promise<NotionApiError> {
    const text = await response.text();

    try {
      const body = JSON.parse(text) as Partial<NotionErrorBody>;
      return new NotionApiError(
        body.message || `Notion API request failed with status ${response.status}`,
        response.status,
        body.code,
        body,
      );
    } catch {
      return new NotionApiError(
        text || `Notion API request failed with status ${response.status}`,
        response.status,
      );
    }
  }
}

export function isNotionNotFoundError(error: unknown): boolean {
  return error instanceof NotionApiError && error.status === 404;
}
