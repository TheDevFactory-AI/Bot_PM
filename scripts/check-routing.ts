import { getConnectorReadiness } from "../src/config/env.js";
import { getEmailDeliveryReadiness } from "../src/integrations/email/index.js";
import { createPhase1NotionRepositories, getPhase1NotionConfig } from "../src/integrations/notion/index.js";
import { getSlackDeliveryReadiness } from "../src/integrations/slack/index.js";

const connectorReadiness = getConnectorReadiness();
const slackReadiness = getSlackDeliveryReadiness();
const emailReadiness = getEmailDeliveryReadiness();
const repositories = createPhase1NotionRepositories(getPhase1NotionConfig());
const people = (await repositories.peopleDirectory.list({ activeOnly: true, pageSize: 200 })).items;

console.log("Connector readiness:");
for (const [name, details] of Object.entries(connectorReadiness)) {
  console.log(`- ${name}: ${details.configured ? "configured" : `missing ${details.missing.join(", ")}`}`);
}

console.log("");
console.log(`Active people in directory: ${people.length}`);
console.log(`Missing Slack ID: ${people.filter((person) => !person.slackId).length}`);
console.log(`Missing email: ${people.filter((person) => !person.email).length}`);

console.log("");
console.log("Slack routing:");
console.log(
  `- bot token: ${slackReadiness.botToken.configured ? "configured" : `missing ${slackReadiness.botToken.missing.join(", ")}`}`,
);
console.log(
  `- escalation channel: ${
    slackReadiness.escalationChannel.configured
      ? slackReadiness.escalationChannel.value
      : `missing ${slackReadiness.escalationChannel.missing.join(", ")}`
  }`,
);
console.log(
  `- daily brief DM: ${
    slackReadiness.dailyBriefDmUser.configured
      ? slackReadiness.dailyBriefDmUser.value
      : `optional, set ${slackReadiness.dailyBriefDmUser.missing.join(" or ")}`
  }`,
);

console.log("");
console.log("Email routing:");
console.log(
  `- smtp transport: ${
    emailReadiness.smtpTransport.configured
      ? "configured"
      : `missing ${emailReadiness.smtpTransport.missing.join(", ")}`
  }`,
);
console.log(
  `- from address: ${
    emailReadiness.fromAddress.configured
      ? emailReadiness.fromAddress.value
      : `missing ${emailReadiness.fromAddress.missing.join(", ")}`
  }`,
);
console.log(
  `- escalation recipients: ${
    emailReadiness.escalationRecipients.configured
      ? emailReadiness.escalationRecipients.value.join(", ")
      : `pending People Directory fan-out or ${emailReadiness.escalationRecipients.missing.join(", ")}`
  }`,
);
