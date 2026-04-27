import {
  getMissingSlackDeliveryEnv,
  getSlackDeliveryReadiness,
  verifySlackDelivery,
} from "../src/integrations/slack/index.js";

const missing = getMissingSlackDeliveryEnv();
const readiness = getSlackDeliveryReadiness();

if (missing.length > 0) {
  console.error(`Missing required Slack env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const verification = await verifySlackDelivery();

console.log(`Slack auth ok for team ${verification.auth.team} as ${verification.auth.user}.`);
console.log(
  `Escalation channel ok: ${verification.escalationChannel.name ?? verification.escalationChannel.id}`,
);

if (verification.dailyBriefDmUser) {
  console.log(
    `Daily brief DM ok: ${verification.dailyBriefDmUser.realName ?? verification.dailyBriefDmUser.username ?? verification.dailyBriefDmUser.id}`,
  );
} else if (readiness.dailyBriefDmUser.configured) {
  console.log("Daily brief DM route configured but could not be verified.");
} else {
  console.log(
    "Daily brief DM route not configured. Set SLACK_BRIEF_DM_USER_ID, DAILY_BRIEF_SLACK_USER_ID, or SLACK_DM_USER_ID to verify DMs.",
  );
}
