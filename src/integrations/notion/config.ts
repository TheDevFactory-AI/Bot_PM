export interface Phase1NotionDatabaseIds {
  customers: string;
  conversations: string;
  signals: string;
  workItems: string;
  priorityCycles: string;
  readinessGates: string;
  briefs: string;
  botRuns: string;
  peopleDirectory: string;
}

export interface Phase1NotionConfig {
  token: string;
  apiBaseUrl: string;
  apiVersion: string;
  databases: Phase1NotionDatabaseIds;
}

export interface Phase1NotionConfigStatus {
  configured: boolean;
  missing: string[];
}

const DEFAULT_API_BASE_URL = "https://api.notion.com/v1";
const DEFAULT_API_VERSION = "2022-06-28";

export function getPhase1NotionConfig(env: NodeJS.ProcessEnv = process.env): Phase1NotionConfig {
  const status = getPhase1NotionConfigStatus(env);

  if (!status.configured) {
    throw new Error(
      `Missing required Phase 1 Notion environment variables: ${status.missing.join(", ")}`,
    );
  }

  return {
    token: env.NOTION_TOKEN as string,
    apiBaseUrl: env.NOTION_API_BASE_URL || DEFAULT_API_BASE_URL,
    apiVersion: env.NOTION_API_VERSION || DEFAULT_API_VERSION,
    databases: {
      customers: env.NOTION_CUSTOMERS_DATABASE_ID as string,
      conversations: env.NOTION_CONVERSATIONS_DATABASE_ID as string,
      signals: firstPresent(env, ["NOTION_SIGNALS_DATABASE_ID", "NOTION_INSIGHTS_DATABASE_ID"]) as string,
      workItems: firstPresent(env, ["NOTION_WORK_ITEMS_DATABASE_ID", "NOTION_FEATURES_DATABASE_ID"]) as string,
      priorityCycles: firstPresent(env, [
        "NOTION_PRIORITY_CYCLES_DATABASE_ID",
        "NOTION_WEEKLY_PRIORITIES_DATABASE_ID",
      ]) as string,
      readinessGates: env.NOTION_READINESS_GATES_DATABASE_ID as string,
      briefs: env.NOTION_BRIEFS_DATABASE_ID as string,
      botRuns: env.NOTION_BOT_RUNS_DATABASE_ID as string,
      peopleDirectory: env.NOTION_PEOPLE_DIRECTORY_DATABASE_ID as string,
    },
  };
}

export function getPhase1NotionConfigStatus(
  env: NodeJS.ProcessEnv = process.env,
): Phase1NotionConfigStatus {
  const required = [
    ["NOTION_TOKEN"],
    ["NOTION_CUSTOMERS_DATABASE_ID"],
    ["NOTION_CONVERSATIONS_DATABASE_ID"],
    ["NOTION_SIGNALS_DATABASE_ID", "NOTION_INSIGHTS_DATABASE_ID"],
    ["NOTION_WORK_ITEMS_DATABASE_ID", "NOTION_FEATURES_DATABASE_ID"],
    ["NOTION_PRIORITY_CYCLES_DATABASE_ID", "NOTION_WEEKLY_PRIORITIES_DATABASE_ID"],
    ["NOTION_READINESS_GATES_DATABASE_ID"],
    ["NOTION_BRIEFS_DATABASE_ID"],
    ["NOTION_BOT_RUNS_DATABASE_ID"],
    ["NOTION_PEOPLE_DIRECTORY_DATABASE_ID"],
  ] as const;

  const missing = required
    .filter((group) => !group.some((name) => hasValue(env[name])))
    .map((group) => group[0]);

  return {
    configured: missing.length === 0,
    missing,
  };
}

function firstPresent(env: NodeJS.ProcessEnv, names: readonly string[]): string | undefined {
  const match = names.find((name) => hasValue(env[name]));
  return match ? env[match] : undefined;
}

function hasValue(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
