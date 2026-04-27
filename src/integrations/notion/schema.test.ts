import { describe, expect, it } from "vitest";

import {
  buildPhase1NotionSchemaSpecs,
  buildWorkItemsSchema,
  diffDatabaseSchema,
  diffNotionDatabaseSchema,
} from "./schema.js";
import type { Phase1NotionConfig } from "./config.js";
import type { NotionDatabase, NotionDatabasePropertySchema } from "./types.js";

describe("work item schema diff", () => {
  it("creates a patch for missing work item fields", () => {
    const diff = diffDatabaseSchema(databaseWithProperties({}), buildWorkItemsSchema(config));

    expect(diff.typeMismatches).toEqual([]);
    expect(diff.missing).toContain("Work Item ID");
    expect(diff.missing).toContain("Priority Score");
    expect(diff.patch["Work Item ID"]).toEqual({ rich_text: {} });
    expect(diff.patch["Priority Recommendation"]).toEqual({
      select: {
        options: [{ name: "P0" }, { name: "P1" }, { name: "P2" }, { name: "P3" }],
      },
    });
  });

  it("is a no-op when expected properties already exist with matching types", () => {
    const expected = buildWorkItemsSchema(config);
    const properties = Object.fromEntries(
      Object.entries(expected).map(([name, spec]) => [name, propertySchema(spec.type, spec.schema)]),
    );

    expect(diffDatabaseSchema(databaseWithProperties(properties), expected)).toEqual({
      missing: [],
      typeMismatches: [],
      patch: {},
    });
  });

  it("reports type mismatches without adding them to the patch", () => {
    const diff = diffDatabaseSchema(
      databaseWithProperties({
        "Priority Score": propertySchema("rich_text"),
      }),
      buildWorkItemsSchema(config),
    );

    expect(diff.typeMismatches).toEqual([
      { property: "Priority Score", expected: "number", actual: "rich_text" },
    ]);
    expect(diff.patch).not.toHaveProperty("Priority Score");
  });
});

describe("phase 1 notion schema specs", () => {
  it("includes missing live extension fields across bot-written databases", () => {
    const specs = buildPhase1NotionSchemaSpecs(config);
    const people = specs.find((spec) => spec.database === "peopleDirectory");
    const signals = specs.find((spec) => spec.database === "signals");
    const briefs = specs.find((spec) => spec.database === "briefs");
    const botRuns = specs.find((spec) => spec.database === "botRuns");

    expect(people?.specs.map((spec) => spec.name)).toEqual(["Active", "Slack ID", "Team"]);
    expect(signals?.specs.map((spec) => spec.name)).toContain("Priority Cycle");
    expect(briefs?.specs.map((spec) => spec.name)).toContain("Bot History URL");
    expect(botRuns?.specs.map((spec) => spec.name)).toContain("Target Row IDs");
  });

  it("reports type mismatches without treating them as missing", () => {
    const people = buildPhase1NotionSchemaSpecs(config).find(
      (spec) => spec.database === "peopleDirectory",
    );

    expect(people).toBeDefined();

    const diff = diffNotionDatabaseSchema(
      databaseWithProperties({
        Active: propertySchema("rich_text"),
        "Slack ID": propertySchema("rich_text"),
        Team: propertySchema("select", {
          select: {
            options: [{ name: "Engineering" }],
          },
        }),
      }),
      people?.specs ?? [],
    );

    expect(diff.missing).toEqual([]);
    expect(diff.typeMismatches).toContainEqual({
      name: "Active",
      expected: "checkbox",
      actual: "rich_text",
    });
  });
});

const config: Phase1NotionConfig = {
  token: "secret",
  apiBaseUrl: "https://api.notion.test/v1",
  apiVersion: "2022-06-28",
  databases: {
    customers: "customers-db",
    conversations: "conversations-db",
    signals: "signals-db",
    workItems: "work-items-db",
    priorityCycles: "priority-cycles-db",
    readinessGates: "readiness-gates-db",
    briefs: "briefs-db",
    botRuns: "bot-runs-db",
    peopleDirectory: "people-db",
  },
};

function databaseWithProperties(properties: NotionDatabase["properties"]): NotionDatabase {
  return {
    object: "database",
    id: "work-items-db",
    title: [{ plain_text: "Bug/feature Tracker" }],
    properties,
  };
}

function propertySchema(
  type: NotionDatabasePropertySchema["type"],
  schema?: Record<string, unknown>,
): NotionDatabasePropertySchema {
  return {
    id: `prop-${type}`,
    type,
    ...schema,
  } as NotionDatabasePropertySchema;
}
