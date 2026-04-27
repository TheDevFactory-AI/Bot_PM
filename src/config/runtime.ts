import { getBooleanEnv, getEnv, getIntEnv } from "./env.js";

export type RunMode = "dry-run" | "persist-only" | "live";

export interface RuntimeConfig {
  cronSecret: string;
  timezone: string;
  queryPageSize: number;
  conversationSyncLookbackHours: number;
  openAi: {
    apiKey: string;
    model: string;
  };
  slack: {
    botToken: string;
    escalationChannelId: string;
    briefDmUserId: string;
  };
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
    replyTo: string;
  };
}

export function getRuntimeConfig(): RuntimeConfig {
  return {
    cronSecret: getEnv("CRON_SECRET"),
    timezone: getEnv("BOT_TIMEZONE"),
    queryPageSize: getIntEnv("NOTION_QUERY_PAGE_SIZE", 100),
    conversationSyncLookbackHours: getIntEnv("CONVERSATION_SYNC_LOOKBACK_HOURS", 72),
    openAi: {
      apiKey: getEnv("OPENAI_API_KEY"),
      model: getEnv("OPENAI_MODEL"),
    },
    slack: {
      botToken: getEnv("SLACK_BOT_TOKEN"),
      escalationChannelId: getEnv("SLACK_ESCALATION_CHANNEL_ID"),
      briefDmUserId: getEnv("SLACK_BRIEF_DM_USER_ID"),
    },
    smtp: {
      host: getEnv("SMTP_HOST"),
      port: getIntEnv("SMTP_PORT"),
      secure: getBooleanEnv("SMTP_SECURE", false),
      user: getEnv("SMTP_USER"),
      pass: getEnv("SMTP_PASS"),
      from: getEnv("EMAIL_FROM"),
      replyTo: getEnv("EMAIL_REPLY_TO"),
    },
  };
}

export function resolveRunMode(input?: string): RunMode {
  if (!input) {
    return "live";
  }

  if (input === "dry-run" || input === "persist-only" || input === "live") {
    return input;
  }

  throw new Error(`Unsupported run mode: ${input}`);
}
