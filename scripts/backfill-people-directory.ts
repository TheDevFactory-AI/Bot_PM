import { WebClient } from "@slack/web-api";

import {
  getPhase1NotionConfig,
  NotionClient,
  type NotionPage,
  type NotionPageWriteProperties,
} from "../src/integrations/notion/index.js";

type BackfillMode = "dry-run" | "apply";

interface SlackMember {
  id?: string;
  name?: string;
  deleted?: boolean;
  is_bot?: boolean;
  profile?: {
    display_name?: string;
    display_name_normalized?: string;
    real_name?: string;
    real_name_normalized?: string;
  };
}

interface BackfillReportItem {
  pageId: string;
  name: string;
  email: string | null;
  slackName: string;
  updates: string[];
  slackLookup?: "matched" | "unmatched" | "ambiguous" | "skipped";
  matchedSlackId?: string;
  candidates?: string[];
}

const mode = parseMode(process.argv.slice(2));
const mutationAllowed = process.env.NOTION_ALLOW_PEOPLE_BACKFILL === "true";
const config = getPhase1NotionConfig();
const notion = NotionClient.fromConfig(config);
const slackUsers = await loadSlackUsers().catch((error) => {
  console.warn(
    `Skipping Slack ID lookup: ${error instanceof Error ? error.message : String(error)}`,
  );
  return null;
});
const report: BackfillReportItem[] = [];
let applied = 0;

for await (const page of notion.iterateDatabase({
  databaseId: config.databases.peopleDirectory,
  pageSize: 100,
})) {
  const email = getEmail(page, "Email");
  const department = getSelect(page, "Department");
  const team = getSelect(page, "Team");
  const slackName = getRichText(page, "Slack Name").trim();
  const slackId = getRichText(page, "Slack ID").trim();
  const properties: NotionPageWriteProperties = {};
  const updates: string[] = [];
  let slackLookup: BackfillReportItem["slackLookup"];
  let matchedSlackId: string | undefined;
  let candidates: string[] | undefined;

  if (email && !getCheckbox(page, "Active")) {
    properties.Active = { checkbox: true };
    updates.push("Active");
  }

  if (department && team !== department) {
    properties.Team = { select: { name: department } };
    updates.push("Team");
  }

  if (!slackId && slackName) {
    if (slackUsers) {
      const matches = findSlackMatches(slackUsers, slackName);
      if (matches.length === 1 && matches[0]?.id) {
        matchedSlackId = matches[0].id;
        properties["Slack ID"] = {
          rich_text: [textObject(matchedSlackId)],
        };
        updates.push("Slack ID");
        slackLookup = "matched";
      } else if (matches.length > 1) {
        slackLookup = "ambiguous";
        candidates = matches
          .map((member) => member.id)
          .filter((id): id is string => Boolean(id));
      } else {
        slackLookup = "unmatched";
      }
    } else {
      slackLookup = "skipped";
    }
  }

  if (updates.length > 0 && mode === "apply" && mutationAllowed) {
    await notion.updatePage({
      pageId: page.id,
      properties,
    });
    applied += 1;
  }

  if (
    updates.length > 0 ||
    slackLookup === "ambiguous" ||
    slackLookup === "unmatched" ||
    slackLookup === "skipped"
  ) {
    report.push({
      pageId: page.id,
      name: getTitle(page, "Name"),
      email,
      slackName,
      updates,
      slackLookup,
      matchedSlackId,
      candidates,
    });
  }
}

console.log(
  JSON.stringify(
    {
      mode,
      mutationAllowed,
      slackLookupAvailable: Boolean(slackUsers),
      rowsWithChangesOrSlackIssues: report.length,
      applied,
      report,
    },
    null,
    2,
  ),
);

if (mode === "apply" && !mutationAllowed) {
  console.error(
    "Refusing to backfill People Directory: set NOTION_ALLOW_PEOPLE_BACKFILL=true with --mode=apply.",
  );
  process.exitCode = 1;
}

function parseMode(args: string[]): BackfillMode {
  const modeFlag = args.find((argument) => argument.startsWith("--mode="));
  const value = modeFlag?.split("=")[1];

  if (value === undefined || value === "dry-run") {
    return "dry-run";
  }

  if (value === "apply") {
    return "apply";
  }

  throw new Error(`Unsupported backfill mode: ${value}`);
}

async function loadSlackUsers(): Promise<SlackMember[] | null> {
  const token = process.env.SLACK_BOT_TOKEN?.trim();

  if (!token) {
    return null;
  }

  const client = new WebClient(token);
  const members: SlackMember[] = [];
  let cursor: string | undefined;

  do {
    const result = await client.users.list({
      cursor,
      limit: 200,
    });
    members.push(...((result.members ?? []) as SlackMember[]));
    cursor = result.response_metadata?.next_cursor || undefined;
  } while (cursor);

  return members.filter((member) => !member.deleted && !member.is_bot && member.id);
}

function findSlackMatches(members: SlackMember[], slackName: string): SlackMember[] {
  const needle = normalizeSlackName(slackName);

  if (!needle) {
    return [];
  }

  return members.filter((member) =>
    slackMemberAliases(member).some((alias) => normalizeSlackName(alias) === needle),
  );
}

function slackMemberAliases(member: SlackMember): string[] {
  return [
    member.id,
    member.name,
    member.profile?.display_name,
    member.profile?.display_name_normalized,
    member.profile?.real_name,
    member.profile?.real_name_normalized,
  ].filter((value): value is string => Boolean(value));
}

function normalizeSlackName(value: string): string {
  return value.trim().replace(/^@/, "").toLowerCase();
}

function getTitle(page: NotionPage, name: string): string {
  const property = page.properties[name];

  if (!property || property.type !== "title") {
    return "";
  }

  return property.title.map((item) => item.plain_text).join("");
}

function getRichText(page: NotionPage, name: string): string {
  const property = page.properties[name];

  if (!property || property.type !== "rich_text") {
    return "";
  }

  return property.rich_text.map((item) => item.plain_text).join("");
}

function getEmail(page: NotionPage, name: string): string | null {
  const property = page.properties[name];

  if (!property || property.type !== "email") {
    return null;
  }

  return property.email;
}

function getSelect(page: NotionPage, name: string): string | null {
  const property = page.properties[name];

  if (!property || property.type !== "select") {
    return null;
  }

  return property.select?.name ?? null;
}

function getCheckbox(page: NotionPage, name: string): boolean {
  const property = page.properties[name];

  if (!property || property.type !== "checkbox") {
    return false;
  }

  return property.checkbox;
}

function textObject(content: string): Record<string, unknown> {
  return {
    type: "text",
    text: {
      content,
    },
  };
}
