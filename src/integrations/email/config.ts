export interface GmailSmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
}

export interface EmailDeliveryReadiness {
  smtpTransport: {
    configured: boolean;
    missing: string[];
  };
  fromAddress: {
    configured: boolean;
    value?: string;
    missing: string[];
  };
  escalationRecipients: {
    configured: boolean;
    value: string[];
    missing: string[];
  };
}

export function getGmailSmtpConfig(): GmailSmtpConfig {
  const user = requireEnv("SMTP_USER");
  const pass = requireEnv("SMTP_PASS");
  const host = readEnv("SMTP_HOST") ?? "smtp.gmail.com";
  const port = parsePort(readEnv("SMTP_PORT")) ?? 465;
  const secure = parseBoolean(readEnv("SMTP_SECURE")) ?? port === 465;
  const parsedFrom = parseFromAddress(readEnv("EMAIL_FROM"));
  const fromEmail = parsedFrom.email ?? readEnv("SMTP_FROM_EMAIL") ?? user;
  const fromName = parsedFrom.name ?? readEnv("SMTP_FROM_NAME") ?? "Central Agent";
  const replyTo = readEnv("EMAIL_REPLY_TO") ?? readEnv("SMTP_REPLY_TO");

  return {
    host,
    port,
    secure,
    user,
    pass,
    fromEmail,
    fromName,
    replyTo,
  };
}

export function getEmailDeliveryReadiness(): EmailDeliveryReadiness {
  const smtpUser = readEnv("SMTP_USER");
  const smtpPass = readEnv("SMTP_PASS");
  const fromEmail = parseFromAddress(readEnv("EMAIL_FROM")).email ?? readEnv("SMTP_FROM_EMAIL") ?? smtpUser;
  const escalationRecipients = getEscalationEmailRecipients();

  return {
    smtpTransport: {
      configured: Boolean(smtpUser && smtpPass),
      missing: collectMissing({
        SMTP_USER: smtpUser,
        SMTP_PASS: smtpPass,
      }),
    },
    fromAddress: {
      configured: Boolean(fromEmail),
      value: fromEmail,
      missing: fromEmail ? [] : ["EMAIL_FROM or SMTP_FROM_EMAIL or SMTP_USER"],
    },
    escalationRecipients: {
      configured: escalationRecipients.length > 0,
      value: escalationRecipients,
      missing: escalationRecipients.length > 0 ? [] : ["EMAIL_ESCALATION_TO"],
    },
  };
}

export function getMissingEmailEnv(): string[] {
  return getEmailDeliveryReadiness().smtpTransport.missing;
}

export function getEscalationEmailRecipients(): string[] {
  return parseCsv(readEnv("EMAIL_ESCALATION_TO"));
}

export function getDryRunEmailRecipient(): string | undefined {
  return readEnv("DRY_RUN_EMAIL_TO") ?? readEnv("SMTP_USER");
}

function collectMissing(values: Record<string, string | undefined>): string[] {
  return Object.entries(values)
    .filter(([, value]) => !value)
    .map(([name]) => name);
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (!value) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
}

function parseCsv(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parsePort(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const port = Number.parseInt(value, 10);

  return Number.isFinite(port) ? port : undefined;
}

function parseFromAddress(value: string | undefined): { email?: string; name?: string } {
  if (!value) {
    return {};
  }

  const match = value.match(/^(.*?)<([^>]+)>$/);
  if (!match) {
    return { email: value };
  }

  return {
    name: match[1].trim().replace(/^"|"$/g, "") || undefined,
    email: match[2].trim() || undefined,
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
