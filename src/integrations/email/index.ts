export {
  getDryRunEmailRecipient,
  getEmailDeliveryReadiness,
  getEscalationEmailRecipients,
  getGmailSmtpConfig,
  getMissingEmailEnv,
  type EmailDeliveryReadiness,
  type GmailSmtpConfig,
} from "./config.js";
export {
  renderEscalationEmail,
  type EscalationEmailItem,
  type EscalationEmailRenderInput,
  type RenderedEmail,
} from "./render.js";
export {
  createGmailSmtpTransport,
  sendEmail,
  verifyGmailSmtpTransport,
  type EmailMessage,
  type EmailSendOptions,
  type EmailSendResult,
} from "./transport.js";
export {
  sendEscalationEmail,
  verifyEmailDelivery,
  type EmailVerificationResult,
  type EscalationEmailDeliveryOptions,
} from "./delivery.js";
