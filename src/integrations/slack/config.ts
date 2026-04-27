export interface SlackDeliveryConfig {
  botToken: string;
  escalationChannelId: string;
  dailyBriefDmUserId?: string;
}

export interface SlackRouteReadiness {
  configured: boolean;
  value?: string;
  missing: string[];
}

export interface SlackDeliveryReadiness {
  botToken: SlackRouteReadiness;
  escalationChannel: SlackRouteReadiness;
  dailyBriefDmUser: SlackRouteReadiness;
}

const DEFAULT_ESCALATION_CHANNEL_ENV = "SLACK_CHANNEL_ID";
const ESCALATION_CHANNEL_ENV = "SLACK_ESCALATION_CHANNEL_ID";
const PRIMARY_DAILY_BRIEF_DM_ENV = "SLACK_BRIEF_DM_USER_ID";
const DAILY_BRIEF_DM_ENV = "DAILY_BRIEF_SLACK_USER_ID";
const FALLBACK_DM_ENV = "SLACK_DM_USER_ID";

export function getSlackDeliveryConfig(): SlackDeliveryConfig {
  const botToken = requireEnv("SLACK_BOT_TOKEN");
  const escalationChannelId =
    readEnv(ESCALATION_CHANNEL_ENV) ?? requireEnv(DEFAULT_ESCALATION_CHANNEL_ENV);
  const dailyBriefDmUserId =
    readEnv(PRIMARY_DAILY_BRIEF_DM_ENV) ?? readEnv(DAILY_BRIEF_DM_ENV) ?? readEnv(FALLBACK_DM_ENV);

  return {
    botToken,
    escalationChannelId,
    dailyBriefDmUserId,
  };
}

export function getSlackDeliveryReadiness(): SlackDeliveryReadiness {
  const botToken = readEnv("SLACK_BOT_TOKEN");
  const explicitEscalationChannel = readEnv(ESCALATION_CHANNEL_ENV);
  const fallbackEscalationChannel = readEnv(DEFAULT_ESCALATION_CHANNEL_ENV);
  const dailyBriefDmUserId =
    readEnv(PRIMARY_DAILY_BRIEF_DM_ENV) ?? readEnv(DAILY_BRIEF_DM_ENV) ?? readEnv(FALLBACK_DM_ENV);

  return {
    botToken: summarizeRoute(botToken, ["SLACK_BOT_TOKEN"]),
    escalationChannel: summarizeRoute(explicitEscalationChannel ?? fallbackEscalationChannel, [
      `${ESCALATION_CHANNEL_ENV} or ${DEFAULT_ESCALATION_CHANNEL_ENV}`,
    ]),
    dailyBriefDmUser: summarizeRoute(dailyBriefDmUserId, [
      PRIMARY_DAILY_BRIEF_DM_ENV,
      DAILY_BRIEF_DM_ENV,
      FALLBACK_DM_ENV,
    ]),
  };
}

export function getMissingSlackDeliveryEnv(): string[] {
  const readiness = getSlackDeliveryReadiness();

  return [
    ...readiness.botToken.missing,
    ...readiness.escalationChannel.missing,
  ];
}

function summarizeRoute(value: string | undefined, missing: string[]): SlackRouteReadiness {
  return {
    configured: Boolean(value),
    value,
    missing: value ? [] : missing,
  };
}

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();

  return value ? value : undefined;
}

function requireEnv(name: string): string {
  const value = readEnv(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
