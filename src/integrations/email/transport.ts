import nodemailer from "nodemailer";

import { getGmailSmtpConfig, type GmailSmtpConfig } from "./config.js";

export interface EmailMessage {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  headers?: Record<string, string>;
}

export interface EmailSendOptions {
  dryRun?: boolean;
  config?: GmailSmtpConfig;
}

export interface EmailSendResult {
  accepted: string[];
  rejected: string[];
  messageId?: string;
  envelope?: {
    from?: string;
    to?: string[];
  };
  dryRun: boolean;
  preview: EmailMessage;
}

export function createGmailSmtpTransport(config: GmailSmtpConfig = getGmailSmtpConfig()) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

export async function verifyGmailSmtpTransport(
  config: GmailSmtpConfig = getGmailSmtpConfig(),
): Promise<void> {
  const transporter = createGmailSmtpTransport(config);

  await transporter.verify();
}

export async function sendEmail(
  message: EmailMessage,
  options: EmailSendOptions = {},
): Promise<EmailSendResult> {
  if (options.dryRun) {
    return {
      accepted: normalizeAddresses(message.to),
      rejected: [],
      dryRun: true,
      preview: message,
    };
  }

  const config = options.config ?? getGmailSmtpConfig();
  const transporter = createGmailSmtpTransport(config);
  const info = await transporter.sendMail({
    from: formatFrom(config),
    to: message.to,
    cc: message.cc,
    bcc: message.bcc,
    replyTo: message.replyTo ?? config.replyTo,
    subject: message.subject,
    text: message.text,
    html: message.html,
    headers: message.headers,
  });

  return {
    accepted: normalizeAddresses(info.accepted),
    rejected: normalizeAddresses(info.rejected),
    messageId: info.messageId,
    envelope: info.envelope,
    dryRun: false,
    preview: message,
  };
}

function formatFrom(config: GmailSmtpConfig): string {
  return config.fromName ? `${config.fromName} <${config.fromEmail}>` : config.fromEmail;
}

function normalizeAddresses(value: string | string[] | undefined): string[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}
