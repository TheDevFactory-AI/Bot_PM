import {
  getDryRunEmailRecipient,
  renderEscalationEmail,
  sendEscalationEmail,
} from "../src/integrations/email/index.js";
import {
  deliverSlackDailyBrief,
  deliverSlackEscalation,
  deliverSlackStatusNudge,
  renderSlackDailyBrief,
  renderSlackEscalationSummary,
  renderSlackStatusNudge,
} from "../src/integrations/slack/index.js";

const args = new Set(process.argv.slice(2));
const shouldSendSlackChannel = args.has("--send-slack-channel");
const shouldSendSlackDm = args.has("--send-slack-dm");
const shouldSendEmail = args.has("--send-email");

const now = new Date();

const dailyBrief = {
  sprintName: "Sprint 14",
  generatedAt: now,
  sprintSnapshot: [
    "11 active items in the sprint",
    "3 items due within 1 business day",
    "1 hard-blocked item and 2 soft blockers linked to active sprint work",
  ],
  topPriorities: [
    "P0 - Ship billing fix for Acme renewal",
    "P1 - Close demo auth gap before Tuesday walkthrough",
    "P1 - Stabilize import retries for pilot accounts",
    "P2 - Document rollout steps for support handoff",
    "P2 - Confirm QA plan for usage dashboard",
    "P3 - This item should be capped",
  ],
  explicitBlockers: [
    "Billing sync fix is blocked on upstream API contract",
    "Demo seed data job is still failing in CI",
  ],
  dueSoon: [
    "Billing sync fix due Apr 28",
    "Usage dashboard QA due Apr 29",
  ],
  staleItems: [
    "Import retry cleanup has had no meaningful update for 2 business days",
  ],
  softBlockers: [
    "Pilot users still cannot self-serve CSV retries",
  ],
  demoReadiness: [
    "Status: At Risk",
    "1 demo-scope item missing tests",
    "GitHub CI mirrored state: Passing",
  ],
};

const escalationInput = {
  generatedAt: now,
  items: [
    {
      workItemName: "Billing sync fix",
      ownerName: "Ari",
      status: "Blocked",
      dueDate: "2026-04-28",
      priorityCycleName: "Sprint 14",
      escalatedReason: "Third unresolved nudge after 4 business days without meaningful change",
      latestBotNote: "Waiting on API contract update from external dependency",
      notionUrl: "https://www.notion.so/example-billing-sync-fix",
    },
    {
      workItemName: "Demo auth gap",
      ownerName: "Mina",
      status: "In Progress",
      dueDate: "2026-04-29",
      priorityCycleName: "Sprint 14",
      escalatedReason: "Due within 1 business day and unchanged since immediate DM",
      latestBotNote: "No owner comment since compressed-cadence reminder",
      notionUrl: "https://www.notion.so/example-demo-auth-gap",
    },
  ],
};

const nudgeInput = {
  workItemName: "Billing sync fix",
  ownerName: "Ari",
  status: "Blocked",
  dueDate: "2026-04-28",
  priorityCycleName: "Sprint 14",
  reason: "No meaningful update for 2 business days",
  latestBotNote: "Dependency is still unresolved",
  notionUrl: "https://www.notion.so/example-billing-sync-fix",
};

console.log("Slack daily brief preview:");
console.log(renderSlackDailyBrief(dailyBrief));
console.log("");
console.log("Slack escalation preview:");
console.log(renderSlackEscalationSummary(escalationInput));
console.log("");
console.log("Slack nudge preview:");
console.log(renderSlackStatusNudge(nudgeInput));
console.log("");
console.log("Escalation email preview:");
const renderedEmail = renderEscalationEmail(escalationInput);
console.log(`Subject: ${renderedEmail.subject}`);
console.log(renderedEmail.text);

if (shouldSendSlackChannel) {
  const result = await deliverSlackEscalation(escalationInput);
  console.log("");
  console.log(`Sent Slack escalation to ${result.targetId} at ${result.ts}.`);

  const briefResults = await deliverSlackDailyBrief(dailyBrief);
  for (const briefResult of briefResults) {
    console.log(`Sent Slack daily brief to ${briefResult.mode} ${briefResult.targetId} at ${briefResult.ts}.`);
  }
}

if (shouldSendSlackDm) {
  const dmUserId =
    process.env.SLACK_BRIEF_DM_USER_ID?.trim() ??
    process.env.DAILY_BRIEF_SLACK_USER_ID?.trim() ??
    process.env.SLACK_DM_USER_ID?.trim();

  if (!dmUserId) {
    throw new Error(
      "Set SLACK_BRIEF_DM_USER_ID, DAILY_BRIEF_SLACK_USER_ID, or SLACK_DM_USER_ID before using --send-slack-dm.",
    );
  }

  const result = await deliverSlackStatusNudge(dmUserId, nudgeInput);
  console.log("");
  console.log(`Sent Slack DM to ${result.targetId} at ${result.ts}.`);
}

if (shouldSendEmail) {
  const dryRunRecipient = getDryRunEmailRecipient();

  if (!dryRunRecipient) {
    throw new Error("Set DRY_RUN_EMAIL_TO or SMTP_USER before using --send-email.");
  }

  const result = await sendEscalationEmail(escalationInput, {
    to: [dryRunRecipient],
  });

  console.log("");
  console.log(`Sent escalation email to ${result.accepted.join(", ")} with message id ${result.messageId}.`);
}
