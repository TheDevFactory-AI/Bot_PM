import { describe, expect, it } from "vitest";

import { peopleDirectoryCodec, workItemCodec } from "./propertyCodec.js";
import type { NotionPage, NotionPagePropertyValue } from "./types.js";

describe("workItemCodec compatibility", () => {
  it("decodes a live-shaped work item page", () => {
    const page = pageWithProperties({
      "Bug Title": title("Demo handoff"),
      Status: status("testing"),
      Owner: relation(["person-page-1"]),
      "Week of": date("2026-05-01"),
      "Completed At": date(null),
      "Priority Cycle": relation(["cycle-page-1"]),
      "Customer Impact": formulaNumber(5),
      "Revenue Impact": number(3),
      "Demo Impact": number(4),
      Criticality: formulaNumber(5),
      Effort: number(2),
      "Blocked State": select("Blocked - Dependency"),
      "Depends On": relation(["dependency-page-1"]),
      "QA Present": checkbox(true),
      "Tests Present": checkbox(false),
      priority: select("High"),
      "Demo Scope": checkbox(true),
      "Last Activity Source": select("Bot"),
      "Latest Bot Note": richText("Priority refreshed from nightly run."),
      "Bot History URL": url("https://example.test/bot-runs/run-1"),
      "Computed Hard Blocked": formulaBoolean(true),
      "Priority Score": formulaNumber(86),
      "Priority Recommendation": select("P0"),
      "Priority Needs Review": formulaBoolean(false),
      "Priority Missing Inputs": formulaString(""),
      "Status Nudge Eligible": formulaBoolean(true),
      Customers: relation(["customer-page-1"]),
      Conversations: relation(["conversation-page-1"]),
      Signals: relation(["signal-page-1"]),
      Briefs: relation(["brief-page-1"]),
      "Completed On Time": formulaBoolean(null),
      "Ready Evidence Present": formulaBoolean(true),
      "Created At": createdTime("2026-04-20T10:00:00.000Z"),
      "Updated At": lastEditedTime("2026-04-21T11:00:00.000Z"),
    });

    expect(workItemCodec.decode(page)).toEqual({
      pageId: "page-work-item-1",
      notionUrl: "https://notion.test/page-work-item-1",
      createdAt: "2026-04-20T10:00:00.000Z",
      updatedAt: "2026-04-21T11:00:00.000Z",
      archived: false,
      name: "Demo handoff",
      workItemId: "page-work-item-1",
      status: "In Review",
      ownerIds: ["person-page-1"],
      dueDate: null,
      completedAt: null,
      priorityCyclePageIds: ["cycle-page-1"],
      customerImpact: 5,
      revenueImpact: 3,
      demoImpact: 4,
      criticality: 5,
      effort: 2,
      blockedState: "Blocked - Dependency",
      dependsOnPageIds: ["dependency-page-1"],
      qaPresent: true,
      testsPresent: false,
      confirmedPriority: "P1",
      demoScope: true,
      lastActivitySource: "Bot",
      latestBotNote: "Priority refreshed from nightly run.",
      botHistoryUrl: "https://example.test/bot-runs/run-1",
      computedHardBlocked: true,
      priorityScore: 86,
      priorityRecommendation: "P0",
      priorityNeedsReview: false,
      priorityMissingInputs: "",
      statusNudgeEligible: true,
      customerPageIds: ["customer-page-1"],
      conversationPageIds: ["conversation-page-1"],
      signalPageIds: ["signal-page-1"],
      briefPageIds: ["brief-page-1"],
      completedOnTime: null,
      readyEvidencePresent: true,
    });
  });

  it("encodes every bot-owned work item update field", () => {
    expect(
      workItemCodec.encodeUpdate({
        lastActivitySource: "Bot",
        latestBotNote: "Recomputed priority and blocker state.",
        botHistoryUrl: "https://example.test/bot-runs/run-2",
        computedHardBlocked: false,
        priorityScore: 72,
        priorityRecommendation: "P1",
        priorityNeedsReview: true,
        priorityMissingInputs: "Customer Impact",
        statusNudgeEligible: false,
        updatedAt: "2026-04-22T12:00:00.000Z",
      }),
    ).toEqual({
      "Last Activity Source": { select: { name: "Bot" } },
      "Latest Bot Note": {
        rich_text: [textObject("Recomputed priority and blocker state.")],
      },
      "Bot History URL": { url: "https://example.test/bot-runs/run-2" },
      "Computed Hard Blocked": { checkbox: false },
      "Priority Score": { number: 72 },
      "Priority Recommendation": { select: { name: "P1" } },
      "Priority Needs Review": { checkbox: true },
      "Priority Missing Inputs": {
        rich_text: [textObject("Customer Impact")],
      },
      "Status Nudge Eligible": { checkbox: false },
      "Updated At": {
        date: {
          start: "2026-04-22T12:00:00.000Z",
          end: null,
          time_zone: null,
        },
      },
    });
  });

  it("fails when required page properties have incompatible types", () => {
    const page = pageWithProperties({
      Name: richText("Wrong shape"),
      "Work Item ID": richText("WI-124"),
    });

    expect(() => workItemCodec.decode(page)).toThrow(
      'Expected title property "Name" or "Bug Title" on page page-work-item-1',
    );
  });
});

describe("peopleDirectoryCodec compatibility", () => {
  it("reads team from live Department when Team is absent", () => {
    const page = pageWithProperties({
      Name: title("Ada Lovelace"),
      Active: checkbox(true),
      "Slack ID": richText("U123"),
      Email: email("ada@example.test"),
      Department: select("Engineering"),
    });

    expect(peopleDirectoryCodec.decode(page)).toMatchObject({
      name: "Ada Lovelace",
      active: true,
      slackId: "U123",
      email: "ada@example.test",
      team: "Engineering",
    });
  });
});

function pageWithProperties(properties: NotionPage["properties"]): NotionPage {
  return {
    object: "page",
    id: "page-work-item-1",
    url: "https://notion.test/page-work-item-1",
    archived: false,
    created_time: "2026-04-19T09:00:00.000Z",
    last_edited_time: "2026-04-19T10:00:00.000Z",
    parent: {
      type: "database_id",
      database_id: "database-work-items",
    },
    properties,
  };
}

function title(content: string): NotionPagePropertyValue {
  return {
    id: propertyId("title"),
    type: "title",
    title: [{ plain_text: content }],
  };
}

function richText(content: string): NotionPagePropertyValue {
  return {
    id: propertyId("rich-text"),
    type: "rich_text",
    rich_text: content ? [{ plain_text: content }] : [],
  };
}

function select(name: string | null): NotionPagePropertyValue {
  return {
    id: propertyId("select"),
    type: "select",
    select: name ? { name } : null,
  };
}

function status(name: string | null): NotionPagePropertyValue {
  return {
    id: propertyId("status"),
    type: "status",
    status: name ? { name } : null,
  };
}

function number(value: number | null): NotionPagePropertyValue {
  return {
    id: propertyId("number"),
    type: "number",
    number: value,
  };
}

function checkbox(value: boolean): NotionPagePropertyValue {
  return {
    id: propertyId("checkbox"),
    type: "checkbox",
    checkbox: value,
  };
}

function url(value: string | null): NotionPagePropertyValue {
  return {
    id: propertyId("url"),
    type: "url",
    url: value,
  };
}

function email(value: string | null): NotionPagePropertyValue {
  return {
    id: propertyId("email"),
    type: "email",
    email: value,
  };
}

function date(start: string | null): NotionPagePropertyValue {
  return {
    id: propertyId("date"),
    type: "date",
    date: start ? { start, end: null, time_zone: null } : null,
  };
}

function relation(ids: string[]): NotionPagePropertyValue {
  return {
    id: propertyId("relation"),
    type: "relation",
    relation: ids.map((id) => ({ id })),
  };
}

function formulaString(value: string | null): NotionPagePropertyValue {
  return {
    id: propertyId("formula-string"),
    type: "formula",
    formula: {
      type: "string",
      string: value,
    },
  };
}

function formulaNumber(value: number | null): NotionPagePropertyValue {
  return {
    id: propertyId("formula-number"),
    type: "formula",
    formula: {
      type: "number",
      number: value,
    },
  };
}

function formulaBoolean(value: boolean | null): NotionPagePropertyValue {
  return {
    id: propertyId("formula-boolean"),
    type: "formula",
    formula: {
      type: "boolean",
      boolean: value,
    },
  };
}

function createdTime(value: string): NotionPagePropertyValue {
  return {
    id: propertyId("created-time"),
    type: "created_time",
    created_time: value,
  };
}

function lastEditedTime(value: string): NotionPagePropertyValue {
  return {
    id: propertyId("last-edited-time"),
    type: "last_edited_time",
    last_edited_time: value,
  };
}

function textObject(content: string): Record<string, unknown> {
  return {
    type: "text",
    text: {
      content,
    },
  };
}

function propertyId(name: string): string {
  return `prop-${name}`;
}
