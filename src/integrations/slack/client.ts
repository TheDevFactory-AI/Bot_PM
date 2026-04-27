import { WebClient } from "@slack/web-api";

import { getSlackDeliveryConfig } from "./config.js";

export function createSlackClient(): WebClient {
  const config = getSlackDeliveryConfig();

  return new WebClient(config.botToken);
}

export async function openSlackDirectMessageChannel(
  client: WebClient,
  userId: string,
): Promise<string> {
  const result = await client.conversations.open({
    users: userId,
  });

  const channelId = result.channel?.id;

  if (!channelId) {
    throw new Error(`Slack did not return a DM channel for user ${userId}`);
  }

  return channelId;
}
