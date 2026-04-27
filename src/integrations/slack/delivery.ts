import type { ChatPostMessageResponse, WebClient } from "@slack/web-api";

import { createSlackClient, openSlackDirectMessageChannel } from "./client.js";
import { getSlackDeliveryConfig } from "./config.js";
import {
  renderSlackDailyBrief,
  renderSlackEscalationSummary,
  renderSlackStatusNudge,
  type SlackDailyBriefInput,
  type SlackEscalationSummaryInput,
  type SlackStatusNudgeInput,
} from "./render.js";

export interface SlackSendOptions {
  dryRun?: boolean;
  threadTs?: string;
}

export interface SlackSendResult {
  mode: "channel" | "dm";
  targetId: string;
  text: string;
  ts?: string;
  dryRun: boolean;
}

export interface SlackDeliveryVerification {
  auth: {
    team?: string;
    user?: string;
    botId?: string;
  };
  escalationChannel: {
    id: string;
    name?: string;
  };
  dailyBriefDmUser?: {
    id: string;
    username?: string;
    realName?: string;
  };
}

export async function sendSlackChannelMessage(
  channelId: string,
  text: string,
  options: SlackSendOptions = {},
): Promise<SlackSendResult> {
  if (options.dryRun) {
    return {
      mode: "channel",
      targetId: channelId,
      text,
      dryRun: true,
    };
  }

  const client = createSlackClient();
  const response = await postSlackMessage(client, channelId, text, options.threadTs);

  return {
    mode: "channel",
    targetId: channelId,
    text,
    ts: response.ts,
    dryRun: false,
  };
}

export async function sendSlackDirectMessage(
  userId: string,
  text: string,
  options: SlackSendOptions = {},
): Promise<SlackSendResult> {
  if (options.dryRun) {
    return {
      mode: "dm",
      targetId: userId,
      text,
      dryRun: true,
    };
  }

  const client = createSlackClient();
  const channelId = await openSlackDirectMessageChannel(client, userId);
  const response = await postSlackMessage(client, channelId, text, options.threadTs);

  return {
    mode: "dm",
    targetId: userId,
    text,
    ts: response.ts,
    dryRun: false,
  };
}

export async function deliverSlackDailyBrief(
  input: SlackDailyBriefInput,
  options: SlackSendOptions = {},
): Promise<SlackSendResult[]> {
  const config = getSlackDeliveryConfig();
  const text = renderSlackDailyBrief(input);
  const results = [await sendSlackChannelMessage(config.escalationChannelId, text, options)];

  if (config.dailyBriefDmUserId) {
    results.unshift(await sendSlackDirectMessage(config.dailyBriefDmUserId, text, options));
  }

  return results;
}

export async function deliverSlackStatusNudge(
  userId: string,
  input: SlackStatusNudgeInput,
  options: SlackSendOptions = {},
): Promise<SlackSendResult> {
  return sendSlackDirectMessage(userId, renderSlackStatusNudge(input), options);
}

export async function deliverSlackEscalation(
  input: SlackEscalationSummaryInput,
  options: SlackSendOptions = {},
): Promise<SlackSendResult> {
  const config = getSlackDeliveryConfig();

  return sendSlackChannelMessage(
    config.escalationChannelId,
    renderSlackEscalationSummary(input),
    options,
  );
}

export async function verifySlackDelivery(): Promise<SlackDeliveryVerification> {
  const config = getSlackDeliveryConfig();
  const client = createSlackClient();
  const auth = await client.auth.test();
  const channel = await client.conversations.info({
    channel: config.escalationChannelId,
  });

  const verification: SlackDeliveryVerification = {
    auth: {
      team: auth.team,
      user: auth.user,
      botId: auth.bot_id,
    },
    escalationChannel: {
      id: config.escalationChannelId,
      name: channel.channel?.name,
    },
  };

  if (config.dailyBriefDmUserId) {
    const user = await client.users.info({
      user: config.dailyBriefDmUserId,
    });

    verification.dailyBriefDmUser = {
      id: config.dailyBriefDmUserId,
      username: user.user?.name,
      realName: user.user?.real_name,
    };
  }

  return verification;
}

async function postSlackMessage(
  client: WebClient,
  channel: string,
  text: string,
  threadTs?: string,
): Promise<ChatPostMessageResponse> {
  return client.chat.postMessage({
    channel,
    text,
    thread_ts: threadTs,
  });
}
