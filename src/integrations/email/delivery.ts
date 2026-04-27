import {
  getDryRunEmailRecipient,
  getEscalationEmailRecipients,
  getGmailSmtpConfig,
  type GmailSmtpConfig,
} from "./config.js";
import {
  renderEscalationEmail,
  type EscalationEmailRenderInput,
  type RenderedEmail,
} from "./render.js";
import {
  sendEmail,
  verifyGmailSmtpTransport,
  type EmailSendOptions,
  type EmailSendResult,
} from "./transport.js";

export interface EscalationEmailDeliveryOptions extends EmailSendOptions {
  to?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  headers?: Record<string, string>;
}

export interface EmailVerificationResult {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  fromEmail: string;
  dryRunRecipient?: string;
  escalationRecipients: string[];
}

export async function sendEscalationEmail(
  input: EscalationEmailRenderInput,
  options: EscalationEmailDeliveryOptions = {},
): Promise<EmailSendResult & { rendered: RenderedEmail }> {
  const rendered = renderEscalationEmail(input);
  const recipients = options.to ?? getEscalationEmailRecipients();

  if ((Array.isArray(recipients) ? recipients.length === 0 : !recipients)) {
    throw new Error("No escalation email recipients configured. Set EMAIL_ESCALATION_TO or pass to.");
  }

  const result = await sendEmail(
    {
      to: recipients,
      cc: options.cc,
      bcc: options.bcc,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
      headers: options.headers,
    },
    options,
  );

  return {
    ...result,
    rendered,
  };
}

export async function verifyEmailDelivery(
  config: GmailSmtpConfig = getGmailSmtpConfig(),
): Promise<EmailVerificationResult> {
  await verifyGmailSmtpTransport(config);

  return {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.user,
    fromEmail: config.fromEmail,
    dryRunRecipient: getDryRunEmailRecipient(),
    escalationRecipients: getEscalationEmailRecipients(),
  };
}
