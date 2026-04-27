import {
  getEmailDeliveryReadiness,
  getGmailSmtpConfig,
  getMissingEmailEnv,
  verifyEmailDelivery,
} from "../src/integrations/email/index.js";

const missing = getMissingEmailEnv();
const readiness = getEmailDeliveryReadiness();

if (missing.length > 0) {
  console.error(`Missing required email env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const verification = await verifyEmailDelivery(getGmailSmtpConfig());

console.log(
  `SMTP auth ok: ${verification.user} via ${verification.host}:${verification.port} secure=${verification.secure}.`,
);
console.log(`From address: ${verification.fromEmail}`);

if (verification.escalationRecipients.length > 0) {
  console.log(`Escalation recipients: ${verification.escalationRecipients.join(", ")}`);
} else {
  console.log(
    `Escalation recipients not configured. Set ${readiness.escalationRecipients.missing.join(" or ")} once People Directory fan-out is wired.`,
  );
}

if (verification.dryRunRecipient) {
  console.log(`Dry-run email recipient: ${verification.dryRunRecipient}`);
}
