const envGroups = {
  runtime: ["CRON_SECRET", "BOT_TIMEZONE", "OPENAI_API_KEY", "OPENAI_MODEL"] as const,
  slack: ["SLACK_BOT_TOKEN", "SLACK_ESCALATION_CHANNEL_ID", "SLACK_BRIEF_DM_USER_ID"] as const,
  notion: [
    "NOTION_TOKEN",
    "NOTION_CUSTOMERS_DATABASE_ID",
    "NOTION_CONVERSATIONS_DATABASE_ID",
    "NOTION_SIGNALS_DATABASE_ID",
    "NOTION_WORK_ITEMS_DATABASE_ID",
    "NOTION_PRIORITY_CYCLES_DATABASE_ID",
    "NOTION_READINESS_GATES_DATABASE_ID",
    "NOTION_BRIEFS_DATABASE_ID",
    "NOTION_BOT_RUNS_DATABASE_ID",
    "NOTION_PEOPLE_DIRECTORY_DATABASE_ID",
    "NOTION_QUERY_PAGE_SIZE",
    "CONVERSATION_SYNC_LOOKBACK_HOURS",
  ] as const,
  smtp: ["SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM", "EMAIL_REPLY_TO"] as const,
} as const;

export type EnvGroup = keyof typeof envGroups;
export type EnvName = (typeof envGroups)[EnvGroup][number];

export function getEnv(name: EnvName): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function hasEnv(name: EnvName): boolean {
  return Boolean(process.env[name]);
}

export function missingEnv(names: readonly EnvName[]): EnvName[] {
  return names.filter((name) => !process.env[name]);
}

export function getEnvGroup(name: EnvGroup): readonly EnvName[] {
  return envGroups[name];
}

export function getConnectorReadiness(): Record<EnvGroup, { configured: boolean; missing: EnvName[] }> {
  return {
    runtime: summarizeGroup("runtime"),
    slack: summarizeGroup("slack"),
    notion: summarizeGroup("notion"),
    smtp: summarizeGroup("smtp"),
  };
}

export function missingRequiredEnv(): EnvName[] {
  return [
    ...missingEnv(envGroups.runtime),
    ...missingEnv(envGroups.slack),
    ...missingEnv(envGroups.notion),
    ...missingEnv(envGroups.smtp),
  ];
}

function summarizeGroup(name: EnvGroup): { configured: boolean; missing: EnvName[] } {
  const missing = missingEnv(envGroups[name]);

  return {
    configured: missing.length === 0,
    missing,
  };
}

export function getIntEnv(name: EnvName, fallback?: number): number {
  const value = process.env[name];

  if (!value) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`Missing required environment variable: ${name}`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }

  return parsed;
}

export function getBooleanEnv(name: EnvName, fallback?: boolean): boolean {
  const value = process.env[name];

  if (!value) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value === "true";
}
